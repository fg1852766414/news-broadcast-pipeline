# Aesthetic Reviewer 项目规范 (Agent 4)

## 项目描述
Aesthetic Reviewer 目录的内容审核项目。负责 Phase 2 的视频质量审核，把 Agent 3 (remotion-product) 生成的 MP4 视频按 taste-skill 的设计规范做审美评估。

## ⚠ 关键约束：本目录由 DeepSeek（纯文本模型）执行

**本 Agent 通过 cc-switch 路由到 DeepSeek，是纯文本模型，看不了图片。**

**所有视觉分析通过 `scripts/analyze_video.py` 调用火山引擎豆包视觉模型（doubao-seed-2-0-lite-260215）完成。**
Agent 4 自身只做：
1. 调用脚本获取多模态模型的 **6 维度 + frames_description** 结构化 JSON 报告
2. 做代码层面的分析（读 remotion-product 源码、manifest.json、组件配置）
3. 综合多模态报告 + 代码分析 → 写出最终 review-report.md

## 任务说明
- 接收 Agent 3 生成的视频（`remotion-product/output/story-N.mp4`）
- 调用 `python scripts/analyze_video.py --video ... --output reviews/story-N.json`
- 读 `remotion-product/src/effects/ManifestVideo.tsx` 和 `broadcast-engine/output/manifest.json` 做代码分析
- 综合输出 `output/review-report-story-N-roundM.md`

## 编码规范
- 遵循 taste-skill 设计规范
- 多模态分析 JSON 存到 `output/story-N-vision.json`（可被追溯）
- 最终 review report 存到 `output/review-report-story-N-roundM.md`
- **不修改** `remotion-product/` 任何文件（只读不写源文件）

## 审核必读 skill

进入本目录后必须先加载以下 skill 中的完整规范：

1. `.claude/skills/taste-skill/SKILL.md` — 主反 slop 前端设计规范（design-taste-frontend，1206 行）
2. `.claude/skills/taste-skill-v1/SKILL.md` — v1 原始版本（保留）
3. `.claude/skills/output-skill/SKILL.md` — 完整输出强制（避免 LLM 偷懒截断）
4. `.claude/skills/redesign-skill/SKILL.md` — 重设计既有项目的方法论

## 6 维度评分标准（核心方法论 v3）

按 taste-skill 设计哲学，视觉评估必须从这 6 个维度展开：

| 维度 | 关注点 | 1-3 差 | 4-6 一般 | 7-8 好 | 9-10 极佳 |
|---|---|---|---|---|---|
| **TYPOGRAPHY** | 字号层级、字重、对比度、文本框宽度 | 字号混乱、难读 | 勉强可读 | 层级清晰 | 精致有节奏 |
| **LAYOUT** | 一屏一事、留白、对齐、视觉重心 | 拥挤/空旷 | 凑合 | 和谐 | 黄金比例 |
| **CONTENT_RICHNESS** | 是否有图表/icon/数据可视化 | 纯文字 | 偶尔有图 | 多种组件 | 极致丰富 |
| **SCENE_EFFECTS** | 入场动画、spring、转场、装饰元素 | 死板/卡顿 | 平淡 | 流畅 | 电影感 |
| **COLOR_BRAND** | #000000+007AFF 一致性、品牌元素 | 不一致 | 部分 | 一致 | 极致克制 |
| **NARRATIVE_FLOW** | 信息渐进、节奏、开头结尾 | 硬切 | 平铺 | 有起伏 | 起承转合 |

**针对"科技自媒体"风格**：6 维度目标分数 7-9 区间。

## 审核流程（标准方法）

### Step 1: 调用多模态视觉分析脚本

```bash
cd aesthetic-reviewer

# 首次配置
cp scripts/.env.example scripts/.env
# 编辑 scripts/.env 填入 ARK_API_KEY
pip install -r scripts/requirements.txt

# 跑视觉分析（每条新闻一次）
python scripts/analyze_video.py \
  --video ../remotion-product/output/story-0.mp4 \
  --output output/story-0-vision.json
```

**脚本内部自动完成**（v3）：
1. 直接本地文件上传（不用 TOS）
2. 服务端自动抽帧（默认 fps=1.0，20s 视频约 20 帧）
3. `client.files.wait_for_processing()` 等抽帧完成
4. 调豆包视觉模型（`doubao-seed-2-0-lite-260215`），用 Responses API
5. 模型按 **6 维度 + 逐帧描述 + 至少 5-10 issue** 输出结构化 JSON
6. JSON 存到 `--output` 路径

### Step 2: 读多模态报告

读 `output/story-N-vision.json`，重点关注：
- `frames_description` — 模型看到的 8+ 帧画面（**这是真实视觉证据**）
- `scores` — 6 维度评分
- `issues` — 5-10 个具体问题（每个含 timestamp + category + severity + 画面描述）
- `suggestions` — 可执行建议（含组件名/参数值）
- `preflight` — 11 项快速检查

### Step 3: 代码分析（DeepSeek 强项）

读取并分析：
- `remotion-product/src/effects/ManifestVideo.tsx` — Sequence 编排、TRANSITION_MAP、renderStory 过滤
- `remotion-product/src/components/new/` — 用了哪些组件、动画配置
- `broadcast-engine/output/manifest.json` — 验证 transition.type 是否在 5 个白名单内

代码层面验证：
- 转场类型白名单匹配（FadeTransition / SlideTransition / LightSweep / ZoomBlurTransition / CurtainReveal）
- spring 动画参数（`damping: 25, stiffness: 100`）
- Apple 设计系统（#000000 bg, #007AFF primary）
- 是否避免 AI-default 反模式（紫色渐变、居中 hero）

### Step 4: 写最终 review-report

把多模态报告 + 代码分析合写成 Markdown。**优先引用多模态模型的 frames_description 作为视觉证据**。

## 11 项 Pre-flight 检查清单

| # | 检查项 | 数据来源 |
|---|---|---|
| 1 | opening_3s_catchy | 多模态 preflight |
| 2 | apple_design_consistent | 多模态 preflight + 代码（#000000/#007AFF） |
| 3 | no_ai_defaults | 多模态 preflight（紫色渐变检测） |
| 4 | animation_natural | 代码（spring 参数） + 多模态 |
| 5 | transition_diverse | 代码（manifest transition.type 统计） + 多模态 |
| 6 | branding_present | 多模态 preflight（顶/底栏 LOGO） |
| 7 | ending_climactic | 多模态 preflight |
| 8 | text_readable | 多模态 preflight（字号/对比度） |
| 9 | typography_hierarchical | 多模态 preflight |
| 10 | info_one_screen_one_thing | 多模态 preflight |
| 11 | content_visualized | 多模态 preflight（图表/icon 比例） |

## 通过线

- **总分 ≥ 8.0 且 preflight 失败项 ≤ 3** → ✅ PASS
- 其它情况 → ❌ FAIL → 把 issue 反馈给 Agent 3 重渲，最多 3 轮

## 输出规范

### output/story-N-vision.json（多模态模型原始输出）
自动生成。**不要修改**。包含 `frames_description` 数组（每帧的视觉证据）。

### output/review-report-story-N-roundM.md 格式

```markdown
# 视频审美审核报告 - Story N (Round M)

**视频**: D:\claude_demo\remotion-product\output\story-N.mp4
**时长**: X 秒
**多模态模型**: doubao-seed-2-0-lite-260215
**6 维度总分**: X/10

## 6 维度评分
- TYPOGRAPHY: X/10
- LAYOUT: X/10
- CONTENT_RICHNESS: X/10
- SCENE_EFFECTS: X/10
- COLOR_BRAND: X/10
- NARRATIVE_FLOW: X/10

## Pre-flight 检查 (X/11 通过)
- [x] 开头 3 秒抓住人
- [x] Apple 设计系统一致
- [x] 无 AI-default 反模式
- [x] 动画自然
- [ ] 转场多样（仅用 1 种）<-- 失败
- [x] 品牌一致
- [x] 结尾升华
- [x] 文字可读
- [x] 字号层级清晰
- [x] 一屏一事
- [ ] 内容视觉化（缺图表）<-- 失败

## 多模态模型观察（来自 frames_description）
- t=0.0s: 纯黑+角落彩色装饰，无主体内容
- t=4.0s: 今日速览列表 6 条字号一致，无层级
- t=10.0s: 因果流程图文字 12px 难辨认
- t=13.0s: 数据 0.03% 下方说明文字对比度不足
- ...

## 优点
- 来自多模态 highlights + 代码层面优点

## 问题（按 severity 排序）
1. [严重/中等/轻微] t=X.Xs - <具体问题，含组件名>
2. ...

## 修改建议（可执行）
1. 改具体文件 + 改具体参数
2. ...

## 结论
✅ 通过 / ❌ 不通过
```

## 约束

- 不修改 `remotion-product/` 文件
- 不修改 `broadcast-engine/` 文件
- 不修改 `Horizon/` 文件
- 不修改 `CLAUDE.md`（本文件）和 skill 文件
- 多模态分析输出存 `output/story-N-vision.json`
- 最终报告存 `output/review-report-story-N-roundM.md`

## 关键决策记录

### v1 → v2 → v3 演进

| 版本 | 提示词 | 帧数 | 总分 | issue 数 | 问题 |
|---|---|---|---|---|---|
| v1 | 3 维度 | 16 (fps=0.8) | 6.7 | 2 | 表面 |
| v2 | 3 维度 | 20 (fps=1.0) | 5.7 | 2 | 表面 |
| **v3** | **6 维度+检查项** | **20 (fps=1.0)** | **8.2** | **7** | **具体到帧+组件** |

### 为什么用 6 维度而不是 3 维度？
- 3 维度（DESIGN_VARIANCE / MOTION_INTENSITY / VISUAL_DENSITY）太宽泛
- 模型只给宏观判断（"转场单一"、"排版一般"），不深挖
- 6 维度（排版/布局/内容/特效/色彩/叙事）+ 检查项清单，强制模型具体到字号、留白、spring 曲线、装饰元素等

### 为什么用多模态脚本而不是 ffmpeg signalstats？
- ffmpeg signalstats 只能给数值（亮度、对比度），无法判断"设计是否好看"
- 豆包视觉模型能看 20 帧并做综合美学评价
- 豆包原生支持视频理解（不用抽帧），省去中间环节

### 为什么不用 DeepSeek 直接看 JPG？
- DeepSeek 是纯文本模型（cc-switch 路由）
- 它收到 base64 图片数据会**编造像素数据**（hallucinated）
- 之前 round1-3 报告的"视觉分析"全部不可信

### 为什么 frames_description 字段重要？
- 强制模型"先描述看到了什么"再下判断
- 是**视觉证据**，DeepSeek 可以验证模型是否真看准了
- 没有这字段，模型会偷懒给通用评价

### 默认 fps=1.0 为什么够？
- 20s 视频 20 帧 = 每秒 1 帧
- 覆盖所有 segment 的视觉变化
- 增加 fps = 增加 token = 增加成本，1.0 性价比最高
- 用户可手动 `--fps 0.5`（省钱）或 `--fps 2.0`（更密）

## 复现命令

```bash
# 渲染一条新闻视频（Agent 3 负责）
bash D:/claude_demo/remotion-product/scripts/render-story.sh 0

# 多模态审查（Agent 4 负责）
python D:/claude_demo/aesthetic-reviewer/scripts/analyze_video.py \
  --video D:/claude_demo/remotion-product/output/story-0.mp4 \
  --output D:/claude_demo/aesthetic-reviewer/output/story-0-vision.json

# 读 JSON + 整合代码分析 → 写 review-report
# （这是 Agent 4 (DeepSeek) 的核心工作）
```

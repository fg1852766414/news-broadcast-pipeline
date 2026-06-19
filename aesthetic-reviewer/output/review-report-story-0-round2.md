# 视频审美审核报告 — story-0 Round 2

**视频**: D:\claude_demo\remotion-product\output\story-0.mp4
**时长**: 20.5 秒（615 帧 @ 30fps）
**分辨率**: 1920 × 1080 (16:9)
**内容**: 开场 Intro (帧 0-149) + 新闻1 Anthropic Fable 暗箱操作 (帧 150-615)

**Dial 配置**: DESIGN_VARIANCE 7 / MOTION_INTENSITY 6 / VISUAL_DENSITY 4
**审核日期**: 2026-06-12
**审核轮次**: 第 2 轮（Agent 3 已完成上一轮修复）

---

## 上一轮修复验证

### 已修复的改动
1. **BackgroundLayer opacity: 0.07 → 0.15** — 已确认（BackgroundLayer.tsx 第 36 行 opacity: 0.15）
2. **BackgroundLayer 弧线 opacity 和 strokeWidth 增加** — 已确认（弧线 strokeWidth: 0.6, opacity: 0.18；第二弧线 strokeWidth: 0.3, opacity: 0.06）
3. **HeroTitle 新增蓝色 accent 线** — 已确认（HeroTitle.tsx 第 57-67 行，80px 宽、3px 高、#007AFF 色）

### 但上一轮的两个严重问题未修复
4. **[P0] 转场系统** — CrossFade 仍然忽略 manifest.json 中的 `transition.type` 声明。所有 8 种转场（dissolve/slide/wipe/clock-wipe/zoom-blur/linear-blur/film-burn）仍然被统一的透明度淡入淡出替代。**未修复。**
5. **[P0] CrossFade 帧计算 bug** — CrossFade 中的 `useCurrentFrame()` 返回全局帧而非 Sequence 相对帧。**未修复。** 该 bug 导致从第二个 Segment 开始（seg-intro-2 后半段到 seg-1-reaction），中心内容区域的 opacity 计算错误，内容实际上被渲染但 opacity=0 导致不可见。

---

## 像素级量化分析

使用 ffmpeg 提取 8 个关键帧 + PIL/NumPy 像素亮度分析：

| 时间 | 场景 | 中心亮度均值 | 中心亮度 p99 | 可见内容占比 | 状态 |
|------|------|-------------|-------------|-------------|------|
| 0.033s | 开场首帧 | 0.0 | 1 | 0.00% | 全黑（正常） |
| **0.5s** | **HeroTitle "Horizon Tech"** | **11.9** | **217** | **1.50%** | **内容可见** |
| 2.0s | seg-intro-1→2 过渡 | 1.1 | 58 | 0.10% | 几乎不可见 |
| **5.0s** | **AnimatedList 速览** | **14.6** | **235** | **4.11%** | **内容可见** |
| **8.0s** | **seg-1-hook HeroTitle** | **0.0** | **1** | **0.00%** | **完全不可见 — BUG** |
| **11.0s** | **seg-1-context CausalGraph** | **0.0** | **1** | **0.00%** | **完全不可见 — BUG** |
| 14.0s | seg-1-data DataHighlight | 1.8 | 71 | 0.90% | 几乎不可见 |
| 18.0s | seg-1-detail→reaction | 0.0 | 1 | 0.00% | 完全不可见 |

**关键发现**: 8.0s、11.0s 和 18.0s 的中心内容区域亮度均值为 0.0，p99=1。这意味着这些帧的中心 50% 屏幕区域中，99% 的像素亮度 ≤ 1（几乎全黑）。内容虽然被 Remotion 渲染但 opacity 被 CrossFade bug 设置为 0。

**顶部/底部栏始终可见**: Top bar (mean=1.8-6.7, max=255) 和 Bottom bar (mean=2.6-3.4, max=255) 在所有帧中都有可见像素。OverlayLayer 工作正常，但内容层不可见。

---

## 严重问题：CrossFade `useCurrentFrame()` 帧计算 Bug

**问题代码**: `D:\claude_demo\remotion-product\src\effects\ManifestVideo.tsx` 第 1972-1985 行

```typescript
const CrossFade: React.FC<{
  children: React.ReactNode;
  contentDuration: number;
}> = ({ children, contentDuration }) => {
  const frame = useCurrentFrame();
  const tf = Math.min(15, contentDuration / 3);
  const opacity = interpolate(
    frame,
    [0, tf, contentDuration - tf, contentDuration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
```

**bug 机制**: `useCurrentFrame()` 在 Remotion v4 的 `<Sequence>` 组件内部返回的是**全局帧**而非 Sequence 的相对帧。当 CrossFade 被包裹在 `from=75` 的 Sequence 内时：
- 全局帧 200 → `frame = 200`（错误，应为 `200 - 75 = 125`）
- `contentDuration = 75`
- `interpolate(200, [0, 15, 60, 75])` → 200 > 75 → extrapolateRight="clamp" → **opacity = 0**

**影响范围**: 所有 seg-intro-2 之后的场景（帧 75+）都受此影响。第二个 Sequence（seg-intro-2）的后半段以及后续所有 Sequence 的内容均不可见。视频 20.5 秒中约 **15 秒（75%）的内容实际上不可见**。

**修复方案**: 两种方法之一：
1. 向 CrossFade 传入 `Sequence.from` 值并减去它：`const frame = useCurrentFrame() - (sequenceFrom || 0);`
2. 在 ManifestVideo 的渲染循环中，直接计算当前 Sequence 的相对帧，不依赖 `useCurrentFrame()` 在 Sequence 内的行为

推荐方法 1（最小改动）：
```typescript
// CrossFade 接收 from prop
const CrossFade: React.FC<{
  children: React.ReactNode;
  contentDuration: number;
  from: number;  // 新增
}> = ({ children, contentDuration, from }) => {
  const frame = useCurrentFrame() - from;  // 修正为相对帧
  const tf = Math.min(15, contentDuration / 3);
  const opacity = interpolate(
    frame,
    [0, tf, contentDuration - tf, contentDuration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
```

然后在第 2068 行传入 `from`：
```typescript
<CrossFade contentDuration={seg.duration} from={from}>
```

---

## Pre-flight 检查清单（8 项 × 1.25 分）

### 1. [0.50/1.25] 开头 3 秒能否抓住人？

**HeroTitle 场景（帧 0-75，~2.5 秒）:**
- "Horizon Tech" 标题 + "今日热点 · 2026.06.11" 副标题 + 蓝色 accent 线（上一轮新增）在 0.5s 可见（中心亮度 p99=217）
- **优点**: 蓝色 accent 线增加了一点视觉层次。干净、Apple 风格。
- **问题**: 开场前 15 帧（0.5 秒）几乎全黑（LightLeak 叠加导致）。品牌标识只有文字没有图形 logo。120px 纯白文字在纯黑背景上的视觉冲击力有限。
- **改进建议**: 在 HeroTitle 前加入品牌 Logo 动画（约 15 帧）；增加背景 subtle glow；开场首帧不应全黑。

### 2. [0.80/1.25] 视觉风格是否一致？

- 色调统一：纯黑背景、#007AFF 苹果蓝主色、白色主文字、#8E8E93 次文字 — **好**
- OverlayLayer 使用 `rgba(0,0,0,0.7)` + `backdrop-filter: blur(10px)` Apple 风格 — **好**
- 字体统一 SF Pro Display/Text — **好**
- **但** 所有内容场景的视觉风格无法评估，因为 CrossFade bug 导致帧 150+ 的内容不可见
- **但** 纯黑 `#000000` 仍然违反 taste-skill 8.B（"No pure #000000"）

### 3. [0.70/1.25] 是否有 AI-default 反模式？

- 无紫色渐变 — **好**
- 无通用 glassmorphism — **好**
- 无三个相等卡片 — **好**
- 无 em-dash — **通过**
- **但是** HeroTitle 居中布局（taste-skill 4.3: VARIANCE > 4 应避免居中 hero）— 未改善
- **但是** 纯黑 `#000000` 背景（taste-skill 9.A: 禁止纯黑）— 未改善
- **但是** OverlayLayer 使用了**纯黑文字阴影** — 装饰 Circle 和 Star 使用 `#007AFF`、`#AF52DE`、`#FF9F0A`、`#34C759` 四种颜色，虽然符合 Apple 设计但颜色数量较多（taste-skill 4.2: "Max 1 accent color"）

### 4. [0.50/1.25] 动画是否自然？

- 可见的入场动画（HeroTitle、AnimatedList）使用 `spring({ damping: 25, stiffness: 100 })` — **规范执行到位**
- CameraMotionBlur(shutterAngle=180) 全局运动模糊 — **好**
- 前 45 帧 LightLeak 光晕 — **好**
- **但是** 由于 CrossFade bug，大部分场景的内容动画无法被看到
- **但是** AnimatedList 的列表项依次滑入动画执行正确
- **注意** spring 动画本身没有问题，bug 在 CrossFade 的透明度计算

### 5. [0.30/1.25] 转场是否流畅？

- **问题依然存在**: 转场系统完全未修复
- manifest.json 声明 8 种转场类型（dissolve/slide/wipe/clock-wipe/zoom-blur/linear-blur/film-burn）
- CrossFade 仍然忽略所有 `transition.type`，全部使用同一个透明度线性淡入淡出
- 可用的转场组件（`FadeTransition.tsx`、`SlideTransition.tsx`、`ZoomBlurTransition.tsx`、`CurtainReveal.tsx`）存在于 `src/components/new/` 但从未被调用
- **实际上** 由于 CrossFade 的帧计算 bug，连透明度淡入淡出在大多数场景也不正确

### 6. [0.60/1.25] 信息密度是否合适？

- 开场 2.5 秒: "Horizon Tech" + 日期 — **合适**
- 开场第二段 2.5 秒: 6 条速览列表 — **合适**（在 5.0s 可见）
- 新闻 hook 4 秒 → context 3 秒 → data 2.5 秒 → detail 3.5 秒 → reaction 2.5 秒 — **结构优秀**（但内容不可见无法评估）
- 每个场景文本量适中 — **好**
- 评分偏低是因为大部分内容不可见，无法评估信息密度

### 7. [1.10/1.25] 是否有统一的顶/底栏品牌？

- OverlayLayer 顶部栏（60px，项目名+日期+进度条）— **在所有帧中持续可见**
- 底部栏（80px，订阅+分段计数）— **在所有帧中持续可见**
- 进度条实时反映播放进度 — **优秀**
- 品牌名 "Horizon Tech" 持续显示
- 这是唯一在所有帧中正常工作、持续可见的系统

### 8. [0.50/1.25] 结尾是否有升华？

- story-0 的结尾是 seg-1-reaction（社区金句）
- 内容不可见（CrossFade bug 导致 18.0s 全黑）
- 作为独立片段缺少总结性点睛之笔
- 上一轮建议未改善

---

## 总分

| 项目 | 得分 | 满分 | 与上轮对比 |
|------|------|------|-----------|
| 1. 开头抓人 | 0.50 | 1.25 | ↓ 0.50（蓝色 accent 线有改善但不够） |
| 2. 视觉风格一致 | 0.80 | 1.25 | ↓ 0.20（不可评估完整一致性） |
| 3. AI-default 反模式 | 0.70 | 1.25 | ↓ 0.30（居中 Hero 和纯黑未修复） |
| 4. 动画自然 | 0.50 | 1.25 | ↓ 0.60（大部分动画不可见） |
| 5. 转场流畅 | 0.30 | 1.25 | ↓ 0.20（转场系统完全未修复） |
| 6. 信息密度合适 | 0.60 | 1.25 | ↓ 0.50（大部分内容不可见） |
| 7. 品牌一致性 | 1.10 | 1.25 | —（唯一工作正常的系统） |
| 8. 结尾升华 | 0.50 | 1.25 | ↓ 0.30（内容不可见） |
| **总分** | **5.00** | **10.00** | **↓ 2.60** |

> **判定: FAIL (5.00/10 < 8.00) — 分数相比上一轮下降，因为大部分内容因 CrossFade bug 不可见**

---

## 核心问题分析

### [严重][P0] CrossFade useCurrentFrame 帧计算 Bug — 内容 75% 不可见

- **根因**: CrossFade 组件使用 `useCurrentFrame()` 返回的**全局帧**计算透明度，而非 Sequence 的**相对帧**
- **影响**: 从 seg-intro-2（帧 75+）开始，所有后续 Sequence 的内容被 CrossFade 错误地设置为 opacity=0
- **客观数据**: 帧 8.0s、11.0s、18.0s 的中心区域亮度均值 0.0，p99=1（99% 像素亮度 ≤ 1）
- **唯一可见的内容**: HeroTitle（帧 0-75）和 AnimatedList 的开头部分（帧 75-~120），以及 OverlayLayer 顶/底栏
- **修复**: 向 CrossFade 传入 `from` 参数并在计算 opacity 时减去 `from`

### [严重][P0] 转场系统未实现

- **问题**: manifest.json 声明 8 种转场类型，CrossFade 完全忽略
- **修复**: 根据 `seg.transition.type` 映射到对应的转场组件

### [中等][P1] HeroTitle 视觉深度不足（部分改善）

- 新增了蓝色 accent 线（80px × 3px）— **改善**
- 但仍是纯居中 + 纯黑白模式
- 建议增加背景光晕、left-aligned 布局选项、或品牌 Logo 动画

### [中等][P1] 纯黑背景 #000000

- 未修复
- 建议改为 `#0a0a0a` 或 `#050505`

### [轻微][P2] BackgroundLayer 可见度（已改善）

- opacity 从 0.07 提升到 0.15 — **修复确认**
- 弧线 strokeWidth 和 opacity 增加 — **修复确认**

---

## Three Dials 重新评分

### DESIGN_VARIANCE: 4/10
- 从上一轮的 7/10 降至 4/10，因为大部分内容不可见，无法评估布局变化
- HeroTitle 仍然居中（VARIANCE > 4 时不应居中）
- 可见的 AnimatedList 和 OverlayLayer 布局合理

### MOTION_INTENSITY: 4/10
- 从上一轮的 6/10 降至 4/10，因为大部分动画不可见
- 可见的 spring 动画执行正确
- CrossFade bug 导致关键动画丢失

### VISUAL_DENSITY: 3/10
- 从上一轮的 4/10 降至 3/10，因为无法评估完整内容密度
- OverlayLayer 占用约 15% 屏幕空间
- BackgroundLayer 改善后应该提供了更多视觉层次（但大部分时间不可见）

---

## 修改建议（按优先级排序）

### P0 — 必须在下次评审前修复

1. **修复 CrossFade 帧计算 Bug**
   - 文件: `D:\claude_demo\remotion-product\src\effects\ManifestVideo.tsx` 第 1972-1985 行
   - 向 CrossFade 传入 `from` prop，在计算 opacity 时使用 `useCurrentFrame() - from`
   - 修改第 2068 行 `<CrossFade contentDuration={seg.duration}>` → `<CrossFade contentDuration={seg.duration} from={from}>`

2. **实现转场映射系统**
   - 根据 `seg.transition.type` 选择不同的转场组件
   - 映射关系:
     ```
     "dissolve" → CrossFade（当前实现）
     "fade" → FadeTransition
     "slide" → SlideTransition
     "wipe" → LightSweep
     "zoom-blur" → ZoomBlurTransition
     "clock-wipe" → CurtainReveal
     "linear-blur" → FadeTransition（无 blur 变体时）
     "film-burn" → CurtainReveal
     ```

### P1 — 建议改进

3. **丰富 HeroTitle 视觉深度**
   - 增加 left-aligned 布局选项（`alignItems: "flex-start"`, `paddingLeft: 120`）
   - 增加背景 subtle gradient glow（使用径向渐变）
   - 品牌 Logo 动画（如 SVG 标志在文字上方淡入）

4. **替换纯黑背景**
   - `#000000` → `#0a0a0a`（ManifestVideo.tsx 第 2038 行）
   - OverlayLayer.tsx 中相关的背景色

### P2 — 锦上添花

5. **减少 OverlayLayer 装饰颜色数量**
   - 当前使用 4 种颜色（#007AFF、#AF52DE、#FF9F0A、#34C759）
   - 建议统一为 #007AFF 苹果蓝 + 白色两种

---

## 结论

**FAIL (5.00/10)** — 分数相比上一轮（7.60/10）下降 2.6 分，主要原因是 CrossFade 的 `useCurrentFrame()` 帧计算 bug 导致视频中约 75% 的内容（帧 150+）实际上不可见。修复了 BackgroundLayer opacity（0.07→0.15）和 HeroTitle 蓝色 accent 线，但**两个 P0 问题（转场系统 + 帧计算 bug）均未修复**。

OverlayLayer（顶/底栏）是唯一在所有帧中正常工作的系统。内容组件本身的设计和动画质量尚可，但被 CrossFade 的透明度计算错误掩盖。

### 循环状态
- 当前迭代: 第 2 轮审核
- 最大循环: 3 次
- **判定: FAIL**
- 下次审核: 修复 P0 问题（特别是 CrossFade 帧计算 bug）后重新提交

---

*审核人: Agent 4 (Aesthetic Reviewer)*
*基于 taste-skill (design-taste-frontend) + redesign-skill + output-skill 规范*
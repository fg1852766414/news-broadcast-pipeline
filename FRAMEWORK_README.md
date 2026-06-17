# 6-Agent 多 Agent 工作流编排框架

## 项目结构

```
D:\claude_demo\
├── Horizon/                      ← Agent 1: AI 新闻聚合系统（已有完整项目）
│   ├── src/                      # Python 源码
│   ├── data/enriched/            # 已处理的丰富新闻数据
│   ├── data/summaries/           # AI 生成的每日摘要
│   └── output/                   # Agent 1 输出产物
│
├── broadcast-engine/             ← Agent 2: 广播稿生成引擎（已有完整项目）
│   ├── src/                      # Python 源码
│   └── output/                   # Agent 2 输出产物
│
├── remotion-product/             ← Agent 3 & 5: 视频制作项目
│   ├── src/
│   │   ├── components/           # Remotion 视频组件
│   │   │   ├── OpeningTitle.tsx   # 开幕标题组件（seendance 动画）
│   │   │   ├── NewsItemCard.tsx   # 新闻条目展示组件
│   │   │   ├── ClosingCredits.tsx # 闭幕致谢组件
│   │   │   ├── NewsBroadcast.tsx  # 主视频合成组件
│   │   │   └── SeendanceText.tsx  # 动态文字动画组件
│   │   ├── styles/seendance.ts   # 动画工具函数
│   │   ├── data.ts               # 示例数据
│   │   ├── dataLoader.ts         # 动态数据加载桥接
│   │   ├── integration-entry.ts  # 合成视频入口
│   │   ├── Root.tsx              # Remotion 主入口
│   │   └── index.ts              # 注册入口
│   ├── composite-script/         # Agent 5: 合成视频脚本目录
│   │   ├── composite-video.tsx   # 合成视频配置
│   │   └── CompositeBroadcast.tsx # 合成广播组件
│   └── output/                   # 视频渲染输出
│
├── scripts/                      # 流水线脚本
│   ├── orchestrator.sh           # 主编排脚本（bash）
│   └── data-bridge.py            # Horizon → Remotion 数据桥接
│
├── reports/                      # 审核报告目录
├── final-output/                 # 最终产物输出
│
├── pipeline.json                 # 数据契约与管道配置
├── .claude/workflow-config.json  # Agent 工作流配置
└── README.md                     # 本文件
```

## 6-Agent 工作流

```
Phase 1 [并行]              Phase 2 [循环]           Phase 3 [串行]         Phase 4 [循环]
┌──────────┐                ┌────────────┐          ┌─────────────┐       ┌────────────┐
│ Agent 1  │── Horizon ──▶  │            │          │             │       │            │
│ 内容处理  │               │ Agent 4   │◀─ 审核 ──│  Agent 5    │──▶    │  Agent 6   │
├──────────┤                │ 审美审核   │──通过──▶│  合成脚本    │       │  终审     │
│ Agent 2  │── BE ──────▶  │            │          │             │       │            │
│ 广播稿生成│               │  │  ▲      │          │             │       │ ──通过──▶  │
├──────────┤                │  │  └──────┘          │             │       │   最终输出  │
│ Agent 3  │── Remotion ──▶  │ 退回(最多3次)       │      ▲      │       │    │       │
│ 视频制作  │               └────────────┘           └──────│─────┘       └────│───┘
└──────────┘                                              │               │
                                                          └───────────────┘
                                                            退回修改（无限循环）
```

## 数据流转

```
Horizon 丰富新闻数据 (JSON)
    │
    ├──→ Agent 1: 生成摘要/排行/分类统计 → output/
    │
    ├──→ Agent 2: 生成广播稿脚本 → output/
    │
    └──→ [Data Bridge]: scripts/data-bridge.py
              │
              └──→ remotion-product/src/data/remotion-data.json
                        │
                        └──→ Agent 3: Remotion 视频组件
                                    │
                                    └──→ Agent 4: 审美审核
                                                │ (通过)
                                                └──→ Agent 5: 合成视频脚本
                                                            │
                                                            └──→ Agent 6: 终审 → final-output/
```

## 使用方式

### 1. 数据桥接（将 Horizon 数据转为 Remotion 格式）

```bash
# 从 Horizon 数据生成 Remotion 可用的 JSON
uv run python scripts/data-bridge.py --date 2026-06-11 --lang zh
```

### 2. 运行视频制作

```bash
# 启动 Remotion Studio
cd remotion-product && npx remotion studio

# 渲染视频
cd remotion-product && npm run build
```

### 3. 全自动流水线

```bash
# 预览流水线（不执行）
bash scripts/orchestrator.sh --dry-run

# 从 Phase 1 开始完整执行
bash scripts/orchestrator.sh

# 从指定阶段开始
bash scripts/orchestrator.sh --phase 3
```

### 4. 执行 6-Agent 工作流（在 Claude Code 中）

在 Claude Code 会话中，执行以下命令加载编排配置：

```bash
# 查看编排提示模板
cat ".claude/workflow-config.json" | python -m json.tool
```

然后执行编排器即可启动完整的 6-Agent 流水线。

## 各 Agent 职责

| Agent | 角色 | 目录 | 产出 |
|-------|------|------|------|
| Agent 1 | Horizon 内容处理 | `Horizon/` | 摘要报告、排行、统计数据 |
| Agent 2 | 广播稿生成 | `broadcast-engine/` | 中英文广播稿 |
| Agent 3 | Remotion 视频制作 | `remotion-product/` | MP4 视频 |
| Agent 4 | 审美审核 | - | 审核报告 (review-report.md) |
| Agent 5 | 合成脚本开发 | `remotion-product/composite-script/` | 合成视频脚本 |
| Agent 6 | 终审 | - | 最终产物 + 审核报告 |

## 数据契约

参见 `pipeline.json` 中的完整数据契约定义。核心数据格式：

- **horizon_item**: Horizon 丰富新闻条目格式
- **broadcast_script**: 广播稿 Markdown 格式
- **remotion_video**: Remotion 视频输出格式
- **review_report**: 审核报告格式
- **composite_script**: 合成视频脚本格式

## 视频技术参数

- 分辨率: 1920 × 1080 (1080p)
- 帧率: 30 FPS
- 编码: H.264
- 开幕时长: 3 秒 (90 帧)
- 每条新闻: 2.5 秒 (75 帧)
- 闭幕时长: 3 秒 (90 帧)
- 视觉效果: Seendance 文字动画、渐变、粒子背景、弹入动画
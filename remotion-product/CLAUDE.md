# Remotion 视频制作规范

## 前置要求
在执行视频制作任务前，必须先加载以下两个 skill 中的完整规范：
1. `.claude/skills/remotion/SKILL.md` — Remotion 官方最佳实践（Sequence 用法、媒体资源、Studio 预览）
2. `.claude/skills/remotion-com-skills/SKILL.md` — 自定义组件库规范（27 个组件、Apple 设计系统、动画约束）

## 设计规范
- **Apple 风格**: 纯黑背景 (#000000) + 苹果蓝主色 (#007AFF)
- 卡片底色: #1C1C1E，主文字白色，次文字 #8E8E93
- 成功色: #34C759，警告: #FF9F0A，错误: #FF453A，紫色: #AF52DE
- 字体: 标题用 SF Pro Display，正文用 SF Pro Text，代码用 JetBrains Mono
- 大字号: Hero 标题 120px，H1 88px

## 动画规范（必须遵守）
- ✅ 全部使用 `useCurrentFrame()` 驱动动画
- ✅ 使用 `spring()` 实现物理动画（damping: 25, stiffness: 100）
- ✅ 使用 `interpolate()` 配合缓动函数
- ✅ 列表项错开动画使用帧延迟
- ❌ 禁止使用 CSS 动画（Remotion 不支持）
- ❌ 禁止使用 Tailwind 动画类（animate-*, transition-*）
- ❌ 禁止使用 emoji，全部用 SVG 图标

## 可用组件库
参考 src/components/new/ 下的组件，包括：
HeroTitle, SectionTitle, CodeTerminal, AnimatedList, FeatureCard, FeatureGrid,
MetricCard, MetricRow, TypewriterText, TypewriterScene, DataTable, ProgressTable,
HighlightQuote, DataHighlight, CommentBubble, CommentBarrage, BottomComment,
CausalGraph, ComparisonCards, ProcessFlow, EvolutionTree, KnowledgeWeb,
FadeTransition, SlideTransition, LightSweep, ZoomBlurTransition, CurtainReveal

详细 Props 定义和用法见 `.claude/skills/remotion-com-skills/SKILL.md`。

## 输出规范
- 所有视频渲染产物放在 output/ 目录
- 渲染命令: npx remotion render src/index.ts <CompositionID> out/video.mp4

## 输入规范（消费 Agent 2 的产物）

从 `broadcast-engine/output/manifest.json` 读取数据：

1. 按 `startFrame`/`endFrame` 对齐每个场景
2. 按 `visual.template` 映射到对应的组件：

| manifest.json template | Remotion 组件 |
|---|---|
| HeroTitle | `<HeroTitle>` |
| CodeTerminal | `<CodeTerminal>` |
| FeatureGrid | `<FeatureGrid>` |
| ComparisonCards | `<ComparisonCards>` |
| EvolutionTree | `<EvolutionTree>` |
| ProcessFlow | `<ProcessFlow>` |
| KnowledgeWeb | `<KnowledgeWeb>` |
| TypewriterScene | `<TypewriterScene>` |
| DataTable | `<DataTable>` |
| HighlightQuote | `<HighlightQuote>` |
| CommentBarrage | `<CommentBarrage>` |
| CausalGraph | `<CausalGraph>` |
| MetricRow | `<MetricRow>` |
| AnimatedList | `<AnimatedList>` |
| SectionTitle | `<SectionTitle>` |
| Transitions | `<FadeTransition>` / `<SlideTransition>` / `<LightSweep>` / `<ZoomBlurTransition>` / `<CurtainReveal>` |

4. `fps` 固定 30，与 manifest.json 保持一致
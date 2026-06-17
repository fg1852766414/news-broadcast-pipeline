---
name: remotion-com-skills
description: Remotion component library for video production — use this skill when generating or editing Remotion video components, compositions, scenes, and transitions in the remotion-product directory. Covers all available UI components (HeroTitle, SectionTitle, CodeTerminal, AnimatedList, FeatureCard, FeatureGrid, MetricCard, MetricRow, TypewriterText, TypewriterScene, DataTable, ProgressTable, HighlightQuote, DataHighlight, CommentBubble, CommentBarrage, BottomComment, CausalGraph, ComparisonCards, ProcessFlow, EvolutionTree, KnowledgeWeb) and transitions (FadeTransition, SlideTransition, LightSweep, ZoomBlurTransition, CurtainReveal). Also covers installed @remotion packages: transitions (19 types), motion-blur, light-leaks, lottie, google-fonts, gif, shapes, paths, preload. Enforces Apple-style design system, Remotion-compatible animation patterns, and output conventions.
version: 1.0.0
---

# Remotion Component Skills (remotion-com-skills)

This skill governs all Remotion video component usage in `remotion-product/`. When making or editing a Remotion component, scene, or video composition, follow these rules.

## Design System

### Colors (Apple Style)
| Token | Hex | Usage |
|---|---|---|
| Background | `#000000` | Main canvas |
| Card BG | `#1C1C1E` | Cards, panels, terminal |
| Card Border | `#2C2C2E` | Dividers, borders, stroke |
| Primary Blue | `#007AFF` | Accent, highlights, CTAs |
| Primary Text | `#FFFFFF` | Main body/heading text |
| Secondary Text | `#8E8E93` | Subtext, metadata, captions |
| Success | `#34C759` | Positive metrics, done states |
| Warning | `#FF9F0A` | Warnings, medium emphasis |
| Error | `#FF453A` | Errors, negative metrics |
| Purple Accent | `#AF52DE` | Secondary accent, comments |

### Typography
- Headings: `"SF Pro Display", "Helvetica Neue", sans-serif`
- Body: `"SF Pro Text", "Helvetica Neue", sans-serif`
- Code/mono: `"JetBrains Mono", "SF Mono", "Courier New", monospace`
- Hero title: 120px, H1: 88px, H2: 56px, H3: 36px
- Body: 15-20px, Caption: 12-14px

### Spacing & Radius
- Card radius: 16px (large), 12px (medium), 8px (small)
- Content padding: 40-60px horizontal
- Card padding: 20-24px internal
- Gaps between cards: 16px

## Animation Rules (MUST FOLLOW)

All animations **must** use Remotion-native APIs only:

```typescript
// ✅ CORRECT — spring-based entrance
import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

const frame = useCurrentFrame();
const { fps } = useVideoConfig();
const anim = spring({
  frame: frame - frameOffset,
  fps,
  config: { damping: 25, stiffness: 100 },
});

// ✅ CORRECT — interpolate with easing
const progress = interpolate(frame - frameOffset, [0, 30], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
```

```typescript
// ❌ WRONG — never use CSS animations
style={{ animation: "fadeIn 1s" }}        // BAD
style={{ transition: "all 0.3s" }}         // BAD
className="animate-bounce"                 // BAD
```

### Stagger Pattern
For lists/groups, offset each item by `i * delay` frames:
```typescript
{items.map((item, i) => {
  const itemSpring = spring({
    frame: frame - frameOffset - i * 5,  // stagger by 5 frames each
    fps,
    config: { damping: 25, stiffness: 100 },
  });
  ...
})}
```

## Available Components (src/components/new/)

Import from `../components/new/<ComponentName>`:

### Text & Headings
| Component | Props | Description |
|---|---|---|
| `HeroTitle` | `title, subtitle?, frameOffset?, accentColor?` | Large 120px hero title for opening |
| `SectionTitle` | `title, subtitle?, accentColor?, frameOffset?` | Section header with accent bar |
| `TypewriterText` | `text, fontSize?, color?, frameOffset?, charsPerFrame?` | Character-by-character typing reveal |
| `TypewriterScene` | `text, subtitle?, fontSize?, frameOffset?, charsPerFrame?, accentColor?` | Full-screen typewriter scene |

### Cards & Lists
| Component | Props | Description |
|---|---|---|
| `FeatureCard` | `title, description, accentColor?, frameOffset?` | Single feature card |
| `FeatureGrid` | `features: [{title, description, accentColor?}], columns?, frameOffset?` | Grid of FeatureCards |
| `AnimatedList` | `items: [{text, subtext?}], frameOffset?, itemDelay?, accentColor?` | Staggered list with dots |
| `MetricCard` | `value, label, unit?, accentColor?, frameOffset?` | Single KPI metric card |
| `MetricRow` | `metrics: [{value, label, unit?, accentColor?}], frameOffset?` | Horizontal row of MetricCards |

### Data Display
| Component | Props | Description |
|---|---|---|
| `DataTable` | `columns: [{key, label, width?}], rows, frameOffset?, accentColor?` | Tabular data with animated rows |
| `ProgressTable` | `rows: [{label, value, maxValue?, color?}], title?, frameOffset?` | Data with progress bars |
| `DataHighlight` | `value, description, accentColor?, frameOffset?, size?` | Large animated data point |
| `CodeTerminal` | `lines: [{text, highlight?, indent?}], title?, frameOffset?, typingSpeed?` | Terminal window with code |

### Quotes & Comments
| Component | Props | Description |
|---|---|---|
| `HighlightQuote` | `quote, author?, accentColor?, frameOffset?, fontSize?` | Pull quote with accent border |
| `CommentBubble` | `author, text, avatarColor?, frameOffset?, isHighlighted?` | Single comment bubble |
| `CommentBarrage` | `comments: [{author, text}], frameOffset?` | Scrolling danmaku overlay |
| `BottomComment` | `text, author, accentColor?, frameOffset?` | Bottom-anchored comment |

### Diagrams & Flow
| Component | Props | Description |
|---|---|---|
| `CausalGraph` | `nodes: [{id, label, x, y, color?}], edges: [{from, to, label?}], frameOffset?` | SVG cause-effect graph |
| `ComparisonCards` | `left: {title, items, color?}, right: {title, items, color?}, frameOffset?` | Side-by-side comparison (A vs B) |
| `ProcessFlow` | `steps: [{title, description}], frameOffset?, accentColor?` | Horizontal connected steps |
| `EvolutionTree` | `root: {id, label, children?}, frameOffset?` | Branching SVG tree structure |
| `KnowledgeWeb` | `centerLabel, nodes: [{id, label, angle, distance, color?}], frameOffset?` | Radial knowledge graph |

### Transitions (wrapping components)
| Component | Props | Description |
|---|---|---|
| `FadeTransition` | `children`, `frameOffset?, duration?, initial?` | Fade-in wrapper |
| `SlideTransition` | `children, direction?, distance?, frameOffset?` | Slide-in wrapper (left/right/up/down) |
| `LightSweep` | `children, frameOffset?, duration?, color?` | Shine sweep overlay |
| `ZoomBlurTransition` | `children, frameOffset?, zoomIn?` | Zoom-in with blur reveal |
| `CurtainReveal` | `children, frameOffset?, curtainColor?` | Curtain opening effect |

## Composition Structure Pattern

When building a multi-scene video, use `Sequence` with `AbsoluteFill`:

```typescript
import { AbsoluteFill, Sequence } from "remotion";
import { HeroTitle } from "./components/new/HeroTitle";
import { AnimatedList } from "./components/new/AnimatedList";
import { FadeTransition } from "./components/new/FadeTransition";

export const MyVideo: React.FC = () => {
  const SCENE_DURATION = 90; // 3 seconds at 30fps

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <Sequence from={0} durationInFrames={SCENE_DURATION}>
        <HeroTitle title="Hello World" frameOffset={10} />
      </Sequence>
      <Sequence from={SCENE_DURATION} durationInFrames={SCENE_DURATION}>
        <AnimatedList items={[{ text: "Item 1" }, { text: "Item 2" }]} />
      </Sequence>
    </AbsoluteFill>
  );
};
```

## Available Compositions

### News Broadcast Compositions (src/components/)

| Composition | Description |
|---|---|
| `NewsBroadcast` | 全景新闻广播：开幕标题 → 逐条新闻 → 闭幕致谢 |
| `OpeningTitle` | 开幕动画：粒子背景 + Seendance 逐字动画 |
| `NewsItemCard` | 新闻条目卡片：分类标签 + 标题 + 摘要 |
| `ClosingCredits` | 闭幕致谢：渐变淡出 + 品牌展示 |
| `SeendanceText` | 逐字弹入动画（seendance 节奏） |

See `src/Root.tsx` for the registered composition.
See `src/data.ts` for the data format.

## Output Convention

- Render target: `output/` directory
- Render command: `npx remotion render src/index.ts <CompositionID> out/video.mp4`
- Composition IDs must be PascalCase and match the exported component name
- Frame rate: 30fps, resolution: 1920x1080
- No emoji anywhere — use inline SVGs or simple geometric shapes instead
- All new components must import from `src/components/new/`

---

## Installed @remotion Packages

The following packages are installed and available for use.

### @remotion/transitions — 19 Scene Transitions

Import and use professional transitions between scenes:

```tsx
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import {
  TransitionSeries,
  fade,
  slide,
  wipe,
  clockWipe,
  zoomBlur,
  dissolve,
} from "@remotion/transitions";

export const MyVideo: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={3 * fps}>
          <Scene1 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade({})}
          timeline={timing({ durationInFrames: 0.5 * fps })}
        />
        <TransitionSeries.Sequence durationInFrames={3 * fps}>
          <Scene2 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-left" })}
          timeline={timing({ durationInFrames: 0.5 * fps })}
        />
        <TransitionSeries.Sequence durationInFrames={3 * fps}>
          <Scene3 />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
```

**Available presentations:**
| Import | Name | Extra Props |
|---|---|---|
| `fade({})` | 淡入淡出过渡 | — |
| `slide({direction})` | 滑动过渡 | `direction`: "from-left" / "from-right" / "from-top" / "from-bottom" |
| `wipe({})` | 擦除过渡 | — |
| `clockWipe({width})` | 时钟擦除 | `width`: number (default: 90) |
| `dissolve({})` | 溶解过渡 | — |
| `zoomBlur({})` | 缩放模糊 | — |
| `crossZoom({})` | 交叉缩放 | — |
| `crosswarp({})` | 交叉变形 | — |
| `dreamyZoom({})` | 梦幻缩放 | — |
| `filmBurn({})` | 胶片烧灼 | — |
| `flip({})` | 翻转过渡 | — |
| `iris({})` | 光圈过渡 | — |
| `linearBlur({})` | 线性模糊 | — |
| `ripple({})` | 波纹过渡 | — |
| `swap({})` | 交换过渡 | — |
| `bookFlip({})` | 翻书过渡 | — |
| `zoomInOut({})` | 缩放出入 | — |

**Timing presets:**
```tsx
import { timing } from "@remotion/transitions";
// timing({ durationInFrames: 15 })  — transition lasts 15 frames (0.5s at 30fps)
```

### @remotion/motion-blur — 运动模糊

两种模式：`CameraMotionBlur`（全局）和 `Trail`（拖尾效果）：

```tsx
import { CameraMotionBlur, Trail } from "@remotion/motion-blur";

// 全局相机运动模糊 — 包裹整个场景
<CameraMotionBlur shutterAngle={180} samples={10}>
  <YourMovingContent />
</CameraMotionBlur>
// shutterAngle: 0-360, 越大模糊越强 (默认180)
// samples: 采样数, 越大质量越高 (默认10)

// 拖尾效果 — 单个元素拖尾
<Trail frames={5}>
  <MovingElement />
</Trail>
// frames: 拖尾帧数
```

### @remotion/light-leaks — 电影级漏光特效

```tsx
import { LightLeak } from "@remotion/light-leaks";

<LightLeak
  evolveDuration={30}    // 漏光出现时长
  retractDuration={30}   // 漏光消退时长
  seed={42}              // 随机种子（不同值产生不同漏光图案）
  retractSeed={99}       // 消退随机种子
  hueShift={0}           // 色相偏移 (0-360)
>
  <YourScene />
</LightLeak>
```

### @remotion/lottie — Lottie 动画图标

```tsx
import { Lottie } from "@remotion/lottie";
import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";

export const AnimatedIcon: React.FC = () => {
  const [handle] = useState(() => delayRender());
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch("https://assets10.lottiefiles.com/pack/icon.json")
      .then((r) => r.json())
      .then((d) => { setAnimationData(d); continueRender(handle); });
  }, [handle]);

  if (!animationData) return null;

  return <Lottie animationData={animationData} loop playbackRate={1} />;
};
```

Get free Lottie animations: https://lottiefiles.com/featured

### @remotion/google-fonts — Google Fonts

```tsx
import { loadFont } from "@remotion/google-fonts/Inter";
// 支持全部 Google Fonts，导入路径格式：@remotion/google-fonts/<FontName>
// 例如：@remotion/google-fonts/NotoSansSC, @remotion/google-fonts/JetBrainsMono

const { fontFamily } = loadFont(); // 加载 Inter 字体

// 然后在样式中使用:
<div style={{ fontFamily }}>Text with Inter font</div>
```

### @remotion/shapes — SVG 图形生成

```tsx
import { Circle, Rect, Triangle, Star, Pentagon, Ellipse } from "@remotion/shapes";

<Circle radius={100} fill="#007AFF" />         // 圆形
<Rect width={200} height={100} fill="#34C759" /> // 矩形
<Triangle length={150} fill="#FF9F0A" />        // 三角形
<Star innerRadius={40} outerRadius={100} fill="#FF453A" points={5} />  // 五角星
<Pentagon radius={80} fill="#AF52DE" />         // 五边形
<Ellipse rx={120} ry={60} fill="#007AFF" />     // 椭圆
```

### @remotion/gif — GIF 动图

```tsx
import { Gif } from "@remotion/gif";
import { staticFile } from "remotion";

<Gif src={staticFile("animation.gif")} style={{ width: 200 }} />
// 也支持远程 URL
<Gif src="https://example.com/animation.gif" width={300} />
```

### @remotion/preload — 资源预加载

```tsx
import { preloadAudio, preloadVideo, preloadImage } from "@remotion/preload";

// 在 delayRender/continueRender 块中预先加载资源
const [handle] = useState(() => delayRender());
useEffect(() => {
  preloadImage("https://example.com/image.jpg").then(() => continueRender(handle));
}, [handle]);
```

## Visual Enhancement Recipes

### 新闻标题 + 运动模糊入场

```tsx
import { CameraMotionBlur } from "@remotion/motion-blur";

<CameraMotionBlur shutterAngle={200} samples={8}>
  <HeroTitle title="Breaking News" subtitle="AI Revolution" />
</CameraMotionBlur>
```

### 场景切换 + 过渡特效

```tsx
import { TransitionSeries, fade, slide } from "@remotion/transitions";
import { timing } from "@remotion/transitions";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={90}>
    <Scene1 />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    presentation={fade({})}
    timeline={timing({ durationInFrames: 15 })}
  />
  <TransitionSeries.Sequence durationInFrames={150}>
    <Scene2 />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    presentation={slide({ direction: "from-left" })}
    timeline={timing({ durationInFrames: 20 })}
  />
  <TransitionSeries.Sequence durationInFrames={90}>
    <Scene3 />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

### 漏光特效 + 新闻场景

```tsx
import { LightLeak } from "@remotion/light-leaks";

<LightLeak evolveDuration={20} retractDuration={40} seed={Math.random()}>
  <OpeningTitle date="2026-06-11" title="每日新闻" subtitle="Horizon News" />
</LightLeak>
```

### 组合：Lottie 图标 + 标题

```tsx
<div style={{ display: "flex", alignItems: "center", gap: 20 }}>
  <Lottie animationData={iconData} style={{ width: 60 }} />
  <HeroTitle title="Featured Story" />
</div>
```
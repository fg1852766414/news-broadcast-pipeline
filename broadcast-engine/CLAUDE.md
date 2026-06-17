# Broadcast Engine 项目规范

## 项目描述
Broadcast Engine 目录的内容处理项目。

## 任务说明
- 探索 broadcast-engine/ 目录结构，理解项目内容
- 处理/转换 broadcast-engine 中的素材
- 输出产物放在 output/ 子目录

## 编码规范
- 遵循项目现有代码风格
- 不要修改源码文件，只读不写源文件
- 输出统一放在 output/ 目录

## 口播稿风格要求
生成广播稿（口播稿）时，必须使用 `.claude/skills/tech-news-banger/SKILL.md` 中的"炸锅体"风格规范。该 skill 定义了：
- "震惊开场 → 悬念递进 → 细节轰炸 → 认知升华 → 互动收尾"的五段式结构
- 短句（15字内）、强动词、具体数字、生活化比喻
- 开场3秒必须有 hook
- 结尾必须升华到"意味着什么"
- 完整风格指南见 `references/style-guide.md`

## 输出规范（供 Agent 3 消费）

你处理的最终产物必须输出到 `broadcast-engine/output/` 目录，包含：

1. `manifest.json` — 核心契约文件
2. `voiceover.mp3` — TTS 配音音频

### manifest.json 格式

```json
{
  "project": "视频标题",
  "fps": 30,
  "resolution": { "width": 1920, "height": 1080 },
  "totalDuration": 0,
  "totalFrames": 0,
  "segments": [
    {
      "id": "唯一ID",
      "name": "场景名",
      "startFrame": 0,
      "endFrame": 0,
      "duration": 0,
      "text": "这段的口播文本",
      "visual": {
        "template": "使用的组件名",
        "props": {}
      }
    }
  ],
  "transitions": [],
  "audio": {
    "file": "voiceover.mp3",
    "sampleRate": 44100,
    "channels": 1
  }
}
```

### 关键约定

- `fps` 固定 30
- `startFrame`/`endFrame` 精确到帧，驱动音画同步
- `visual.template` 是组件名（如 HeroTitle、CodeTerminal）
- `visual.props` 是对应组件的参数
- 每段结束后留 15 帧空白用于转场
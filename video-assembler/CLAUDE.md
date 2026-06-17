# Agent 5 — Video Assembler

## 职责
将 Agent 3 渲染并通过 Agent 4 审查的单条新闻视频片段，拼接成完整新闻广播视频。

## 数据流

```
Input:  remotion-product/output/intro.mp4
        remotion-product/output/story-0.mp4  ~  story-5.mp4
        remotion-product/output/outro.mp4
        ↓
处理:   ffmpeg concat demuxer（零重编码，亚秒级拼接）
        ↓
Output: video-assembler/output/broadcast-final.mp4
```

## 拼接顺序

```
intro.mp4 → story-0.mp4 → story-1.mp4 → ... → story-5.mp4 → outro.mp4
```

## 输入规范

Agent 5 期望在 `remotion-product/output/` 目录下找到以下文件：

| 文件 | 说明 | 可选？ |
|---|---|---|
| intro.mp4 | 开场品牌展示 + 今日速览 | 否 |
| story-0.mp4 ~ story-5.mp4 | 6 条新闻，每条 5 个 segment | 否 |
| outro.mp4 | 闭幕回顾 + 明天见 | 否 |

所有文件必须是：
- H.264 编码（Remotion 默认输出）
- 1920x1080, 30fps
- 相同编码参数（由 `--codec=h264 --crf=18` 保证）

## 处理流程

1. 检查所有输入文件是否存在
2. 运行 `bash scripts/concat-clips.sh`
3. 验证输出文件是否存在、大小正常
4. 报告最终视频路径和时长

## 命令

```bash
cd D:/claude_demo/video-assembler
bash scripts/concat-clips.sh
```

## 输出

- `output/broadcast-final.mp4` — 完整拼接视频
- 元数据：文件大小、时长（应接近 103 秒）
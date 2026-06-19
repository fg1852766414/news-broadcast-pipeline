# Agent 5 — Video Assembler

## 职责
将 Agent 3 渲染并通过审查的逐条新闻视频，拼接成最终完整视频。

## 数据流

```
Input:  remotion-product/output/story-0.mp4 ~ story-5.mp4
        (story-0 含 intro，story-1~5 仅新闻正文)
        Optional: outro.mp4
        ↓
处理:   ffprobe 验证规格 → ffmpeg concat（零重编码）
        ↓
Output: agent5-video-assembler/output/broadcast-final.mp4
        agent5-video-assembler/output/assembly-report.json
```

## 命令

```bash
# 验证+拼接
python agent5-video-assembler/scripts/assemble_broadcast.py

# 仅验证
python agent5-video-assembler/scripts/assemble_broadcast.py --dry-run
```

## 验证检查项
- 所有 story MP4 存在
- 分辨率 1920x1080，h264，30fps
- 时长符合 manifest.json 预期
- ffmpeg 可用

## 产物
- `output/broadcast-final.mp4` — 最终视频
- `output/assembly-report.json` — 验证+拼接报告
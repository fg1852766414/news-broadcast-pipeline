"""
analyze_video.py - 视频美学审查脚本（火山 Ark 多模态版 v2）

参照火山官方 SDK 文档重写：
- 直接本地文件上传（不用 TOS）
- 显式 wait_for_processing 等视频预处理完成
- 用新的 Responses API（client.responses.create）
- 用最新的 doubao-seed-2-0-lite-260215 视觉模型

Usage:
    python analyze_video.py --video output/story-0.mp4 --output reviews/story-0.json

Prerequisites:
    pip install volcengine-python-sdk
    配置 scripts/.env（只需 ARK_API_KEY）
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path

from volcenginesdkarkruntime import Ark

# 视频抽帧密度：留 None 让服务端用默认值 1.0（20s 视频约 20 帧）
# 范围参考：0.2 (稀疏) ~ 2.0 (密集)。除非省钱否则不用改
VIDEO_FPS: float | None = None

# 默认模型（火山最新视觉模型）
DEFAULT_MODEL = "doubao-seed-2-0-lite-260215"

ANALYSIS_PROMPT = """你是一位资深科技自媒体视频美学审查专家。这是一段约 20 秒的 AI 新闻播报短视频，使用 Apple 设计系统风格（纯黑 #000000 背景 + 苹果蓝 #007AFF）。

## 步骤 1：先描述你看到了什么（强制！）

按时间顺序描述视频中每一帧的画面内容（你看到的是约 20 张关键帧）：

```
t=0.0s: [背景] [主体元素] [装饰元素] [动画状态] [文字内容]
t=1.2s: ...
...
t=19.5s: ...
```

每帧至少列出 3-5 个具体元素。不要只写"标题"或"内容"，要写：
- 背景：纯黑/渐变/纹理
- 主体：大标题(字号、字色)、副标题、数据数字、引文、图片、图表
- 装饰：分隔线、装饰条、icon、进度条、品牌 LOGO、底栏
- 动画：入场完成/进行中/淡出中

## 步骤 2：按 6 个维度细评（每项 1-10 分）

### 1. TYPOGRAPHY (排版)
逐项检查：
- 字号层级：主标题 60-100px? 副标题 30-40px? 正文 16-24px?层级是否清晰
- 字重选择：Light/Regular/Medium/Bold 用得对吗
- 中英文字体处理
- 行距/字距
- 文字对比度（白/灰/蓝在黑底上）
- 文本框宽度（是否单行 50+ 字符难读）
- 关键信息是否用强调色/加粗

### 2. LAYOUT (布局)
逐项检查：
- 每屏信息量：是否"一屏只讲一件事"？
- 留白：太空(浪费)/太挤(压迫)/刚好？
- 对齐节奏：左对齐/居中/右对齐穿插是否合理
- 视觉重心：眼睛第一眼落点是否正确
- 元素间距：组件之间是否和谐
- 是否有元素溢出/重叠/截断

### 3. CONTENT_RICHNESS (内容丰富度)
逐项检查：
- 每帧是纯文字还是有图、图表、icon、数据可视化？
- 是否有"金句卡"、"数据卡"、"引用块"、"代码块"等差异化组件？
- 抽象文字 vs 视觉化呈现的比例
- 是否有 emoji 或符号装饰
- 数字是否被强调（字号、颜色、位置）

### 4. SCENE_EFFECTS (场景特效)
逐项检查：
- 入场动画：是否流畅自然
- 缓动曲线：spring damping 效果（damping:25, stiffness:100 标准）
- 转场：用了哪几种？fade/slide/zoom/curtain/lightSweep 比例
- 装饰元素：背景网格/光效/线条是否过多或过少
- 是否有微动效（持续呼吸、闪烁、循环动画）
- 动画时长是否合适（太快看不清/太慢拖沓）

### 5. COLOR_AND_BRAND (色彩与品牌)
逐项检查：
- 配色一致性：#000000 黑底 + #007AFF 蓝主色 + 白色文字
- 是否出现反 AI-default 的紫色渐变/橙红渐变？
- 品牌元素是否每屏都有（顶部 LOGO/底部进度/分段指示）
- 色彩对比度：白字黑底是否够清晰
- 装饰色使用是否克制（过多会显乱）

### 6. NARRATIVE_FLOW (叙事节奏)
逐项检查：
- 信息渐进：自然递进还是硬切？
- 情绪起伏：是否有"动-静-动"节奏？
- 开头 3 秒：是否抓人（标题冲击力）
- 结尾：是否有收束/升华/品牌回响
- 段落切换是否流畅
- 整体节奏：慢-快-慢 是否合理

## 步骤 3：列出至少 5-10 个**具体**问题（强制数量）

**不要满足于"转场单一"这种表面判断**。深挖到具体细节：

❌ 错误示例（太表面）：
- "转场单一"
- "排版一般"
- "动效不够"

✅ 正确示例（具体到帧/组件/参数）：
- "t=3.2s 处数据卡片的数字 '4.2B' 字号 32px 在 1080p 黑底上偏小，建议 48-56px"
- "intro 段(0-3s) 标题 'AI NEWS' 居中但下方无品牌 LOGO 平衡，导致视觉重心偏上"
- "t=8.5s 的金句卡 'Keep building' 字号 24px，但下方 'LiYong' 作者署名 12px 字距太挤"
- "t=12s-15s hook 段用了 CurtainReveal 但左右两片遮罩用了纯黑，缺少光泽/光晕过渡"

## 输出格式（严格 JSON）

```json
{
  "frames_description": [
    {"t": 0.5, "elements": ["黑色纯背景", "大标题 'AI 新闻' 60px 白色居中", "下方 3px 蓝色装饰条", "顶部 LOGO 左对齐", "底部 'LIVE' 红点"], "animation": "标题已入场完成，装饰条正在扩展"},
    {"t": 1.2, "elements": [...], "animation": "..."}
  ],
  "scores": {
    "typography": <1-10>,
    "layout": <1-10>,
    "content_richness": <1-10>,
    "scene_effects": <1-10>,
    "color_brand": <1-10>,
    "narrative_flow": <1-10>,
    "total": <六项平均，保留一位小数>
  },
  "issues": [
    {
      "timestamp": <秒数>,
      "severity": "<low|medium|high>",
      "category": "<typography|layout|content|effects|color|narrative>",
      "title": "<一句话问题>",
      "description": "<具体描述：哪个组件、什么参数、看到什么画面>"
    }
    // 至少 5 条，理想 8-12 条
  ],
  "highlights": [
    "<做得好的具体点，引用帧>"
  ],
  "preflight": {
    "opening_3s_catchy": <bool>,
    "apple_design_consistent": <bool>,
    "no_ai_defaults": <bool>,
    "animation_natural": <bool>,
    "transition_diverse": <bool>,
    "branding_present": <bool>,
    "ending_climactic": <bool>,
    "text_readable": <bool>,
    "typography_hierarchical": <bool>,
    "info_one_screen_one_thing": <bool>,
    "content_visualized": <bool>
  },
  "suggestions": [
    "<具体到组件名/参数值/参考值的修改建议>"
  ],
  "summary": "<2-3 句整体评价，引用具体场景>"
}
```

**重要**：
- 你的 JSON 报告会被另一个 AI（DeepSeek）读取并整合到最终审核
- 至少 5 个 issues，**理想 8-12 个**
- 每个 issue 要引用具体时间戳和画面内容
- 不要泛泛而谈，要给出可执行的修复建议"""


def load_env() -> None:
    """从 .env 文件加载环境变量（如果存在）"""
    env_path = Path(__file__).parent / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


def upload_and_preprocess(client: Ark, video_path: str, fps: float | None = VIDEO_FPS):
    """上传视频并等预处理完成，返回 file 对象"""
    print(f"    上传视频 + 服务端抽帧（fps={fps or 'default(1.0)'}）...")
    with open(video_path, "rb") as f:
        # 仅当显式指定 fps 才传 preprocess_configs
        kwargs = {"file": f, "purpose": "user_data"}
        if fps is not None:
            kwargs["preprocess_configs"] = {"video": {"fps": fps}}
        file_obj = client.files.create(**kwargs)
    print(f"    file_id: {file_obj.id}")

    print(f"    等待视频预处理完成（抽帧）...")
    processed = client.files.wait_for_processing(file_obj.id)
    print(f"    预处理完成: status={getattr(processed, 'status', '?')}")
    return file_obj


def call_vision_model(client: Ark, file_id: str, prompt: str, model: str) -> str:
    """调用 Responses API 分析视频"""
    print(f"    调用视觉模型: {model}")
    response = client.responses.create(
        model=model,
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_video", "file_id": file_id},
                    {"type": "input_text", "text": prompt},
                ],
            }
        ],
    )
    # Responses API 返回结构略不同
    return _extract_response_text(response)


def _extract_response_text(response) -> str:
    """从 Responses API 返回中提取文本内容（兼容多种 SDK 版本）"""
    # 新版 SDK: response.output[].content[].text
    try:
        if hasattr(response, "output") and response.output:
            texts = []
            for item in response.output:
                if hasattr(item, "content"):
                    for c in item.content:
                        if hasattr(c, "text"):
                            texts.append(c.text)
            if texts:
                return "\n".join(texts)
    except (AttributeError, TypeError):
        pass

    # 旧版 fallback: response.choices[].message.content
    try:
        if hasattr(response, "choices") and response.choices:
            return response.choices[0].message.content
    except (AttributeError, TypeError):
        pass

    # 兜底: 整个 dump 出来
    return str(response)


def parse_json_response(text: str) -> dict:
    """从模型输出中提取 JSON（处理 ```json 围栏、``` 围栏、裸 JSON）"""
    m = re.search(r"```json\s*(\{.*?\})\s*```", text, re.DOTALL)
    if m:
        return json.loads(m.group(1))
    m = re.search(r"```\s*(\{.*?\})\s*```", text, re.DOTALL)
    if m:
        return json.loads(m.group(1))
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return json.loads(text[start : end + 1])
    raise ValueError(f"无法从模型输出中提取 JSON:\n{text[:500]}")


def print_summary(result: dict) -> None:
    """打印人类可读的摘要（6 维度版）"""
    scores = result.get("scores", {})
    print("\n" + "=" * 50)
    print("【视频美学分析结果 · 6 维度】")
    print("=" * 50)
    labels = [
        ("typography",         "TYPOGRAPHY     "),
        ("layout",             "LAYOUT         "),
        ("content_richness",   "CONTENT_RICH   "),
        ("scene_effects",      "SCENE_EFFECTS  "),
        ("color_brand",        "COLOR_BRAND    "),
        ("narrative_flow",     "NARRATIVE_FLOW "),
    ]
    for key, label in labels:
        print(f"  {label}: {scores.get(key, '?')}/10")
    print(f"  ─────────────────────────")
    print(f"  TOTAL:               {scores.get('total', '?')}/10")
    print()

    issues = result.get("issues", [])
    print(f"  问题数: {len(issues)}")
    for i, issue in enumerate(issues[:8], 1):
        sev = issue.get("severity", "?").upper()
        cat = issue.get("category", "?")
        ts = issue.get("timestamp", "?")
        title = issue.get("title", "?")
        print(f"    {i}. [{sev}] [{cat}] t={ts}s - {title}")
    if len(issues) > 8:
        print(f"    ... 还有 {len(issues) - 8} 个问题（见 JSON）")

    preflight = result.get("preflight", {})
    failed = [k for k, v in preflight.items() if v is False]
    if failed:
        print(f"\n  ⚠ Pre-flight 未通过 ({len(failed)}/{len(preflight)}): {', '.join(failed)}")
    else:
        print(f"\n  ✅ Pre-flight 全部通过 ({len(preflight)}/{len(preflight)})")

    summary = result.get("summary", "")
    if summary:
        print(f"\n  整体评价: {summary}")
    print("=" * 50)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="用火山 Ark 视觉模型分析视频美学质量",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--video",
        required=True,
        help="本地视频文件路径",
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        help=f"视觉模型名（默认 {DEFAULT_MODEL}）",
    )
    parser.add_argument(
        "--fps",
        type=float,
        default=VIDEO_FPS,
        help="视频抽帧密度（默认 None = 服务端 1.0 fps；20s 视频约 20 帧）",
    )
    parser.add_argument(
        "--output",
        required=True,
        help="输出 JSON 报告路径",
    )
    parser.add_argument(
        "--raw-output",
        default=None,
        help="（可选）原始模型输出文本保存路径（用于调试）",
    )
    args = parser.parse_args()

    load_env()

    # 校验
    api_key = os.environ.get("ARK_API_KEY")
    if not api_key:
        print("错误: ARK_API_KEY 未配置（设置环境变量或写 .env）", file=sys.stderr)
        return 1

    if not Path(args.video).exists():
        print(f"错误: 视频文件不存在: {args.video}", file=sys.stderr)
        return 1

    # 初始化
    base_url = os.environ.get("ARK_BASE_URL", "https://ark.cn-beijing.volces.com/api/v3")
    client = Ark(base_url=base_url, api_key=api_key)

    # 步骤 1: 上传 + 等待预处理
    print(f"[1/3] 上传视频 {Path(args.video).name}...")
    try:
        file_obj = upload_and_preprocess(client, args.video, fps=args.fps)
    except Exception as e:
        print(f"错误: 上传/预处理失败: {e}", file=sys.stderr)
        return 1

    # 步骤 2: 调视觉模型
    print(f"\n[2/3] 调用视觉模型...")
    try:
        raw_response = call_vision_model(client, file_obj.id, ANALYSIS_PROMPT, args.model)
    except Exception as e:
        print(f"错误: 模型调用失败: {e}", file=sys.stderr)
        return 1

    # 保存原始输出
    if args.raw_output:
        Path(args.raw_output).parent.mkdir(parents=True, exist_ok=True)
        Path(args.raw_output).write_text(raw_response, encoding="utf-8")
        print(f"    原始输出已存: {args.raw_output}")

    # 步骤 3: 解析保存
    print(f"\n[3/3] 解析结果...")
    try:
        result = parse_json_response(raw_response)
    except (ValueError, json.JSONDecodeError) as e:
        print(f"错误: 解析 JSON 失败: {e}", file=sys.stderr)
        print(f"原始输出:\n{raw_response[:1000]}", file=sys.stderr)
        raw_path = Path(args.output).with_suffix(".raw.txt")
        raw_path.parent.mkdir(parents=True, exist_ok=True)
        raw_path.write_text(raw_response, encoding="utf-8")
        print(f"原始输出已存: {raw_path}", file=sys.stderr)
        return 1

    # 元信息
    result["_meta"] = {
        "video_source": args.video,
        "video_size_mb": round(Path(args.video).stat().st_size / 1024 / 1024, 2),
        "model": args.model,
        "sampling_fps": args.fps,
        "file_id": file_obj.id,
        "analyzed_at": datetime.now().isoformat(),
    }

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print_summary(result)
    print(f"\n✅ 报告已存: {output_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

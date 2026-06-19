#!/usr/bin/env python3
"""
generate_voiceover.py — Edge TTS 配音生成器

从 manifest.json 读取每段口播文本，逐段生成 TTS 音频并合并。
解耦设计：manifest.json 是唯一数据源，不依赖项目代码。

新闻播报的配音是连续叙述，视觉切段在配音上方进行。
TTS 自然语速可能长于 segment 槽位，这是预期的——音频会跨段播放。

用法:
    python scripts/generate_voiceover.py
    python scripts/generate_voiceover.py --voice zh-CN-YunyangNeural
    python scripts/generate_voiceover.py --rate +20%
    python scripts/generate_voiceover.py --dry-run

输出:
    broadcast-engine/output/voiceover/
    ├── seg-{id}.mp3           # 逐段音频（保留，方便单独修改）
    ├── voiceover-map.json     # 映射 + 计时信息
    └── voiceover.mp3          # 合并后的完整配音
"""

import argparse
import asyncio
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parent.parent
BE_OUTPUT = ROOT_DIR / "broadcast-engine" / "output"
VOICEOVER_DIR = BE_OUTPUT / "voiceover"
MANIFEST_PATH = BE_OUTPUT / "manifest.json"

DEFAULT_VOICE = "zh-CN-XiaoxiaoNeural"
FPS = 30
MAX_RETRIES = 3
RETRY_DELAY = 3  # seconds


# ── 工具函数 ──────────────────────────────────────────


def get_audio_duration(path: Path) -> float:
    """用 ffprobe 获取音频时长（秒）"""
    result = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "csv=p=0",
            str(path),
        ],
        capture_output=True,
        text=True,
        timeout=15,
    )
    try:
        return float(result.stdout.strip())
    except (ValueError, TypeError):
        return 0.0


def concat_mp3s(file_list: list[Path], output_path: Path) -> None:
    """用 ffmpeg concat demuxer 合并多个 MP3"""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
        for p in file_list:
            f.write(f"file '{p.as_posix()}'\n")
        list_path = f.name
    try:
        subprocess.run(
            [
                "ffmpeg", "-y",
                "-f", "concat", "-safe", "0",
                "-i", list_path,
                "-c:a", "libmp3lame", "-b:a", "128k",
                str(output_path),
            ],
            capture_output=True,
            text=True,
            timeout=120,
        )
    finally:
        Path(list_path).unlink(missing_ok=True)


# ── TTS 生成（带代理 + 重试） ────────────────────────


async def generate_segment(
    text: str, voice: str, rate: str, output_path: Path,
) -> float:
    """生成单段 TTS 语音，带重试，返回实际时长"""
    import edge_tts

    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            communicate = edge_tts.Communicate(text, voice, rate=rate)
            await communicate.save(str(output_path))
            return get_audio_duration(output_path)
        except Exception as e:
            last_error = e
            if attempt < MAX_RETRIES:
                delay = RETRY_DELAY * attempt
                print(f"重试 {attempt}/{MAX_RETRIES} ({delay}s)... ", end="", flush=True)
                await asyncio.sleep(delay)
            continue
    raise last_error  # type: ignore


# ── 入口 ─────────────────────────────────────────────


async def main() -> None:
    parser = argparse.ArgumentParser(description="Edge TTS 配音生成器")
    parser.add_argument(
        "--voice", default=DEFAULT_VOICE,
        help=f"TTS 音色 (默认: {DEFAULT_VOICE})",
    )
    parser.add_argument(
        "--rate", default="+0%",
        help="语速调整，如 +20% (默认: +0%)",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="只预览不生成",
    )
    args = parser.parse_args()

    # ── 代理设置 ──
    # 读取环境变量（支持公司 Clash/V2Ray 代理）
    proxy = os.environ.get("HTTP_PROXY") or os.environ.get("http_proxy") or ""
    if proxy:
        os.environ["HTTP_PROXY"] = proxy
        os.environ["HTTPS_PROXY"] = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy") or proxy
        print(f"[INFO] 使用代理: {proxy}")

    # 读取 manifest
    if not MANIFEST_PATH.exists():
        print(f"[ERROR] 找不到 manifest: {MANIFEST_PATH}")
        sys.exit(1)

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest: dict[str, Any] = json.load(f)

    segments = manifest.get("segments", [])
    print(f"[INFO] 共 {len(segments)} 段口播")
    print(f"[INFO] 音色: {args.voice}  语速: {args.rate}")
    print()

    # 统计
    text_segments = [(s, s.get("text", "").strip()) for s in segments]
    empty = [s for s, t in text_segments if not t]
    active = [(s, t) for s, t in text_segments if t]

    if empty:
        print(f"[WARN] {len(empty)} 段无口播文本:")
        for s in empty:
            print(f"       {s['id']} ({s['name']})")

    print(f"[INFO] 需生成: {len(active)} 段")
    print()

    if args.dry_run:
        print("=" * 60)
        print(f"{'ID':20s} {'槽位':>8s}  {'字数':>4s}  {'文本'}")
        print("-" * 60)
        for s, t in active:
            dur = (s["endFrame"] - s["startFrame"]) / FPS
            print(f"{s['id']:20s} {dur:>5.1f}s  {len(t):>3d}字  {t[:50]}")
        print()
        total_dur = sum((s["endFrame"] - s["startFrame"]) for s in segments) / FPS
        print(f"总槽位: {total_dur:.1f}s")
        print(f"输出目录: {VOICEOVER_DIR}")
        print("[DRY-RUN] 结束，未生成任何文件")
        return

    # 创建输出目录
    VOICEOVER_DIR.mkdir(parents=True, exist_ok=True)

    # 逐段生成
    seg_info: list[dict[str, Any]] = []
    work_dir = VOICEOVER_DIR / "_work"
    work_dir.mkdir(exist_ok=True)

    total_start = time.time()
    success = 0

    for s, t in active:
        seg_id = s["id"]
        slot_dur = (s["endFrame"] - s["startFrame"]) / FPS
        output_path = VOICEOVER_DIR / f"{seg_id}.mp3"
        tmp_path = work_dir / f"{seg_id}.mp3"

        print(f"  [{seg_id}] {len(t)}字 slot={slot_dur:.1f}s ... ", end="", flush=True)

        try:
            actual_dur = await generate_segment(t, args.voice, args.rate, tmp_path)
        except Exception as e:
            print(f"失败 (已跳过): {e}")
            continue

        # 配音自然跨段，不强制 pad/trim
        shutil.copyfile(tmp_path, output_path)
        fit_status = ""
        if actual_dur > slot_dur + 0.5:
            fit_status = f" [超槽 {actual_dur - slot_dur:.1f}s]"
        elif actual_dur < slot_dur - 0.3:
            fit_status = f" [余 {slot_dur - actual_dur:.1f}s]"

        print(f"OK {actual_dur:.1f}s{fit_status}")

        # 计算在合并音频中的累积偏移
        cumulative_offset = sum(
            x["actualTtsDuration"] for x in seg_info
        ) if seg_info else 0.0

        seg_info.append({
            "id": seg_id,
            "name": s["name"],
            "subType": s.get("subType", ""),
            "text": t,
            "startFrame": s["startFrame"],
            "endFrame": s["endFrame"],
            "slotDuration": round(slot_dur, 2),
            "actualTtsDuration": round(actual_dur, 2),
            "cumulativeOffset": round(cumulative_offset, 2),
            "file": f"{seg_id}.mp3",
        })
        success += 1

    # 合并成一个完整配音
    if success > 0:
        print()
        print(f"[INFO] 合并 {success} 段音频 ... ", end="", flush=True)
        seq_order = [
            VOICEOVER_DIR / f"{s['id']}.mp3"
            for s, _ in active
            if s["id"] in {x["id"] for x in seg_info}
        ]
        concat_mp3s(seq_order, VOICEOVER_DIR / "voiceover.mp3")
        combined_dur = get_audio_duration(VOICEOVER_DIR / "voiceover.mp3")
        print(f"OK {combined_dur:.1f}s")

    # 合并逐故事音频（用于 per-story 渲染）
    if success > 0:
        # 按段 ID 分组到故事
        story_segments: dict[str, list[Path]] = {}
        id_to_seg = {s["id"]: s for s in seg_info}
        for seg_id in id_to_seg:
            if seg_id.startswith("seg-intro"):
                key = "intro"
            elif seg_id.startswith("seg-outro"):
                key = "outro"
            else:
                story_num = seg_id.split("-")[1]
                key = f"story-{int(story_num) - 1}"
            story_segments.setdefault(key, []).append(VOICEOVER_DIR / f"{seg_id}.mp3")

        # 生成 intro+storyN 组合文件
        intro_files = story_segments.pop("intro", [])
        outro_files = story_segments.pop("outro", [])

        # 每个 story 单独
        for i in range(6):
            key = f"story-{i}"
            if key not in story_segments:
                continue
            files = intro_files + story_segments[key]
            out = VOICEOVER_DIR / f"story-{i}.mp3"
            concat_mp3s(files, out)
            dur = get_audio_duration(out)
            print(f"  [story-{i}] {dur:.1f}s")

        # 完整版排除 outro（intro + stories 1-6）
        all_story_files: list[Path] = list(intro_files)
        for i in range(6):
            key = f"story-{i}"
            if key in story_segments:
                all_story_files.extend(story_segments[key])
        concat_mp3s(all_story_files, VOICEOVER_DIR / "voiceover-nointro.mp3")
        print(f"  [no-outro] {get_audio_duration(VOICEOVER_DIR / 'voiceover-nointro.mp3'):.1f}s")

        # 拷贝到 Remotion public 目录
        remotion_public = ROOT_DIR / "remotion-product" / "public"
        remotion_public.mkdir(exist_ok=True)
        shutil.copy2(VOICEOVER_DIR / "voiceover.mp3", remotion_public / "voiceover.mp3")
        print(f"  [copy] voiceover.mp3 → remotion-product/public/")

        # 更新 manifest.json 中的 audio 字段
        try:
            with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
                manifest_data = json.load(f)
            manifest_data["audio"] = {
                "file": "voiceover.mp3",
                "sampleRate": 44100,
                "channels": 1,
                "duration": round(combined_dur, 2),
            }
            with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
                json.dump(manifest_data, f, ensure_ascii=False, indent=2)
            print(f"  [update] manifest.json audio 字段已更新")
        except Exception as e:
            print(f"  [WARN] manifest.json 更新失败: {e}")

    # 写映射文件
    total_audio = sum(x["actualTtsDuration"] for x in seg_info)
    total_slot = sum(x["slotDuration"] for x in seg_info)
    map_data = {
        "version": "1.0",
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "voice": args.voice,
        "rate": args.rate,
        "fps": FPS,
        "summary": {
            "totalSegments": success,
            "totalSlotDuration": round(total_slot, 2),
            "totalAudioDuration": round(total_audio, 2),
            "delta": round(total_audio - total_slot, 2),
        },
        "combinedFile": "voiceover.mp3",
        "segments": seg_info,
    }
    map_path = VOICEOVER_DIR / "voiceover-map.json"
    with open(map_path, "w", encoding="utf-8") as f:
        json.dump(map_data, f, ensure_ascii=False, indent=2)

    # 清理
    shutil.rmtree(work_dir, ignore_errors=True)

    elapsed = time.time() - total_start
    print()
    print(f"[DONE] {success}/{len(active)} 段成功，耗时 {elapsed:.1f}s")
    print(f"      输出: {VOICEOVER_DIR}")
    print(f"      配音总长: {total_audio:.1f}s (槽位总长: {total_slot:.1f}s)")
    if total_audio > total_slot:
        print(f"      差值: +{total_audio - total_slot:.1f}s (配音自然跨段，正常)")
    if empty:
        print(f"[WARN] {len(empty)} 段无口播文本，已跳过")


if __name__ == "__main__":
    asyncio.run(main())
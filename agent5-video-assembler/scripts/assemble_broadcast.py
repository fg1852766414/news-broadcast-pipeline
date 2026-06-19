#!/usr/bin/env python3
"""
assemble_broadcast.py — Agent 5: Video Assembly

Reads manifest.json, validates all story MP4s, concatenates into final broadcast.
Adapts to current per-story rendering format.

Usage:
    python agent5-video-assembler/scripts/assemble_broadcast.py
    python agent5-video-assembler/scripts/assemble_broadcast.py --dry-run
    python agent5-video-assembler/scripts/assemble_broadcast.py --input-dir PATH

Output:
    agent5-video-assembler/output/broadcast-final.mp4
    agent5-video-assembler/output/assembly-report.json
"""

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_INPUT_DIR = ROOT_DIR / "remotion-product" / "output"
DEFAULT_MANIFEST = ROOT_DIR / "broadcast-engine" / "output" / "manifest.json"
AGENT5_DIR = ROOT_DIR / "agent5-video-assembler"
OUTPUT_DIR = AGENT5_DIR / "output"

FPS = 30
EXPECTED_RESOLUTION = (1920, 1080)
EXPECTED_CODEC = "h264"


def get_file_info(path: Path) -> dict[str, Any]:
    """ffprobe 获取文件元信息"""
    info: dict[str, Any] = {"exists": path.exists(), "path": str(path)}
    if not info["exists"]:
        return info

    info["size_mb"] = round(path.stat().st_size / (1024 * 1024), 2)

    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "csv=p=0",
                str(path),
            ],
            capture_output=True, text=True, timeout=15,
        )
        info["duration"] = round(float(result.stdout.strip()), 2)
    except Exception:
        info["duration"] = None

    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-select_streams", "v:0",
                "-show_entries", "stream=width,height,codec_name,r_frame_rate",
                "-of", "json",
                str(path),
            ],
            capture_output=True, text=True, timeout=15,
        )
        stream = json.loads(result.stdout).get("streams", [{}])[0]
        info["width"] = stream.get("width")
        info["height"] = stream.get("height")
        info["codec"] = stream.get("codec_name")
        r_frame_rate = stream.get("r_frame_rate", "")
        if "/" in r_frame_rate:
            num, den = r_frame_rate.split("/")
            info["fps"] = round(float(num) / float(den)) if float(den) > 0 else None
        else:
            info["fps"] = None
    except Exception:
        pass

    return info


def check_ffmpeg() -> bool:
    """ffmpeg 是否可用"""
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, timeout=10)
        return True
    except Exception:
        return False


def validate_story_info(info: dict[str, Any], label: str, expected_dur: float | None) -> list[str]:
    """验证单个文件的规格"""
    issues: list[str] = []
    if not info["exists"]:
        issues.append(f"{label}: 文件不存在")
        return issues
    if expected_dur and info.get("duration"):
        diff = abs(info["duration"] - expected_dur)
        if diff > 0.5:
            issues.append(f"{label}: 时长 {info['duration']}s, 预期 {expected_dur}s (差 {diff:.1f}s)")
    if info.get("width") != EXPECTED_RESOLUTION[0] or info.get("height") != EXPECTED_RESOLUTION[1]:
        issues.append(f"{label}: 分辨率 {info.get('width')}x{info.get('height')}, 预期 {EXPECTED_RESOLUTION[0]}x{EXPECTED_RESOLUTION[1]}")
    if info.get("codec") and info["codec"] != EXPECTED_CODEC:
        issues.append(f"{label}: 编码 {info['codec']}, 预期 {EXPECTED_CODEC}")
    return issues


def main() -> None:
    parser = argparse.ArgumentParser(description="Agent 5: Video Assembly")
    parser.add_argument("--manifest", default=str(DEFAULT_MANIFEST), help="manifest.json 路径")
    parser.add_argument("--input-dir", default=str(DEFAULT_INPUT_DIR), help="story MP4 目录")
    parser.add_argument("--dry-run", action="store_true", help="只验证不拼接")
    args = parser.parse_args()

    manifest_path = Path(args.manifest)
    input_dir = Path(args.input_dir)

    # ── 读 manifest ──
    if not manifest_path.exists():
        print(f"[ERROR] manifest.json 不存在: {manifest_path}")
        sys.exit(1)

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest: dict[str, Any] = json.load(f)

    total_frames = manifest.get("totalFrames", 0)
    total_dur = total_frames / FPS
    segments = manifest.get("segments", [])
    print(f"[INFO] Manifest: {total_frames} frames ({total_dur:.1f}s), {len(segments)} segments")

    # ── 检查输入文件 ──
    stories = list(range(6))
    expected_durations = {}
    # story-0 含 intro (2 segments = 150 frames = 5s)
    # 每段 story = 5 segments = 465 frames = 15.5s

    intro_frames = sum(s["duration"] for s in segments if s["id"].startswith("seg-intro"))
    story_frames = sum(s["duration"] for s in segments if s["id"].startswith("seg-1-"))
    outro_frames = sum(s["duration"] for s in segments if s["id"].startswith("seg-outro"))

    story_files: list[dict[str, Any]] = []
    for i in stories:
        fname = f"story-{i}.mp4"
        fpath = input_dir / fname
        dur = (intro_frames + story_frames) / FPS if i == 0 else story_frames / FPS
        story_files.append({
            "name": fname,
            "path": fpath,
            "expected_duration": round(dur, 2),
            "expected_frames": intro_frames + story_frames if i == 0 else story_frames,
            "info": get_file_info(fpath),
        })

    # 检查 outro
    outro_path = input_dir / "outro.mp4"
    outro_info = get_file_info(outro_path)

    # ── 验证 ──
    print()
    print(f"{'文件':25s} {'规格':>30s} {'预期':>10s}")
    print("-" * 70)
    all_valid = True
    validation_issues: list[str] = []

    total_expected_frames = 0
    total_expected_dur = 0.0

    for sf in story_files:
        info = sf["info"]
        exp_dur = sf["expected_duration"]
        total_expected_frames += sf["expected_frames"]
        total_expected_dur += exp_dur

        if not info["exists"]:
            print(f"  [MISS] {sf['name']:20s} {'--':>30s} {exp_dur:>5.1f}s")
            all_valid = False
            validation_issues.append(f"{sf['name']}: 文件不存在")
            continue

        issues = validate_story_info(info, sf["name"], exp_dur)
        if issues:
            all_valid = False
            validation_issues.extend(issues)

        dur_str = f"{info.get('duration', 0):.1f}s" if info.get("duration") else "?"
        res_str = f"{info.get('width', '?')}x{info.get('height', '?')}" if info.get("width") else "?"
        cod_str = info.get("codec", "?")
        print(f"  [{ 'OK' if not issues else 'BAD'}] {sf['name']:20s} {dur_str:>8s} {res_str:>14s} {cod_str:>6s}  exp={exp_dur:>5.1f}s")

    # outro
    if outro_info["exists"]:
        dur_s = f"{outro_info.get('duration', 0):.1f}s"
        total_expected_frames += outro_frames
        total_expected_dur += outro_frames / FPS
        print(f"  [EXTRA] outro.mp4          {dur_s:>8s} {'(found, will include)':>20s}")
        story_files.append({
            "name": "outro.mp4",
            "path": outro_path,
            "expected_duration": round(outro_frames / FPS, 2),
            "expected_frames": outro_frames,
            "info": outro_info,
        })
    else:
        print(f"  [INFO] outro.mp4 不存在，跳过 (不含闭幕)")

    print()
    print(f"总预期: {total_expected_frames} frames ({total_expected_dur:.1f}s)")

    # ── 检查 ffmpeg ──
    if not check_ffmpeg():
        print("[ERROR] ffmpeg 不可用，无法拼接")
        all_valid = False

    # ── 报告 ──
    report: dict[str, Any] = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "manifest": {
            "totalFrames": total_frames,
            "totalDuration": total_dur,
            "segments": len(segments),
        },
        "expected": {
            "totalFrames": total_expected_frames,
            "totalDuration": round(total_expected_dur, 2),
        },
        "inputs": [{"name": sf["name"], "info": sf["info"]} for sf in story_files],
        "validation": {
            "allFilesExist": all(sf["info"]["exists"] for sf in story_files),
            "allDurationsMatch": all_valid,
            "ffmpegAvailable": check_ffmpeg(),
        },
        "issues": validation_issues,
    }

    if not all_valid:
        print(f"[WARN] {len(validation_issues)} 个验证问题:")
        for iss in validation_issues:
            print(f"       - {iss}")
        report["verdict"] = "FAIL"
    else:
        print("[OK] 所有文件验证通过")
        report["verdict"] = "PASS"

    if args.dry_run:
        print()
        print("[DRY-RUN] 结束，未执行拼接")
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        with open(OUTPUT_DIR / "assembly-report.json", "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        sys.exit(0 if all_valid else 1)

    # ── 拼接 ──
    if not all_valid:
        print("[ERROR] 验证失败，跳过拼接")
        sys.exit(1)

    print()
    print("=== ffmpeg concat ===")

    # 生成 demuxer file list
    concat_list_path = OUTPUT_DIR / "_concat_list.txt"
    with open(concat_list_path, "w", encoding="utf-8") as f:
        for sf in story_files:
            if sf["info"]["exists"]:
                f.write(f"file '{sf['path'].as_posix()}'\n")

    output_path = OUTPUT_DIR / "broadcast-final.mp4"
    result = subprocess.run(
        [
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0",
            "-i", str(concat_list_path),
            "-c", "copy",
            "-movflags", "+faststart",
            str(output_path),
        ],
        capture_output=True, text=True, timeout=300,
    )

    concat_success = result.returncode == 0
    report["concat"] = {
        "success": concat_success,
        "ffmpegExitCode": result.returncode,
        "outputFile": str(output_path),
    }

    if concat_success and output_path.exists():
        report["concat"]["outputSizeMb"] = round(output_path.stat().st_size / (1024 * 1024), 2)
        out_info = get_file_info(output_path)
        report["concat"]["outputDuration"] = out_info.get("duration")
        print(f"  [OK] broadcast-final.mp4 ({report['concat']['outputSizeMb']} MB, {out_info.get('duration', '?')}s)")
    else:
        print(f"  [FAIL] ffmpeg exit code {result.returncode}")
        print(f"  stderr: {result.stderr[:500]}")
        report["verdict"] = "FAIL"

    # 清理
    concat_list_path.unlink(missing_ok=True)

    report["verdict"] = "PASS" if concat_success and all_valid else "FAIL"

    # 写报告
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    report_path = OUTPUT_DIR / "assembly-report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"  [report] {report_path}")

    # 拷贝到 reports/
    reports_dir = ROOT_DIR / "reports"
    reports_dir.mkdir(exist_ok=True)
    with open(reports_dir / "assembly-report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    sys.exit(0 if report["verdict"] == "PASS" else 1)


if __name__ == "__main__":
    main()
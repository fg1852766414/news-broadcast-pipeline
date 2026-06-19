#!/usr/bin/env python3
"""
final_review.py — Agent 6: Final Review

4-stage review pipeline:
  1. Assembly verification — reads Agent 5's assembly-report.json
  2. Multi-modal analysis — calls analyze_video.py on final video
  3. Pipeline completeness — checks all agent outputs exist
  4. Final verdict PASS/FAIL + copy to final-output/

Usage:
    python agent6-final-review/scripts/final_review.py
    python agent6-final-review/scripts/final_review.py --dry-run
    python agent6-final-review/scripts/final_review.py --skip-vision
"""

import argparse
import json
import shutil
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
AGENT5_DIR = ROOT_DIR / "agent5-video-assembler"
AGENT5_OUTPUT = AGENT5_DIR / "output"
AGENT6_DIR = ROOT_DIR / "agent6-final-review"
AGENT6_OUTPUT = AGENT6_DIR / "output"
FINAL_OUTPUT_DIR = ROOT_DIR / "final-output"
REPORT_DIR = ROOT_DIR / "reports"

REMOTION_OUTPUT = ROOT_DIR / "remotion-product" / "output"
BE_OUTPUT = ROOT_DIR / "broadcast-engine" / "output"
VOICEOVER_DIR = BE_OUTPUT / "voiceover"
HORIZON_OUTPUT = ROOT_DIR / "Horizon" / "output"
AESTHETIC_OUTPUT = ROOT_DIR / "aesthetic-reviewer" / "output"
ANALYZE_SCRIPT = ROOT_DIR / "aesthetic-reviewer" / "scripts" / "analyze_video.py"

PASS_THRESHOLD_SCORE = 7.0
PASS_THRESHOLD_PREFLIGHT = 8  # at least 8/11 preflight checks pass


def check_path(path: Path, desc: str) -> dict[str, Any]:
    """检查文件/目录是否存在并返回信息"""
    result: dict[str, Any] = {"path": str(path), "description": desc, "exists": path.exists()}
    if result["exists"] and path.is_file():
        result["size_mb"] = round(path.stat().st_size / (1024 * 1024), 2)
    return result


def run_analyze_video(video_path: Path) -> dict[str, Any]:
    """调用 aesthetic-reviewer 的多模态分析"""
    result: dict[str, Any] = {"success": False, "error": None, "data": None}
    if not ANALYZE_SCRIPT.exists():
        result["error"] = f"analyze_video.py 不存在: {ANALYZE_SCRIPT}"
        return result
    if not video_path.exists():
        result["error"] = f"视频不存在: {video_path}"
        return result

    try:
        output_path = AGENT6_OUTPUT / "final-vision.json"
        proc = subprocess.run(
            [
                sys.executable, str(ANALYZE_SCRIPT),
                "--video", str(video_path),
                "--output", str(output_path),
            ],
            capture_output=True, text=True, timeout=600,
        )
        if proc.returncode != 0:
            result["error"] = f"analyze_video.py 退出码 {proc.returncode}: {proc.stderr[:300]}"
            return result

        if output_path.exists():
            with open(output_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            result["success"] = True
            result["data"] = data
        else:
            result["error"] = "analyze_video.py 未生成输出文件"
    except subprocess.TimeoutExpired:
        result["error"] = "analyze_video.py 超时 (600s)"
    except Exception as e:
        result["error"] = str(e)

    return result


def compute_verdict(
    assembly_ok: bool,
    vision: dict[str, Any] | None,
    completeness: dict[str, Any],
) -> tuple[str, str]:
    """计算最终裁定"""
    reasons: list[str] = []

    if not assembly_ok:
        reasons.append("Assembly 验证失败")

    # 检查 vision 分数
    vision_total = None
    preflight_pass = 0
    preflight_total = 0
    if vision and vision.get("data"):
        scores = vision["data"].get("scores", {})
        vision_total = scores.get("total", 0)
        if vision_total < PASS_THRESHOLD_SCORE:
            reasons.append(f"视觉质量 {vision_total}/10 < 阈值 {PASS_THRESHOLD_SCORE}/10")

        preflight = vision["data"].get("preflight", {})
        preflight_pass = sum(1 for v in preflight.values() if v)
        preflight_total = len(preflight)
        if preflight_pass < PASS_THRESHOLD_PREFLIGHT:
            reasons.append(f"Pre-flight {preflight_pass}/{preflight_total} < 阈值 {PASS_THRESHOLD_PREFLIGHT}")

    # 检查产物完整性
    missing = [c for c in completeness.get("checks", []) if not c.get("exists")]
    if missing:
        reasons.append(f"缺失 {len(missing)} 个产物")

    if reasons:
        return "FAIL", "; ".join(reasons)
    return "PASS", "所有检查通过"


def main() -> None:
    parser = argparse.ArgumentParser(description="Agent 6: Final Review")
    parser.add_argument("--dry-run", action="store_true", help="只检查不生成最终输出")
    parser.add_argument("--skip-vision", action="store_true", help="跳过多模态视觉分析")
    args = parser.parse_args()

    AGENT6_OUTPUT.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("  Agent 6: Final Review")
    print("=" * 60)
    print()

    # ── Stage 1: Assembly Verification ──
    print("[Stage 1] Assembly 验证")
    print("-" * 40)

    assembly_report_path = AGENT5_OUTPUT / "assembly-report.json"
    if not assembly_report_path.exists():
        assembly_report_path = REPORT_DIR / "assembly-report.json"

    assembly_ok = False
    assembly_data: dict[str, Any] = {}
    if assembly_report_path.exists():
        with open(assembly_report_path, "r", encoding="utf-8") as f:
            assembly_data = json.load(f)
        assembly_ok = assembly_data.get("verdict") == "PASS"
        concat_dur = assembly_data.get("concat", {}).get("outputDuration", "?")
        concat_size = assembly_data.get("concat", {}).get("outputSizeMb", "?")
        print(f"  Assembly: {'PASS' if assembly_ok else 'FAIL'}")
        print(f"  输出: {assembly_data.get('concat', {}).get('outputFile', '?')}")
        print(f"  时长: {concat_dur}s, 大小: {concat_size}MB")
    else:
        print(f"  [WARN] assembly-report.json 不存在")

    print()

    # ── Stage 2: Multi-modal Analysis ──
    print("[Stage 2] 多模态视觉分析")
    print("-" * 40)

    vision_result: dict[str, Any] = {"success": False, "error": "已跳过"}
    final_video = AGENT5_OUTPUT / "broadcast-final.mp4"

    if args.skip_vision or not final_video.exists():
        if not final_video.exists():
            print(f"  [SKIP] 最终视频不存在: {final_video}")
        else:
            print(f"  [SKIP] --skip-vision")
    else:
        print(f"  分析视频: {final_video}")
        print(f"  脚本: {ANALYZE_SCRIPT}")
        print("  运行中 (可能耗时 2-5 分钟)...")
        vision_result = run_analyze_video(final_video)
        if vision_result["success"]:
            data = vision_result["data"]
            scores = data.get("scores", {})
            print(f"  [OK] 分析完成")
            print(f"  总分: {scores.get('total', '?'):.1f}/10")
            print(f"  6 维度: {scores.get('typography', '?')}/10 {scores.get('layout', '?')}/10 {scores.get('content_richness', '?')}/10 "
                    f"{scores.get('scene_effects', '?')}/10 {scores.get('color_brand', '?')}/10 {scores.get('narrative_flow', '?')}/10")
            preflight = data.get("preflight", {})
            pf_pass = sum(1 for v in preflight.values() if v)
            pf_total = len(preflight)
            print(f"  Pre-flight: {pf_pass}/{pf_total} 通过")
        else:
            print(f"  [FAIL] {vision_result['error']}")
    print()

    # ── Stage 3: Pipeline Completeness ──
    print("[Stage 3] 产物完整性检查")
    print("-" * 40)

    checks = [
        check_path(HORIZON_OUTPUT / "daily-digest-2026-06-11.md", "Horizon: daily digest"),
        check_path(HORIZON_OUTPUT / "simplified-2026-06-11.json", "Horizon: simplified JSON"),
        check_path(BE_OUTPUT / "2026-06-11-script.md", "Broadcast: 中文脚本"),
        check_path(BE_OUTPUT / "manifest.json", "Broadcast: manifest.json"),
        check_path(VOICEOVER_DIR / "voiceover.mp3", "TTS: 完整配音"),
        check_path(VOICEOVER_DIR / "voiceover-map.json", "TTS: 映射文件"),
    ]

    for i in range(6):
        checks.append(check_path(REMOTION_OUTPUT / f"story-{i}.mp4", f"Remotion: story-{i}.mp4"))

    checks.append(check_path(final_video, "Agent 5: broadcast-final.mp4"))
    checks.append(check_path(AGENT5_OUTPUT / "assembly-report.json", "Agent 5: assembly-report.json"))

    existing = sum(1 for c in checks if c["exists"])
    total = len(checks)
    print(f"  {existing}/{total} 产物存在")

    # 列出缺失
    missing_items = [c for c in checks if not c["exists"]]
    if missing_items:
        print(f"  [WARN] 缺失 {len(missing_items)} 项:")
        for m in missing_items:
            print(f"    - {m['description']} ({m['path']})")

    completeness = {"checks": checks, "existing": existing, "total": total}

    print()

    # ── Stage 4: Final Verdict ──
    print("[Stage 4] 最终裁定")
    print("-" * 40)

    verdict, reason = compute_verdict(
        assembly_ok,
        vision_result if vision_result["success"] else None,
        completeness,
    )

    vision_scores = {}
    if vision_result.get("data"):
        vision_scores = vision_result["data"].get("scores", {})
        vision_preflight = vision_result["data"].get("preflight", {})

    review: dict[str, Any] = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "pipelineRun": datetime.now().strftime("%Y%m%d_%H%M%S"),
        "stages": {
            "assembly": {
                "status": "PASS" if assembly_ok else "FAIL",
                "report": str(assembly_report_path) if assembly_report_path.exists() else None,
            },
            "visionAnalysis": {
                "status": "PASS" if vision_result["success"] else "SKIP" if args.skip_vision else "FAIL",
                "totalScore": vision_scores.get("total"),
                "typography": vision_scores.get("typography"),
                "layout": vision_scores.get("layout"),
                "content_richness": vision_scores.get("content_richness"),
                "scene_effects": vision_scores.get("scene_effects"),
                "color_brand": vision_scores.get("color_brand"),
                "narrative_flow": vision_scores.get("narrative_flow"),
            },
            "completeness": {
                "existing": existing,
                "total": total,
                "missing": [m["description"] for m in missing_items],
            },
        },
        "verdict": verdict,
        "reason": reason,
        "thresholds": {
            "minScore": PASS_THRESHOLD_SCORE,
            "minPreflightPass": PASS_THRESHOLD_PREFLIGHT,
        },
    }

    print(f"  VERDICT: {verdict}")
    print(f"  原因: {reason}")

    # 写审查报告
    report_md = f"""# Final Review Report

**Pipeline Run**: {review['pipelineRun']}
**Verdict**: **{verdict}**
**Reason**: {reason}

---

## Stage 1: Assembly Verification
- Status: {review['stages']['assembly']['status']}

## Stage 2: Multi-Modal Analysis
- Status: {review['stages']['visionAnalysis']['status']}
- Total Score: {review['stages']['visionAnalysis']['totalScore'] or 'N/A'}/10
- Typography: {review['stages']['visionAnalysis']['typography'] or 'N/A'}
- Layout: {review['stages']['visionAnalysis']['layout'] or 'N/A'}
- Content Richness: {review['stages']['visionAnalysis']['content_richness'] or 'N/A'}
- Scene Effects: {review['stages']['visionAnalysis']['scene_effects'] or 'N/A'}
- Color Brand: {review['stages']['visionAnalysis']['color_brand'] or 'N/A'}
- Narrative Flow: {review['stages']['visionAnalysis']['narrative_flow'] or 'N/A'}

## Stage 3: Pipeline Completeness
- {existing}/{total} outputs present
"""

    if missing_items:
        report_md += "- Missing:\n"
        for m in missing_items:
            report_md += f"  - {m['description']}\n"

    report_md += f"""
---

## Final Output
Location: {FINAL_OUTPUT_DIR / review['pipelineRun']}
"""

    report_path = AGENT6_OUTPUT / "final-review-report.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_md)
    print(f"  [report] {report_path}")

    # 写 JSON
    json_path = AGENT6_OUTPUT / "final-review.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(review, f, ensure_ascii=False, indent=2)

    # ── 拷贝到 final-output/ ──
    if not args.dry_run and verdict == "PASS":
        ts = review["pipelineRun"]
        final_dir = FINAL_OUTPUT_DIR / ts
        final_dir.mkdir(parents=True, exist_ok=True)

        # 拷贝最终视频
        if final_video.exists():
            shutil.copy2(final_video, final_dir / "broadcast-final.mp4")
            print(f"  [copy] broadcast-final.mp4 -> {final_dir / 'broadcast-final.mp4'}")

        # 拷贝审查报告
        shutil.copy2(report_path, final_dir / "final-review-report.md")
        shutil.copy2(json_path, final_dir / "final-review.json")

        # 拷贝 assembly report
        if assembly_report_path.exists():
            shutil.copy2(assembly_report_path, final_dir / "assembly-report.json")

        # 拷贝 manifest + voiceover
        if (BE_OUTPUT / "manifest.json").exists():
            shutil.copy2(BE_OUTPUT / "manifest.json", final_dir / "manifest.json")
        if (VOICEOVER_DIR / "voiceover.mp3").exists():
            shutil.copy2(VOICEOVER_DIR / "voiceover.mp3", final_dir / "voiceover.mp3")
        if (VOICEOVER_DIR / "voiceover-map.json").exists():
            shutil.copy2(VOICEOVER_DIR / "voiceover-map.json", final_dir / "voiceover-map.json")

        # 写 SUMMARY.md
        summary = f"""# Pipeline Execution Summary

**Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Pipeline Run**: {ts}

## Outputs
- Final Video: final-output/{ts}/broadcast-final.mp4
- Final Review Report: final-output/{ts}/final-review-report.md
- Assembly Report: final-output/{ts}/assembly-report.json
- Manifest: final-output/{ts}/manifest.json
- TTS Voiceover: final-output/{ts}/voiceover.mp3

## Verdict
{verdict}: {reason}
"""
        with open(final_dir / "SUMMARY.md", "w", encoding="utf-8") as f:
            f.write(summary)

        print(f"  [copy] final-output/{ts}/")
    elif args.dry_run:
        print(f"  [DRY-RUN] 未生成 final-output")
    else:
        print(f"  [SKIP] 裁定 {verdict}，未生成 final-output")

    print()
    print("=" * 60)
    print(f"  Final Verdict: {verdict}")
    print(f"  {reason}")
    print("=" * 60)

    sys.exit(0 if verdict == "PASS" else 1)


if __name__ == "__main__":
    main()
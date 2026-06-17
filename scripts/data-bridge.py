"""
Horizon → Broadcast-Engine → Remotion Data Bridge

This script converts Horizon enriched news data into a format
that can be consumed by Remotion components and the composite script.

Usage:
    python scripts/data-bridge.py [--date YYYY-MM-DD] [--output-dir PATH]

Outputs:
    - remotion-data.json  (Remotion-compatible news data)
    - broadcast-data.json (Broadcast script metadata)
    - video-config.json   (Video composition configuration)
"""

import json
import os
import sys
import argparse
from datetime import datetime
from pathlib import Path


# ── Data Models ──

class RemotionNewsItem:
    """A news item formatted for Remotion consumption."""

    def __init__(self, horizon_item: dict):
        self.id = horizon_item.get("id", "")
        self.source_type = horizon_item.get("source_type", "unknown")
        self.title = horizon_item.get("title", "")
        self.title_zh = (
            horizon_item.get("metadata", {}).get("title_zh", "")
            or horizon_item.get("title", "")
        )
        self.title_en = (
            horizon_item.get("metadata", {}).get("title_en", "")
            or horizon_item.get("title", "")
        )
        self.summary_zh = (
            horizon_item.get("metadata", {}).get("detailed_summary_zh", "")
            or horizon_item.get("ai_summary", "")
        )
        self.summary_en = (
            horizon_item.get("metadata", {}).get("detailed_summary_en", "")
            or horizon_item.get("ai_summary", "")
        )
        self.score = horizon_item.get("ai_score", 0)
        self.tags = horizon_item.get("ai_tags", [])
        self.url = horizon_item.get("url", "")
        self.author = horizon_item.get("author", "")
        self.published_at = horizon_item.get("published_at", "")

        # Determine category for Remotion color coding
        self.category = self._infer_category()

    def _infer_category(self) -> str:
        """Map Horizon source types to Remotion visual categories."""
        source_map = {
            "hackernews": "top",
            "reddit": "top",
            "rss": "tech",
            "twitter": "world",
            "github": "tech",
            "openbb": "business",
            "ossinsight": "science",
            "telegram": "world",
        }
        return source_map.get(self.source_type, "tech")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "title_zh": self.title_zh,
            "title_en": self.title_en,
            "summary_zh": self.summary_zh[:200] if self.summary_zh else "",
            "summary_en": self.summary_en[:200] if self.summary_en else "",
            "score": self.score,
            "tags": self.tags,
            "url": self.url,
            "author": self.author,
            "category": self.category,
            "published_at": self.published_at,
        }


class RemotionBroadcastData:
    """Complete broadcast data package for Remotion rendering."""

    def __init__(self, date_str: str, items: list[dict]):
        self.date = date_str
        self.items = sorted(
            [RemotionNewsItem(item) for item in items],
            key=lambda x: x.score,
            reverse=True,
        )
        self.total_items = len(self.items)
        self.average_score = (
            sum(item.score for item in self.items) / self.total_items
            if self.total_items > 0
            else 0
        )

    def to_dict(self, language: str = "zh") -> dict:
        """Generate the complete Remotion data package."""
        prefix = "_zh" if language == "zh" else "_en"
        title_key = f"title{prefix}"
        summary_key = f"summary{prefix}"

        date_formatted = self._format_date(language)

        return {
            "date": date_formatted,
            "date_raw": self.date,
            "language": language,
            "title": "每日新闻速递" if language == "zh" else "Daily News Brief",
            "subtitle": "Horizon News · 全球视野" if language == "zh"
                        else "Horizon News · Global Perspective",
            "total_items": self.total_items,
            "average_score": round(self.average_score, 1),
            "news_items": [
                {
                    "id": item.id,
                    "title": getattr(item, title_key, item.title),
                    "summary": getattr(item, summary_key, item.summary_zh)[:200],
                    "category": item.category,
                    "score": item.score,
                    "tags": item.tags,
                    "source_type": item.source_type,
                    "url": item.url,
                }
                for item in self.items
            ],
            "closing_text": "感谢收看 · 我们明天再见" if language == "zh"
                            else "Thanks for watching · See you tomorrow",
            "video_config": {
                "fps": 30,
                "width": 1920,
                "height": 1080,
                "opening_duration": 90,
                "item_duration": 75,
                "closing_duration": 90,
                "total_duration": (
                    90 + len(self.items) * 75 + 90
                ),
            },
        }

    def _format_date(self, language: str) -> str:
        """Format the date for display."""
        try:
            dt = datetime.strptime(self.date, "%Y-%m-%d")
            if language == "zh":
                return f"{dt.year}年{dt.month}月{dt.day}日"
            return dt.strftime("%B %d, %Y")
        except ValueError:
            return self.date


# ── Main Bridge Logic ──

def find_horizon_data(date_str: str) -> list[dict]:
    """Find and load Horizon enriched data."""
    search_paths = [
        Path(f"Horizon/data/enriched/{date_str}.json"),
        Path(f"../Horizon/data/enriched/{date_str}.json"),
        Path.cwd().parent / "Horizon" / "data" / "enriched" / f"{date_str}.json",
        Path.cwd() / "Horizon" / "data" / "enriched" / f"{date_str}.json",
    ]

    for path in search_paths:
        resolved = path.resolve()
        if resolved.exists():
            print(f"  [✓] Found Horizon data: {resolved}")
            with open(resolved, "r", encoding="utf-8") as f:
                return json.load(f)

    raise FileNotFoundError(
        f"Cannot find Horizon enriched data for {date_str}. "
        f"Searched: {[str(p) for p in search_paths]}"
    )


def find_broadcast_script(date_str: str, language: str = "zh") -> str | None:
    """Try to find an existing broadcast script."""
    suffix = "" if language == "zh" else "-en"
    search_paths = [
        Path(f"broadcast-engine/output/{date_str}-script{suffix}.md"),
        Path(f"../broadcast-engine/output/{date_str}-script{suffix}.md"),
        Path.cwd().parent / "broadcast-engine" / "output" / f"{date_str}-script{suffix}.md",
    ]

    for path in search_paths:
        resolved = path.resolve()
        if resolved.exists():
            print(f"  [✓] Found broadcast script: {resolved}")
            with open(resolved, "r", encoding="utf-8") as f:
                return f.read()

    return None


def generate_video_config(
    items: list[dict],
    fps: int = 30,
    item_duration: int = 75,
    opening_duration: int = 90,
    closing_duration: int = 90,
) -> dict:
    """Generate video composition configuration."""
    total_duration = opening_duration + len(items) * item_duration + closing_duration

    return {
        "fps": fps,
        "width": 1920,
        "height": 1080,
        "codec": "h264",
        "opening_duration_frames": opening_duration,
        "item_duration_frames": item_duration,
        "closing_duration_frames": closing_duration,
        "total_duration_frames": total_duration,
        "total_duration_seconds": total_duration / fps,
        "items_count": len(items),
        "output_format": "video/mp4",
        "output_path": "remotion-product/output/broadcast.mp4",
    }


def main():
    parser = argparse.ArgumentParser(
        description="Horizon → Remotion Data Bridge"
    )
    parser.add_argument(
        "--date",
        default=datetime.now().strftime("%Y-%m-%d"),
        help="Date in YYYY-MM-DD format",
    )
    parser.add_argument(
        "--output-dir",
        default="remotion-product/src/data",
        help="Output directory for Remotion-compatible data files",
    )
    parser.add_argument(
        "--lang",
        default="zh",
        choices=["zh", "en"],
        help="Language for the output data",
    )
    args = parser.parse_args()

    print(f"\n{'='*60}")
    print(f"  Data Bridge: Horizon → Remotion")
    print(f"  Date: {args.date} | Language: {args.lang}")
    print(f"{'='*60}\n")

    # Step 1: Load Horizon data
    print("  [1/4] Loading Horizon enriched data...")
    horizon_items = find_horizon_data(args.date)

    # Step 2: Find broadcast script
    print("  [2/4] Looking for broadcast script...")
    broadcast_script = find_broadcast_script(args.date, args.lang)
    if broadcast_script:
        print(f"  [✓] Broadcast script found ({len(broadcast_script)} chars)")
    else:
        print("  [ ] No broadcast script found (will use Horizon data directly)")

    # Step 3: Transform data
    print("  [3/4] Transforming data for Remotion...")
    broadcast_data = RemotionBroadcastData(args.date, horizon_items)
    remotion_data = broadcast_data.to_dict(args.lang)

    # Step 4: Write outputs
    print("  [4/4] Writing output files...")
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Write Remotion-compatible data
    remotion_path = output_dir / "remotion-data.json"
    with open(remotion_path, "w", encoding="utf-8") as f:
        json.dump(remotion_data, f, ensure_ascii=False, indent=2)
    print(f"  [✓] Remotion data: {remotion_path}")

    # Write broadcast metadata
    broadcast_path = output_dir / "broadcast-data.json"
    with open(broadcast_path, "w", encoding="utf-8") as f:
        json.dump({
            "date": args.date,
            "language": args.lang,
            "script_available": broadcast_script is not None,
            "script_length": len(broadcast_script) if broadcast_script else 0,
        }, f, ensure_ascii=False, indent=2)
    print(f"  [✓] Broadcast metadata: {broadcast_path}")

    # Write video config
    config_path = output_dir / "video-config.json"
    video_config = generate_video_config(horizon_items)
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(video_config, f, ensure_ascii=False, indent=2)
    print(f"  [✓] Video config: {config_path}")

    print(f"\n{'='*60}")
    print(f"  Data Bridge Complete!")
    print(f"  Items converted: {remotion_data['total_items']}")
    print(f"  Average score: {remotion_data['average_score']}/10")
    print(f"  Video duration: {video_config['total_duration_seconds']}s")
    print(f"  Output directory: {output_dir.resolve()}")
    print(f"{'='*60}\n")

    return remotion_data


if __name__ == "__main__":
    main()
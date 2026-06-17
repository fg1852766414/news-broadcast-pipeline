"""CLI entry point for broadcast-engine."""

import argparse
import asyncio
import os
import sys
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(
        description="Generate casual broadcast scripts from Horizon enriched news data",
    )
    parser.add_argument(
        "-d", "--date",
        default="",
        help="Date in YYYY-MM-DD format (default: today UTC)",
    )
    parser.add_argument(
        "--lang",
        default="zh",
        choices=["zh", "en"],
        help="Output language (default: zh)",
    )
    parser.add_argument(
        "--max-items",
        type=int,
        default=6,
        help="Maximum number of stories to feature (default: 6)",
    )
    parser.add_argument(
        "--model",
        default="ark-code-latest",
        help="Model to use (default: ark-code-latest)",
    )
    parser.add_argument(
        "--provider",
        default="ark",
        choices=["ark", "anthropic", "openai"],
        help="LLM provider: ark (Volcengine, default), anthropic, openai",
    )
    parser.add_argument(
        "--base-url",
        default="",
        help="Custom base URL for the API (provider-specific default if empty)",
    )
    parser.add_argument(
        "--data-dir",
        default="",
        help="Path to Horizon's data directory (default: auto-detect)",
    )
    parser.add_argument(
        "--output-dir",
        default="data/broadcasts",
        help="Output directory for scripts (default: data/broadcasts)",
    )

    args = parser.parse_args()

    # Auto-load .env from common locations
    from dotenv import load_dotenv
    for dotenv_path in [
        Path(".env"),
        Path("../Horizon/.env"),
    ]:
        if dotenv_path.exists():
            load_dotenv(dotenv_path)
            break

    # Determine date
    from datetime import datetime, timezone
    date = args.date or datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Resolve data dir
    data_dir = args.data_dir
    if not data_dir:
        # Try to find Horizon data directory relative to this script
        script_dir = Path(__file__).resolve().parent.parent
        candidate = script_dir.parent / "Horizon" / "data"
        if candidate.exists():
            data_dir = str(candidate)

    from rich.console import Console
    console = Console()

    console.print("[bold cyan]🎙️ Broadcast Engine[/bold cyan]")
    console.print(f"  📅 Date: {date}")
    console.print(f"  🌐 Language: {args.lang}")
    console.print(f"  📂 Data dir: {data_dir or 'auto'}")
    console.print(f"  📁 Output dir: {args.output_dir}")

    from .generator import BroadcastScriptGenerator

    generator = BroadcastScriptGenerator(
        model=args.model,
        provider=args.provider,
        base_url=args.base_url,
        horizon_data_dir=data_dir,
        output_dir=args.output_dir,
        console=console,
    )

    try:
        path = asyncio.run(generator.run(date, args.lang, args.max_items))
        console.print(f"\n[bold green]✅ Done! Script saved to:[/bold green] {path}")
    except FileNotFoundError as e:
        console.print(f"\n[bold red]❌ Error:[/bold red] {e}")
        sys.exit(1)
    except ValueError as e:
        console.print(f"\n[bold yellow]⚠️  {e}[/bold yellow]")
        sys.exit(1)
    except Exception as e:
        console.print(f"\n[bold red]❌ Unexpected error:[/bold red] {e}")
        import traceback
        console.print(traceback.format_exc())
        sys.exit(1)


if __name__ == "__main__":
    main()
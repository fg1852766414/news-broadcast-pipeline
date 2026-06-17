"""BroadcastScriptGenerator — the core engine for AI broadcast script generation.

Supports multiple LLM providers:
  - ark:   Volcengine Ark (OpenAI-compatible, default)
  - openai:  OpenAI API (or any OpenAI-compatible endpoint)
  - anthropic: Anthropic API
"""

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from .models import BroadcastScript
from .prompts import BROADCAST_SYSTEM, BROADCAST_USER, format_item_for_prompt


# ── Provider config ──

PROVIDER_CONFIGS = {
    "ark": {
        "env_key": "ARK_API_KEY",
        "env_base_url": "ARK_BASE_URL",
        "default_base_url": "https://ark.cn-beijing.volces.com/api/coding/v1",
        "default_model": "ark-code-latest",
    },
    "openai": {
        "env_key": "OPENAI_API_KEY",
        "env_base_url": "OPENAI_BASE_URL",
        "default_base_url": "https://api.openai.com/v1",
        "default_model": "gpt-4o",
    },
    "anthropic": {
        "env_key": "ANTHROPIC_API_KEY",
        "env_base_url": None,
        "default_base_url": None,
        "default_model": "claude-sonnet-4-20250514",
    },
}


def _build_client(provider: str, api_key: str, base_url: str):
    """Build an async LLM client for the given provider."""
    if provider == "anthropic":
        from anthropic import AsyncAnthropic
        return AsyncAnthropic(api_key=api_key)
    else:
        # OpenAI-compatible (ark, openai, or any custom endpoint)
        from openai import AsyncOpenAI
        return AsyncOpenAI(api_key=api_key, base_url=base_url)


async def _call_model(
    client,
    provider: str,
    model: str,
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 4096,
    temperature: float = 0.7,
) -> str:
    """Call the LLM and return the text response."""
    if provider == "anthropic":
        response = await client.messages.create(
            model=model,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return "".join(block.text for block in response.content if block.type == "text")
    else:
        # OpenAI-compatible (ark, openai, etc.)
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response.choices[0].message.content or ""


class BroadcastScriptGenerator:
    """Generates casual broadcast scripts from Horizon enriched news data."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "",
        provider: str = "ark",
        base_url: str = "",
        horizon_data_dir: str = "",
        output_dir: str = "",
        console=None,
    ):
        cfg = PROVIDER_CONFIGS.get(provider, PROVIDER_CONFIGS["ark"])
        self.provider = provider
        self.model = model or cfg["default_model"]
        self.base_url = base_url or cfg.get("default_base_url", "")
        env_key = cfg["env_key"]
        self.api_key = api_key or os.environ.get(env_key, "")
        self.horizon_data_dir = horizon_data_dir
        self.output_dir = Path(output_dir or "data/broadcasts")
        self.console = console or _NullConsole()

    def load_enriched_items(self, date: str) -> list[dict]:
        """Load enriched news items from Horizon's JSON export.

        Args:
            date: Date string in YYYY-MM-DD format

        Returns:
            List of enriched item dicts

        Raises:
            FileNotFoundError: If the enriched JSON file doesn't exist
        """
        # Search paths: explicit dir > ../Horizon/data/enriched > ./data/enriched
        search_paths = []
        if self.horizon_data_dir:
            search_paths.append(Path(self.horizon_data_dir) / "enriched" / f"{date}.json")
        search_paths.append(Path("../Horizon/data/enriched") / f"{date}.json")
        search_paths.append(Path("data/enriched") / f"{date}.json")

        for path in search_paths:
            if path.exists():
                self.console.print(f"  📂 Loaded enriched data from: {path}")
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)

        raise FileNotFoundError(
            f"No enriched data found for {date}. "
            f"Searched: {', '.join(str(p) for p in search_paths)}\n"
            f"Hint: Make sure Horizon has run and exported data/enriched/{date}.json"
        )

    async def generate_script(
        self,
        items: list[dict],
        date: str,
        language: str = "zh",
        max_items: int = 6,
    ) -> BroadcastScript:
        """Generate a broadcast script from enriched news items.

        Args:
            items: List of enriched news item dicts
            date: Date string (YYYY-MM-DD)
            language: "en" or "zh"
            max_items: Maximum number of stories to feature

        Returns:
            BroadcastScript with the generated content
        """
        language_name = "Chinese (Simplified)" if language == "zh" else "English"

        # Format items for the prompt (sorted by score descending)
        sorted_items = sorted(items, key=lambda x: x.get("ai_score", 0) or 0, reverse=True)
        formatted = "\n".join(format_item_for_prompt(item) for item in sorted_items)

        user_prompt = BROADCAST_USER.format(
            date=date,
            total_count=len(sorted_items),
            max_items=max_items,
            items=formatted,
            language=language,
            language_name=language_name,
        )

        self.console.print(f"  🤖 Generating broadcast script with {self.provider} ({self.model})...")
        client = _build_client(self.provider, self.api_key, self.base_url)
        content = await _call_model(
            client,
            self.provider,
            self.model,
            BROADCAST_SYSTEM,
            user_prompt,
            max_tokens=4096,
            temperature=0.7,
        )

        # Estimate duration from the content or calculate one
        duration = self._estimate_duration(content)

        # Extract title from the first line
        title_line = content.strip().split("\n")[0]
        title = re.sub(r"^#+\s*", "", title_line).strip()

        script = BroadcastScript(
            date=date,
            title=title,
            body=content,
            estimated_duration_seconds=duration,
            item_count=min(len(sorted_items), max_items),
            generated_at=datetime.now(timezone.utc).isoformat(),
        )
        return script

    def save_script(self, script: BroadcastScript) -> Path:
        """Save a broadcast script to disk.

        Args:
            script: The BroadcastScript to save

        Returns:
            Path to the saved file
        """
        self.output_dir.mkdir(parents=True, exist_ok=True)
        path = self.output_dir / f"{script.date}-script.md"

        with open(path, "w", encoding="utf-8") as f:
            f.write(script.body)

        self.console.print(f"  💾 Saved broadcast script to: {path}")
        return path

    @staticmethod
    def _estimate_duration(content: str) -> int:
        """Estimate broadcast duration in seconds (~150 words or ~250 CJK chars per 30s)."""
        # Count CJK characters
        cjk_count = sum(1 for c in content if "一" <= c <= "鿿")
        # Count English words
        word_count = len(re.findall(r"[a-zA-Z]+", content))

        # Speaking rate: ~150 English words/min, or ~500 CJK chars/min (250 per 30s)
        if cjk_count > word_count:
            chars_per_30s = 250
            total_chars = cjk_count + word_count * 2
            segments = max(1, total_chars // chars_per_30s)
        else:
            words_per_30s = 75
            segments = max(1, word_count // words_per_30s)

        return segments * 30

    async def run(
        self,
        date: str,
        language: str = "zh",
        max_items: int = 6,
    ) -> Path:
        """Full pipeline: load → generate → save.

        Args:
            date: Date string in YYYY-MM-DD format
            language: "en" or "zh"
            max_items: Maximum number of stories to feature

        Returns:
            Path to the saved broadcast script
        """
        self.console.print(f"\n🎙️  Generating broadcast script for {date}...")

        items = self.load_enriched_items(date)
        if not items:
            self.console.print("[yellow]  No enriched items found. Nothing to broadcast.[/yellow]")
            raise ValueError("No items to broadcast")

        self.console.print(f"  📰 Loaded {len(items)} enriched news items")

        script = await self.generate_script(items, date, language, max_items)

        duration_min = script.estimated_duration_seconds // 60
        duration_sec = script.estimated_duration_seconds % 60
        self.console.print(
            f"  ⏱️  Estimated duration: {duration_min}m {duration_sec}s "
            f"({script.item_count} stories)"
        )

        path = self.save_script(script)
        return path


class _NullConsole:
    """No-op console for environments without rich."""

    def print(self, *args, **kwargs):
        pass
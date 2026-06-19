# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

Monorepo with three sub-projects forming a news broadcast video pipeline:

- **Horizon/** — AI-driven news aggregation system (Python). Scrapes sources (HackerNews, GitHub, Reddit, RSS, Twitter, Telegram, OpenBB, OSS Insight), analyzes via AI, generates enriched summaries, exports JSON for downstream use.
- **broadcast-engine/** — Broadcast script generator (Python). Reads Horizon's enriched JSON, generates conversational news anchor scripts via LLM (supports Ark/OpenAI/Anthropic).
- **remotion-product/** — Video production (TypeScript/React/Remotion). Renders news broadcast video with seendance text animations. Loads data via the data bridge.

### Data Flow

```
Horizon (scrape → analyze → enrich → export JSON)
    │  data/enriched/{date}.json
    ▼
broadcast-engine (load JSON → LLM → broadcast script)
    │  output/{date}-script.md
    ▼
scripts/data-bridge.py (Horizon JSON → Remotion-compatible JSON)
    │  remotion-product/src/data/remotion-data.json
    ▼
remotion-product (React components → MP4 video)
```

### Pipeline Orchestration

The 6-agent workflow (defined in `.claude/workflow-config.json` and `scripts/orchestrator.sh`):
1. **Phase 1 [parallel]** -- Agent 1 (Horizon), Agent 2 (broadcast-engine + TTS voiceover), Agent 3 (remotion) run simultaneously
2. **Phase 2 [loop]** — Agent 4 reviews Agent 3's video, max 3 iterations back to Agent 3
3. **Phase 3** — Agent 5 synthesizes all outputs into a composite video script
4. **Phase 4 [loop]** -- Agent 6 does final review, loops back to Agent 5 until passing

TTS voiceover: `scripts/generate_voiceover.py` reads `manifest.json` segments -> Edge TTS -> per-segment MP3 -> concatenated `voiceover.mp3`. Runs as part of Agent 2. Remotion plays via `<Audio src={staticFile("voiceover.mp3")}>`. Per-story audio (`story-{n}.mp3`) generated for `renderStory` prop.

## Key Commands

### Horizon
```bash
cd Horizon
uv run horizon                           # Run the full daily pipeline
uv run horizon-mcp                       # Start MCP server for orchestration
uv run horizon-wizard                    # Interactive setup wizard
uv run horizon-webhook                   # Start webhook server
uv run python -m pytest tests/           # Run all tests
uv run python -m pytest tests/test_rss.py -v  # Single test file
```

### Broadcast Engine
```bash
cd broadcast-engine
uv run broadcast --date YYYY-MM-DD --lang zh     # Generate Chinese broadcast script
uv run broadcast --date YYYY-MM-DD --lang en     # Generate English script
uv run broadcast --provider ark --model ark-code-latest  # Use Ark (default)
uv run broadcast --provider openai --model gpt-4o        # Use OpenAI
uv run broadcast --provider anthropic --model claude-sonnet-4-20250514  # Use Anthropic
```

### Remotion
```bash
cd remotion-product
npx remotion studio                      # Start Remotion Studio (localhost:6123)
npm run build                            # Render video to output/broadcast.mp4
```

### TTS Voiceover
```bash
python scripts/generate_voiceover.py                    # Generate full 162s voiceover
python scripts/generate_voiceover.py --rate +20%        # Faster narration
python scripts/generate_voiceover.py --voice zh-CN-YunyangNeural  # Male news anchor voice
python scripts/generate_voiceover.py --dry-run          # Preview segments
```

### Data Bridge & Pipeline
```bash
uv run python scripts/data-bridge.py --date YYYY-MM-DD --lang zh  # Convert Horizon data for Remotion
bash scripts/orchestrator.sh --dry-run   # Preview pipeline without executing
bash scripts/orchestrator.sh             # Run full pipeline
```

## AI Provider Abstraction

### Horizon (src/ai/client.py)
Uses `AIClient` abstract base with implementations for: Anthropic, OpenAI, Azure OpenAI, Gemini, plus OpenAI-compatible (Ali, Doubao, MiniMax, DeepSeek, Ollama). Supports `ChainedAIClient` for automatic fallback between providers. Configured via `data/config.json` → `AIConfig`.

### broadcast-engine (src/generator.py)
Three providers: `ark` (Volcengine, default), `openai`, `anthropic`. Config via `.env`:
```
ARK_API_KEY=...    ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/coding/v1
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
```

## Key Patterns

- **Config**: Horizon uses `data/config.json` with `${VAR}` env-var expansion. broadcast-engine uses `.env` loaded by python-dotenv.
- **Output structure**: Each sub-project writes to its own `output/` directory. Final pipeline output goes to `final-output/`.
- **Data contract**: Defined in `pipeline.json` — describes input/output format for each agent's artifacts.
- **Package management**: Python uses `uv` (not pip), Node uses `npm`. Run `uv sync` after changing `pyproject.toml`.

## Package Management Notes

- `uv` cache may fail on cross-drive temp files (Windows). Use `UV_CACHE_DIR=D:/path uv sync` to work around.
- Windows console needs `PYTHONIOENCODING=utf-8` for emoji output via `rich`.
# Pipeline Orchestrator for 6-Agent Video Production Workflow
#
# Usage:
#   bash scripts/orchestrator.sh           # Run full pipeline
#   bash scripts/orchestrator.sh --phase 1 # Run only Phase 1
#   bash scripts/orchestrator.sh --dry-run # Preview what will run
#
# This orchestrator manages the 6-agent workflow:
#   Phase 1: Agent 1 (Horizon) + Agent 2 (Broadcast Engine) + Agent 3 (Remotion) [parallel]
#   Phase 2: Agent 4 (Aesthetic Review) -> loop back to Agent 3 (max 3 iterations)
#   Phase 3: Agent 5 (Composite Script Development)
#   Phase 4: Agent 6 (Final Review)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${ROOT_DIR}/logs"
REPORT_DIR="${ROOT_DIR}/reports"
FINAL_OUTPUT_DIR="${ROOT_DIR}/final-output"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ──────────────────────────────────────────────────
# Setup
# ──────────────────────────────────────────────────

setup() {
    mkdir -p "${LOG_DIR}" "${REPORT_DIR}" "${FINAL_OUTPUT_DIR}"

    # Output subdirectories for each agent
    mkdir -p "${ROOT_DIR}/Horizon/output"
    mkdir -p "${ROOT_DIR}/broadcast-engine/output"
    mkdir -p "${ROOT_DIR}/remotion-product/output"
    mkdir -p "${ROOT_DIR}/remotion-product/composite-script"
}

log() {
    local phase="$1"
    local message="$2"
    echo -e "${BLUE}[${phase}]${NC} ${message}"
    echo "[${phase}] ${message}" >> "${LOG_DIR}/pipeline-${TIMESTAMP}.log"
}

success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1"
}

# ──────────────────────────────────────────────────
# Phase 1: Parallel Content Processing
# ──────────────────────────────────────────────────

phase1_horizon() {
    log "Phase1-Agent1" "Starting Horizon content processing..."

    HORIZON_DIR="${ROOT_DIR}/Horizon"
    HORIZON_OUTPUT="${HORIZON_DIR}/output"
    ENRICHED_DATA="${HORIZON_DIR}/data/enriched/2026-06-11.json"

    if [ ! -f "${ENRICHED_DATA}" ]; then
        error "No enriched data found at ${ENRICHED_DATA}"
        return 1
    fi

    # Generate daily digest
    log "Phase1-Agent1" "Generating daily digest from enriched data..."
    python3 -c "
import json, os
from datetime import datetime

with open('${ENRICHED_DATA}', 'r', encoding='utf-8') as f:
    items = json.load(f)

items.sort(key=lambda x: x.get('ai_score', 0), reverse=True)

# Generate digest
digest = []
digest.append(f'# Horizon Daily Digest — 2026-06-11\n')
digest.append(f'Total items: {len(items)} | Average score: {sum(i.get(\"ai_score\",0) for i in items)/len(items):.1f}/10\n')

for item in items:
    digest.append(f'## {item[\"title\"]}')
    digest.append(f'- **Source**: {item[\"source_type\"]} | **Score**: {item[\"ai_score\"]}/10')
    digest.append(f'- **Summary**: {item.get(\"ai_summary\", \"No summary\")}')
    digest.append(f'- **Tags**: {\", \".join(item.get(\"ai_tags\", []))}')
    digest.append(f'- **URL**: {item[\"url\"]}')
    digest.append('')

os.makedirs('${HORIZON_OUTPUT}', exist_ok=True)
with open('${HORIZON_OUTPUT}/daily-digest-2026-06-11.md', 'w', encoding='utf-8') as f:
    f.write('\n'.join(digest))
"
    success "Horizon digest generated: ${HORIZON_OUTPUT}/daily-digest-2026-06-11.md"

    # Copy shared data for downstream agents
    cp "${ENRICHED_DATA}" "${HORIZON_OUTPUT}/enriched-2026-06-11.json"
    success "Horizon data copied for downstream consumption"

    echo "${HORIZON_OUTPUT}"
}

phase1_broadcast() {
    log "Phase1-Agent2" "Starting Broadcast Engine processing..."

    BE_DIR="${ROOT_DIR}/broadcast-engine"
    BE_OUTPUT="${BE_DIR}/output"
    HORIZON_DATA="${ROOT_DIR}/Horizon/data/enriched/2026-06-11.json"

    mkdir -p "${BE_OUTPUT}"

    if [ ! -f "${HORIZON_DATA}" ]; then
        error "Horizon enriched data not found at ${HORIZON_DATA}"
        return 1
    fi

    # Check if ANTHROPIC_API_KEY is available
    if [ -n "${ANTHROPIC_API_KEY:-}" ] && [ "${ANTHROPIC_API_KEY}" != "sk-ant-xxx" ]; then
        log "Phase1-Agent2" "ANTHROPIC_API_KEY found. Running broadcast-engine..."
        cd "${BE_DIR}"
        uv run broadcast --date 2026-06-11 --lang zh --output-dir "${BE_OUTPUT}" 2>> "${LOG_DIR}/be-zh-${TIMESTAMP}.log" || {
            warn "API broadcast failed, falling back to manual generation"
            phase1_broadcast_fallback
        }
        uv run broadcast --date 2026-06-11 --lang en --output-dir "${BE_OUTPUT}" 2>> "${LOG_DIR}/be-en-${TIMESTAMP}.log" || true
    else
        warn "ANTHROPIC_API_KEY not configured. Generating broadcast scripts manually."
        phase1_broadcast_fallback
    fi

    	# Generate TTS voiceover (if manifest.json exists)
	log "Phase1-Agent2" "Generating TTS voiceover..."
	if [ -f "${BE_OUTPUT}/manifest.json" ]; then
		HTTP_PROXY=http://127.0.0.1:7890 HTTPS_PROXY=http://127.0.0.1:7890 		PYTHONIOENCODING=utf-8 python "${ROOT_DIR}/scripts/generate_voiceover.py" --rate +15% 			2>> "${LOG_DIR}/tts-${TIMESTAMP}.log" 			&& success "TTS voiceover generated" 			|| warn "TTS generation failed (non-critical, continuing)"
	else
		warn "manifest.json not found, skipping TTS (fallback mode)"
	fi

	success "Broadcast scripts generated in ${BE_OUTPUT}"
    echo "${BE_OUTPUT}"
}

phase1_broadcast_fallback() {
    python3 -c "
import json, os

with open('${ROOT_DIR}/Horizon/data/enriched/2026-06-11.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

items.sort(key=lambda x: x.get('ai_score', 0), reverse=True)

# Chinese script
script_zh = []
script_zh.append('# 2026年6月11日 新闻播报稿\n')
script_zh.append(f'本期共 {len(items)} 条新闻\n')
script_zh.append('---\n')

for i, item in enumerate(items, 1):
    title_zh = item.get('metadata', {}).get('title_zh', item['title'])
    summary_zh = item.get('metadata', {}).get('detailed_summary_zh', item.get('ai_summary', ''))
    score = item.get('ai_score', 0)
    tags = ', '.join(item.get('ai_tags', []))

    script_zh.append(f'## 新闻 {i}：[{title_zh}]({item[\"url\"]})')
    script_zh.append(f'**评分**: {score}/10')
    script_zh.append(f'**标签**: {tags}')
    script_zh.append(f'')
    script_zh.append(summary_zh)
    script_zh.append('---\n')

with open('${ROOT_DIR}/broadcast-engine/output/2026-06-11-script.md', 'w', encoding='utf-8') as f:
    f.write('\n'.join(script_zh))

# English script
script_en = []
script_en.append(f'# News Broadcast — June 11, 2026\n')
script_en.append(f'Featuring {len(items)} stories\n')
script_en.append('---\n')

for i, item in enumerate(items, 1):
    title = item['title']
    summary = item.get('ai_summary', '')
    score = item.get('ai_score', 0)
    tags = ', '.join(item.get('ai_tags', []))

    script_en.append(f'## Story {i}: [{title}]({item[\"url\"]})')
    script_en.append(f'**Score**: {score}/10 | **Tags**: {tags}')
    script_en.append(f'')
    script_en.append(summary)
    script_en.append('---\n')

with open('${ROOT_DIR}/broadcast-engine/output/2026-06-11-script-en.md', 'w', encoding='utf-8') as f:
    f.write('\n'.join(script_en))

print('Manual broadcast scripts generated successfully')
"
}

phase1_remotion() {
    log "Phase1-Agent3" "Starting Remotion video production..."

    REMOTION_DIR="${ROOT_DIR}/remotion-product"
    REMOTION_OUTPUT="${REMOTION_DIR}/output"

    mkdir -p "${REMOTION_OUTPUT}"

    # Check if node_modules exists
    if [ ! -d "${REMOTION_DIR}/node_modules" ]; then
        log "Phase1-Agent3" "Installing dependencies..."
        cd "${REMOTION_DIR}"
        npm install 2>> "${LOG_DIR}/npm-install-${TIMESTAMP}.log"
    fi

    # Start Remotion Studio in background
    log "Phase1-Agent3" "Starting Remotion Studio..."
    cd "${REMOTION_DIR}"
    npx remotion studio --port 6123 &
    STUDIO_PID=$!
    echo $STUDIO_PID > "${LOG_DIR}/remotion-studio.pid"

    success "Remotion Studio started (PID: $STUDIO_PID) at http://localhost:6123"
    echo "${REMOTION_DIR}"
}

# ──────────────────────────────────────────────────
# Phase 2: Aesthetic Review Loop
# ──────────────────────────────────────────────────

phase2_review() {
    local iteration=$1
    log "Phase2-Agent4" "Starting aesthetic review (iteration ${iteration})..."

    REMOTION_DIR="${ROOT_DIR}/remotion-product"
    REVIEW_FILE="${REPORT_DIR}/review-report-${iteration}.md"

    # Generate review report template
    cat > "${REVIEW_FILE}" << 'EOF'
# Aesthetic Review Report

## Review Criteria
1. Visual Effects: Color, composition, animation smoothness
2. Aesthetic Quality: Visual style consistency
3. Technical Quality: Remotion rendering issues
4. Seendance Effects: Natural and coordinated feel

## Score: __/10

## Issues Found
-

## Improvement Suggestions
-

## Verdict: [PASS / FAIL]
EOF

    echo "Review report generated: ${REVIEW_FILE}"
    echo "Please review ${REMOTION_DIR} and fill in the report."
    echo ""
    read -p "Enter verdict (pass/fail): " verdict

    echo "${verdict}"
}

# ──────────────────────────────────────────────────
# Phase 3: Composite Script Development
# ──────────────────────────────────────────────────

phase3_composite() {
    log "Phase3-Agent5" "Developing composite video script..."

    COMPOSITE_DIR="${ROOT_DIR}/remotion-product/composite-script"
    mkdir -p "${COMPOSITE_DIR}"

    # Generate composite script entry point
    cat > "${COMPOSITE_DIR}/composite-video.tsx" << 'COMPOSITE_EOF'
/**
 * Composite Video Script
 *
 * Integrates:
 * 1. Horizon enriched news data (JSON)
 * 2. Broadcast-engine broadcast scripts (Markdown)
 * 3. Remotion video components (React/Remotion)
 * 4. Review report feedback (for improvements)
 *
 * This is the master composition that ties everything together.
 */
import React from "react";
import { Composition } from "remotion";
import { CompositeBroadcast } from "./CompositeBroadcast";

// Read from the shared data contract
// - Horizon data: ../../Horizon/output/enriched-2026-06-11.json
// - Broadcast script: ../../broadcast-engine/output/2026-06-11-script.md
// - Review report: ../../reports/

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

const TOTAL_DURATION = 600; // 20 seconds @ 30fps

export const CompositeRoot: React.FC = () => {
  return (
    <Composition
      id="CompositeBroadcast"
      component={CompositeBroadcast}
      durationInFrames={TOTAL_DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
COMPOSITE_EOF

    cat > "${COMPOSITE_DIR}/CompositeBroadcast.tsx" << 'COMPOSITE_BROADCAST_EOF'
/**
 * CompositeBroadcast - The synthesis of all pipeline outputs.
 *
 * This component integrates:
 * - Opening titles (from broadcast script)
 * - News items (from Horizon data)
 * - Seendance effects (from remotion components)
 * - Closing credits
 */
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";

// Dynamic data loader - reads from shared data contract
// In production, this will load from:
//   ../../Horizon/output/enriched-2026-06-11.json
//   ../../broadcast-engine/output/2026-06-11-script.md

interface CompositeNewsItem {
  id: string;
  title: string;
  summary: string;
  sourceType: string;
  score: number;
  tags: string[];
}

interface CompositeBroadcastProps {
  date?: string;
  title?: string;
  items?: CompositeNewsItem[];
}

const SAMPLE_ITEMS: CompositeNewsItem[] = [
  {
    id: "1",
    title: "AI Agent Social-Engineering Attack",
    summary: "An AI agent submitted patches to open-source projects using LLM-generated justifications to overwhelm maintainers.",
    sourceType: "hackernews",
    score: 9.0,
    tags: ["AI safety", "open source security"],
  },
  {
    id: "2",
    title: "Anthropic Reverses Secret Sabotage Policy",
    summary: "Anthropic walked back a policy that secretly limited Claude's helpfulness for AI researchers.",
    sourceType: "rss",
    score: 9.0,
    tags: ["Anthropic", "AI ethics"],
  },
];

export const CompositeBroadcast: React.FC<CompositeBroadcastProps> = ({
  date = "June 11, 2026",
  title = "Horizon News Broadcast",
  items = SAMPLE_ITEMS,
}) => {
  const OPENING_DURATION = 90;
  const ITEM_DURATION = 75;
  const CLOSING_DURATION = 90;
  const totalDuration = OPENING_DURATION + items.length * ITEM_DURATION + CLOSING_DURATION;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a1e" }}>
      <Sequence from={0} durationInFrames={OPENING_DURATION}>
        <OpeningContent date={date} title={title} />
      </Sequence>
      {items.map((item, i) => (
        <Sequence
          key={item.id}
          from={OPENING_DURATION + i * ITEM_DURATION}
          durationInFrames={ITEM_DURATION}
        >
          <NewsItemContent item={item} index={i} />
        </Sequence>
      ))}
      <Sequence
        from={OPENING_DURATION + items.length * ITEM_DURATION}
        durationInFrames={CLOSING_DURATION}
      >
        <ClosingContent count={items.length} />
      </Sequence>
    </AbsoluteFill>
  );
};

const OpeningContent: React.FC<{ date: string; title: string }> = ({ date, title }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
    <h1 style={{ color: "#fff", fontSize: 64, fontFamily: "sans-serif" }}>{title}</h1>
    <p style={{ color: "#8899cc", fontSize: 18 }}>{date}</p>
  </div>
);

const NewsItemContent: React.FC<{ item: CompositeNewsItem; index: number }> = ({ item }) => (
  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, height: "100%" }}>
    <h2 style={{ color: "#fff", fontSize: 36 }}>{item.title}</h2>
    <p style={{ color: "#c0c8e0", fontSize: 20, lineHeight: 1.6 }}>{item.summary}</p>
    <div style={{ color: "#667799", fontSize: 14, marginTop: 20 }}>
      {item.tags.join(" · ")}
    </div>
  </div>
);

const ClosingContent: React.FC<{ count: number }> = ({ count }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
    <h2 style={{ color: "#fff", fontSize: 48 }}>Thanks for Watching</h2>
    <p style={{ color: "#8899bb", fontSize: 16 }}>{count} stories covered today</p>
    <p style={{ color: "#ff6b35", fontSize: 28, marginTop: 50 }}>HORIZON</p>
  </div>
);

export default CompositeBroadcast;
COMPOSITE_BROADCAST_EOF

    success "Composite script created in ${COMPOSITE_DIR}"
    echo "${COMPOSITE_DIR}"
}

# ──────────────────────────────────────────────────
# Phase 4: Final Review
# ──────────────────────────────────────────────────

phase4_final_review() {
    log "Phase4-Agent6" "Starting final review..."

    AGENT6_DIR="${ROOT_DIR}/agent6-final-review"
    ASSEMBLED_VIDEO="${ROOT_DIR}/agent5-video-assembler/output/broadcast-final.mp4"
    MANIFEST="${ROOT_DIR}/broadcast-engine/output/manifest.json"
    VOICEOVER_MAP="${ROOT_DIR}/broadcast-engine/output/voiceover/voiceover-map.json"
    REMOTION_OUTPUT="${ROOT_DIR}/remotion-product/output"
    FINAL_OUTPUT_DIR="${ROOT_DIR}/final-output"

    python "${AGENT6_DIR}/scripts/final_review.py"         --assembled-video "${ASSEMBLED_VIDEO}"         --manifest "${MANIFEST}"         --voiceover-map "${VOICEOVER_MAP}"         --input-dir "${REMOTION_OUTPUT}"         --output-dir "${AGENT6_DIR}/output"         --report-dir "${REPORT_DIR}"         --final-output-dir "${FINAL_OUTPUT_DIR}"

    local EXIT_CODE=$?
    if [ $EXIT_CODE -eq 0 ]; then
        echo "pass"
    else
        echo "fail"
    fi
}

# ──────────────────────────────────────────────────
# Final Output Generation
# ──────────────────────────────────────────────────

generate_final_output() {
    log "FINAL" "Generating final output..."

    FINAL_OUTPUT_DIR="${ROOT_DIR}/final-output"
    mkdir -p "${FINAL_OUTPUT_DIR}"

    # Collect all outputs
    TIMESTAMP_NOW=$(date +"%Y%m%d_%H%M%S")
    FINAL_DIR="${FINAL_OUTPUT_DIR}/${TIMESTAMP_NOW}"
    mkdir -p "${FINAL_DIR}"

    # Copy outputs
    cp -r "${ROOT_DIR}/Horizon/output" "${FINAL_DIR}/horizon-output" 2>/dev/null || true
    cp -r "${ROOT_DIR}/broadcast-engine/output" "${FINAL_DIR}/broadcast-output" 2>/dev/null || true
    cp -r "${ROOT_DIR}/remotion-product/output" "${FINAL_DIR}/video-output" 2>/dev/null || true
    true # composite-script no longer used
    cp -r "${REPORT_DIR}" "${FINAL_DIR}/reports" 2>/dev/null || true

    # Generate pipeline summary
    cat > "${FINAL_DIR}/SUMMARY.md" << EOF
# Pipeline Execution Summary

**Date**: $(date)
**Pipeline ID**: ${TIMESTAMP_NOW}

## Outputs
- Horizon Products: final-output/${TIMESTAMP_NOW}/horizon-output/
- Broadcast Engine Products: final-output/${TIMESTAMP_NOW}/broadcast-output/
- Remotion Video Products: final-output/${TIMESTAMP_NOW}/video-output/
- Composite Script: final-output/${TIMESTAMP_NOW}/composite-script/
- Reports: final-output/${TIMESTAMP_NOW}/reports/

## Execution Log
See: logs/pipeline-${TIMESTAMP}.log
EOF

    success "Final output generated: ${FINAL_DIR}"
    echo "${FINAL_DIR}"
}

# ──────────────────────────────────────────────────
# Main Pipeline Orchestration
# ──────────────────────────────────────────────────

run_pipeline() {
    local start_phase="${1:-1}"

    echo ""
    echo "╔═══════════════════════════════════════════════════════╗"
    echo "║       6-Agent Video Production Pipeline             ║"
    echo "╠═══════════════════════════════════════════════════════╣"
    echo "║  Phase 1: Agent 1 (Horizon) + Agent 2 (BE)          ║"
    echo "║          + Agent 3 (Remotion) [PARALLEL]             ║"
    echo "║  Phase 2: Agent 4 (Review) → Agent 3 (max 3 tries)  ║"
    echo "║  Phase 3: Agent 5 (Composite Script)                 ║"
    echo "║  Phase 4: Agent 6 (Final Review)                     ║"
    echo "╚═══════════════════════════════════════════════════════╝"
    echo ""

    setup

    # ── Phase 1 ──
    if [ "${start_phase}" -le 1 ]; then
        echo ""
        log "PHASE1" "=== Phase 1: Parallel Content Processing ==="

        # Launch 3 agents in parallel
        phase1_horizon &
        PID_HORIZON=$!

        phase1_broadcast &
        PID_BROADCAST=$!

        phase1_remotion &
        PID_REMOTION=$!

        # Wait for all
        wait $PID_HORIZON
        HORIZON_OUTPUT="$(cat /proc/$$/fd/0 2>/dev/null)" || true

        wait $PID_BROADCAST
        BE_OUTPUT="$(cat /proc/$$/fd/0 2>/dev/null)" || true

        wait $PID_REMOTION
        REMOTION_OUTPUT="$(cat /proc/$$/fd/0 2>/dev/null)" || true

        success "Phase 1 complete"
    fi

    # ── Phase 2 (Review Loop) ──
    if [ "${start_phase}" -le 2 ]; then
        echo ""
        log "PHASE2" "=== Phase 2: Aesthetic Review Loop ==="

        MAX_ITERATIONS=3
        VERDICT="fail"

        for i in $(seq 1 $MAX_ITERATIONS); do
            log "PHASE2" "Review iteration ${i}/${MAX_ITERATIONS}"

            VERDICT=$(phase2_review $i)

            if [ "${VERDICT}" = "pass" ]; then
                success "Review passed on iteration ${i}"
                break
            else
                warn "Review failed (iteration ${i}/${MAX_ITERATIONS})"
                if [ $i -eq $MAX_ITERATIONS ]; then
                    error "Max iterations reached. Pipeline terminated."
                    exit 1
                fi
                log "PHASE2" "Sending feedback to Agent 3 for revision..."
            fi
        done

        success "Phase 2 complete"
    fi

    # ── Phase 3 ──
    if [ "${start_phase}" -le 3 ]; then
        echo ""
        log "PHASE3" "=== Phase 3: Composite Script Development ==="

        phase3_composite
        success "Phase 3 complete"
    fi

    # ── Phase 4 ──
    if [ "${start_phase}" -le 4 ]; then
        echo ""
        log "PHASE4" "=== Phase 4: Final Review ==="

        while true; do
            VERDICT=$(phase4_final_review)

            if [ "${VERDICT}" = "pass" ]; then
                success "Final review passed!"
                break
            else
                warn "Final review failed. Sending back to Agent 5 for revision..."
            fi
        done

        generate_final_output
        success "Phase 4 complete"
    fi

    echo ""
    success "=========================================="
    success "Pipeline execution complete!"
    success "=========================================="
    echo ""
    echo "Final output: ${ROOT_DIR}/final-output/"
    echo "Logs: ${LOG_DIR}/pipeline-${TIMESTAMP}.log"
}

# ──────────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────────

usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --phase N    Start from phase N (1-4)"
    echo "  --dry-run    Show pipeline plan without executing"
    echo "  --help       Show this help"
    exit 0
}

DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --phase)
            START_PHASE="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            usage
            ;;
        *)
            error "Unknown option: $1"
            usage
            ;;
    esac
done

if [ "$DRY_RUN" = true ]; then
    echo ""
    echo "Pipeline Dry Run"
    echo "================"
    echo "Phase 1: Horizon + Broadcast Engine + Remotion (parallel)"
    echo "Phase 2: Aesthetic Review (max 3 iterations)"
    echo "Phase 3: Composite Script Development"
    echo "Phase 4: Final Review"
    echo ""
    echo "Output: ${ROOT_DIR}/final-output/"
    echo ""
    exit 0
fi

run_pipeline "${START_PHASE:-1}"
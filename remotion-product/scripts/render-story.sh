#!/bin/bash
# render-story.sh — Render a single news story with Agent 4 review integration
# Usage: bash scripts/render-story.sh <storyIndex> [includeIntro] [includeOutro]
#
# Examples:
#   bash scripts/render-story.sh 0          # Story 1 + intro (~615 frames, ~2 min)
#   bash scripts/render-story.sh 1 false    # Story 2 only (~465 frames, ~1.5 min)
#   bash scripts/render-story.sh 0 false true  # Story 1 + outro
#
# Chrome config for headless WebGL-free rendering
CHROME_EXE="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
CHROME_FLAGS="--headless=new --no-sandbox --ignore-gpu-blocklist --enable-unsafe-swiftshader"
USER_DATA_DIR="D:\\claude_demo\\.chrome-temp"

STORY_INDEX=${1:-0}
INCLUDE_INTRO=${2:-true}
INCLUDE_OUTRO=${3:-false}
OUTPUT_FILE="output/story-${STORY_INDEX}.mp4"

# Build --props JSON
PROPS="{\"renderStory\":{\"storyIndex\":${STORY_INDEX},\"includeIntro\":${INCLUDE_INTRO},\"includeOutro\":${INCLUDE_OUTRO}}}"

# Calculate frame range
STORY_FRAMES=465
INTRO_FRAMES=150
OUTRO_FRAMES=150
TOTAL_FRAMES=0
[ "${INCLUDE_INTRO}" = "true" ] && TOTAL_FRAMES=$((TOTAL_FRAMES + INTRO_FRAMES))
TOTAL_FRAMES=$((TOTAL_FRAMES + STORY_FRAMES))
[ "${INCLUDE_OUTRO}" = "true" ] && TOTAL_FRAMES=$((TOTAL_FRAMES + OUTRO_FRAMES))
LAST_FRAME=$((TOTAL_FRAMES - 1))
FRAMES_RANGE="0-${LAST_FRAME}"

echo "=== Rendering story ${STORY_INDEX} ==="
echo "Props: ${PROPS}"
echo "Output: ${OUTPUT_FILE}"

cd "$(dirname "$0")/.."  # Navigate to remotion-product/

npx remotion render src/index.ts ManifestVideo "${OUTPUT_FILE}" \
  --props="${PROPS}" \
  --frames="${FRAMES_RANGE}" \
  --codec=h264 \
  --crf=18 \
  --concurrency=2 \
  --browser-executable="${CHROME_EXE}" \
  --chrome-flag="--headless=new" \
  --chrome-flag="--no-sandbox" \
  --chrome-flag="--ignore-gpu-blocklist" \
  --chrome-flag="--enable-unsafe-swiftshader" \
  --chrome-flag="--user-data-dir=${USER_DATA_DIR}"

echo ""
echo "=== Done: ${OUTPUT_FILE} ==="
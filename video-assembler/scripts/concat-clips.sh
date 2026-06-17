#!/bin/bash
# concat-clips.sh — Agent 5: Stitch approved video clips into final broadcast
# Usage: bash scripts/concat-clips.sh
#
# Input files (from remotion-product/output/):
#   intro.mp4, story-0.mp4 ~ story-5.mp4, outro.mp4
# Output:
#   output/broadcast-final.mp4

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKSPACE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REMOTION_OUTPUT_DIR="D:/claude_demo/remotion-product/output"
OUTPUT_DIR="${WORKSPACE_DIR}/output"
mkdir -p "${OUTPUT_DIR}"

FILELIST="${OUTPUT_DIR}/concat-list.txt"
>"${FILELIST}"

echo "=== Agent 5: Video Assembler ==="
echo "Input:  ${REMOTION_OUTPUT_DIR}"
echo "Output: ${OUTPUT_DIR}/broadcast-final.mp4"
echo ""

# Input files in order
FILES=("intro.mp4" "story-0.mp4" "story-1.mp4" "story-2.mp4" "story-3.mp4" "story-4.mp4" "story-5.mp4" "outro.mp4")
ALL_EXIST=true

for f in "${FILES[@]}"; do
  INPUT_PATH="${REMOTION_OUTPUT_DIR}/${f}"
  if [ -f "${INPUT_PATH}" ]; then
    echo "  ✓ ${f} ($(ls -lh "${INPUT_PATH}" | awk '{print $5}'))"
    echo "file '$(cygpath -m "${INPUT_PATH}")'" >> "${FILELIST}"
  else
    echo "  ✗ ${f} NOT FOUND"
    ALL_EXIST=false
  fi
done

echo ""

if [ "$ALL_EXIST" = false ]; then
  echo "ERROR: Missing input files. Run Agent 3 (render) first."
  rm "${FILELIST}"
  exit 1
fi

echo "=== Concatenating with ffmpeg (zero re-encode) ==="
ffmpeg -f concat -safe 0 -i "${FILELIST}" \
  -c copy \
  -movflags +faststart \
  "${OUTPUT_DIR}/broadcast-final.mp4"

echo ""
if [ $? -eq 0 ]; then
  FINAL_SIZE=$(ls -lh "${OUTPUT_DIR}/broadcast-final.mp4" | awk '{print $5}')
  echo "✓ Done! broadcast-final.mp4 (${FINAL_SIZE})"
else
  echo "✗ ffmpeg failed"
  rm "${FILELIST}"
  exit 1
fi

# Cleanup
rm "${FILELIST}"
echo ""
#!/usr/bin/env bash
set -euo pipefail

PDF_PATH="${1:-/Users/vivi/Documents/产品思考工具/产品知识库/资源文件/《真需求》梁宁.pdf}"
OUT_PATH="${2:-/Users/vivi/Documents/产品思考工具/产品知识库/资源文件/文本提取/真需求-梁宁-ocr.txt}"
START_PAGE="${3:-1}"
END_PAGE="${4:-}"

if ! command -v pdfinfo >/dev/null 2>&1; then
  echo "pdfinfo not found. Please install poppler."
  exit 1
fi

if ! command -v pdftoppm >/dev/null 2>&1; then
  echo "pdftoppm not found. Please install poppler."
  exit 1
fi

if ! command -v tesseract >/dev/null 2>&1; then
  echo "tesseract not found."
  exit 1
fi

PAGES=$(pdfinfo "$PDF_PATH" | awk '/Pages/ {print $2}')
if [[ -z "$END_PAGE" ]]; then
  END_PAGE="$PAGES"
fi

mkdir -p "$(dirname "$OUT_PATH")"
tmp_dir="$(mktemp -d /var/folders/v0/dqf22v95667gbs5lcmjycb3c0000gn/T/ocr_pdf_XXXXXX)"
trap 'rm -rf "$tmp_dir"' EXIT

echo "OCR PDF: $PDF_PATH"
echo "Pages: $START_PAGE-$END_PAGE / $PAGES"
echo "Output: $OUT_PATH"
echo "" > "$OUT_PATH"

for page in $(seq "$START_PAGE" "$END_PAGE"); do
  echo "Processing page $page..." >&2
  pdftoppm -f "$page" -l "$page" -r 200 -png -singlefile "$PDF_PATH" "$tmp_dir/page" >/dev/null 2>&1
  tesseract "$tmp_dir/page.png" stdout -l chi_sim+eng --psm 6 >> "$OUT_PATH"
  printf "\n\n---- page %s ----\n\n" "$page" >> "$OUT_PATH"
  rm -f "$tmp_dir/page.png"
done

echo "Done. Output saved to $OUT_PATH"

#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/vivi/Documents/产品思考工具/产品知识库"
INBOX_DIR="$ROOT/原始数据/待处理"
RAW_IMG_DIR="$ROOT/原始数据/图片"
RAW_DOC_DIR="$ROOT/原始数据/文档"
RAW_WEB_DIR="$ROOT/原始数据/网页"
OCR_DIR="$ROOT/原始数据/OCR文本"

OCR_PDF_SH="/Users/vivi/Documents/产品思考工具/backend/ocr_pdf.sh"
INGEST_SCRIPT="/Users/vivi/Documents/产品思考工具/backend/ingest.py"
SPARKS_SCRIPT="/Users/vivi/Documents/产品思考工具/backend/generate_sparks_cards.py"
VENV_PY="/Users/vivi/Documents/产品思考工具/backend/venv/bin/python"
AUTO_INGEST="${AUTO_INGEST:-1}"
AUTO_SPARKS="${AUTO_SPARKS:-1}"
PROCESSED=0

mkdir -p "$INBOX_DIR" "$RAW_IMG_DIR" "$RAW_DOC_DIR" "$RAW_WEB_DIR" "$OCR_DIR"

log() {
  printf "[kb] %s\n" "$*"
}

lower_ext() {
  local filename="$1"
  local ext="${filename##*.}"
  printf "%s" "$ext" | tr '[:upper:]' '[:lower:]'
}

safe_mv() {
  local src="$1"
  local dest_dir="$2"
  local base="$(basename "$src")"
  local name="${base%.*}"
  local ext="${base##*.}"
  local dest="$dest_dir/$base"
  local i=1

  if [[ ! -e "$dest" ]]; then
    mv "$src" "$dest"
    printf "%s" "$dest"
    return
  fi

  while [[ -e "$dest_dir/${name}_$i.$ext" ]]; do
    i=$((i + 1))
  done
  dest="$dest_dir/${name}_$i.$ext"
  mv "$src" "$dest"
  printf "%s" "$dest"
}

ocr_image() {
  local img_path="$1"
  local base="$(basename "$img_path")"
  local name="${base%.*}"
  local out_base="$OCR_DIR/$name"

  if ! command -v tesseract >/dev/null 2>&1; then
    log "tesseract not found, skip OCR for $img_path"
    return
  fi

  log "OCR image: $img_path"
  tesseract "$img_path" "$out_base" -l chi_sim+eng --psm 6 >/dev/null 2>&1 || true
}

ocr_pdf() {
  local pdf_path="$1"
  local base="$(basename "$pdf_path")"
  local name="${base%.*}"
  local out_path="$OCR_DIR/${name}-ocr.txt"

  if [[ ! -x "$OCR_PDF_SH" ]]; then
    log "ocr_pdf.sh not found or not executable, skip OCR for $pdf_path"
    return
  fi

  log "OCR PDF: $pdf_path"
  "$OCR_PDF_SH" "$pdf_path" "$out_path"
}

cleanup_ocr() {
  # Auto-clean temp/aux files
  rm -f "$OCR_DIR"/*.log "$OCR_DIR"/*.bak "$OCR_DIR"/*_merged.txt 2>/dev/null || true
}

process_path() {
  local path="$1"

  if [[ -d "$path" ]]; then
    for f in "$path"/*; do
      [[ -e "$f" ]] || continue
      process_path "$f"
    done
    return
  fi

  if [[ ! -f "$path" ]]; then
    return
  fi

  local ext
  ext="$(lower_ext "$path")"

  case "$ext" in
    png|jpg|jpeg|heic|heif|tif|tiff|bmp)
      ocr_image "$path"
      safe_mv "$path" "$RAW_IMG_DIR" >/dev/null
      PROCESSED=1
      ;;
    pdf)
      ocr_pdf "$path"
      safe_mv "$path" "$RAW_DOC_DIR" >/dev/null
      PROCESSED=1
      ;;
    doc|docx|ppt|pptx|xls|xlsx)
      safe_mv "$path" "$RAW_DOC_DIR" >/dev/null
      PROCESSED=1
      ;;
    html|htm|url)
      safe_mv "$path" "$RAW_WEB_DIR" >/dev/null
      PROCESSED=1
      ;;
    txt|md)
      safe_mv "$path" "$RAW_DOC_DIR" >/dev/null
      PROCESSED=1
      ;;
    *)
      safe_mv "$path" "$RAW_DOC_DIR" >/dev/null
      PROCESSED=1
      ;;
  esac
}

TARGETS=("$@")
if [[ ${#TARGETS[@]} -eq 0 ]]; then
  TARGETS=("$INBOX_DIR")
fi

for target in "${TARGETS[@]}"; do
  process_path "$target"
done

cleanup_ocr

if [[ "$AUTO_INGEST" == "1" && "$PROCESSED" == "1" && -f "$INGEST_SCRIPT" ]]; then
  log "Running ingest (essentials)..."
  if [[ -x "$VENV_PY" ]]; then
    "$VENV_PY" "$INGEST_SCRIPT" --essentials
  else
    python "$INGEST_SCRIPT" --essentials
  fi
fi

if [[ "$AUTO_SPARKS" == "1" && "$PROCESSED" == "1" && -f "$SPARKS_SCRIPT" ]]; then
  log "Generating Sparks cards..."
  if [[ -x "$VENV_PY" ]]; then
    "$VENV_PY" "$SPARKS_SCRIPT"
  else
    python "$SPARKS_SCRIPT"
  fi
fi
log "Done"

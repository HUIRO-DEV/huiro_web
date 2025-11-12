#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

VERSION="6.5.2"
CDN_BASE="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/${VERSION}"

command -v curl >/dev/null 2>&1 || {
  echo "[error] curl no está instalado" >&2
  exit 1
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TARGET_ROOT="${PROJECT_ROOT}/assets/fontawesome"
CSS_DIR="${TARGET_ROOT}/css"
WEBFONTS_DIR="${TARGET_ROOT}/webfonts"

mkdir -p "${CSS_DIR}" "${WEBFONTS_DIR}"

download() {
  local url="$1"
  local dest="$2"
  echo "Descargando ${url}" >&2
  curl -fL "${url}" -o "${dest}"
}

CSS_FILES=(
  "css/fontawesome.min.css"
  "css/solid.min.css"
)

FONT_FILES=(
  "webfonts/fa-solid-900.woff2"
)

for file in "${CSS_FILES[@]}"; do
  download "${CDN_BASE}/${file}" "${CSS_DIR}/$(basename "${file}")"
done

for file in "${FONT_FILES[@]}"; do
  download "${CDN_BASE}/${file}" "${WEBFONTS_DIR}/$(basename "${file}")"
done

echo "Font Awesome ${VERSION} descargado en ${TARGET_ROOT}" >&2
echo "Recuerda actualizar tu HTML para apuntar a assets/fontawesome/css/fontawesome.min.css y solid.min.css" >&2

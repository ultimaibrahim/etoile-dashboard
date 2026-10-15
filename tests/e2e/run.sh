#!/bin/bash
# Corre las pruebas de navegador en paralelo con un reintento (la red/login es intermitente). Uso: tests/e2e/run.sh [spec ...]
export NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection"
cd "$(dirname "$0")"
LIST=${@:-"smoke"}
run_one() { for t in 1 2; do out=$(timeout 280 node $1.js 2>&1 | grep -E '"resultados"|❌|QA ERR' | tr '\n' ' '); echo "$out" | grep -qE '"resultados":"([0-9]+)/\1 ok","errores_consola":\[\]' && { echo "✅ $1 $out"; return; }; sleep 3; done; echo "❌ $1 $out"; }
export -f run_one
echo $LIST | tr ' ' '\n' | xargs -P 3 -I{} bash -c 'run_one {}'

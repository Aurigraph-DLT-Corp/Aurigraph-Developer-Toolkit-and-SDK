#!/usr/bin/env bash
# ADM-173 gate telemetry — append structured skip/pass events for loop-closure metrics.
# Usage:
#   ./scripts/adm-gate-log.sh SCMAgent SKIP "org usage limit"
#   ./scripts/adm-gate-log.sh PreCommit PASS "scoped V12 tests"
#   ./scripts/adm-gate-log.sh SCMAgent PASS "" --commit abc1234
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
LOG="${ADM_GATE_LOG:-$REPO_ROOT/docs/adm/gate-telemetry.jsonl}"
GATE="${1:?gate name (e.g. SCMAgent, PreCommit, Approver)}"
VERDICT="${2:?PASS|SKIP|FAIL|BYPASS}"
REASON="${3:-}"
COMMIT=""
AGENT="${ADM_GATE_AGENT:-cursor}"

shift 3 2>/dev/null || shift $# 2>/dev/null || true
while [ $# -gt 0 ]; do
  case "$1" in
    --commit) COMMIT="${2:-}"; shift 2 ;;
    --agent) AGENT="${2:-}"; shift 2 ;;
    *) shift ;;
  esac
done

[ -z "$COMMIT" ] && COMMIT="$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || echo null)"

mkdir -p "$(dirname "$LOG")"
TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# JSON-escape reason (minimal)
esc_reason="$(printf '%s' "$REASON" | sed 's/\\/\\\\/g; s/"/\\"/g')"

printf '{"ts":"%s","gate":"%s","verdict":"%s","reason":"%s","commit":"%s","agent":"%s"}\n' \
  "$TS" "$GATE" "$VERDICT" "$esc_reason" "$COMMIT" "$AGENT" >>"$LOG"

echo "📋 ADM gate logged: $GATE $VERDICT ${REASON:+( $REASON )} → $LOG"

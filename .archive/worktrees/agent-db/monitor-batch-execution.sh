#!/bin/bash

# Batch Execution Monitor - Real-time Progress Tracking
# Displays live progress of batch sprint execution

echo "════════════════════════════════════════════════════"
echo "  Batch Sprint Execution Monitor"
echo "  Real-time Progress Tracking"
echo "════════════════════════════════════════════════════"
echo ""

# Check if batch execution is running
if ! pgrep -f "batch-sprint-executor.js" > /dev/null; then
    echo "⚠️  Batch execution is not running"
    echo ""
    echo "Last execution log:"
    tail -20 batch-execution-log.txt 2>/dev/null || echo "No log file found"
    exit 0
fi

echo "✅ Batch execution is running"
echo ""

# Display progress from JSON file
if [ -f "batch-execution-progress.json" ]; then
    echo "📊 Current Progress:"
    echo ""

    # Extract key metrics using grep and basic parsing
    SPRINTS_COMPLETED=$(grep -o '"sprintsCompleted":[0-9]*' batch-execution-progress.json | cut -d':' -f2)
    TOTAL_SPRINTS=$(grep -o '"totalSprints":[0-9]*' batch-execution-progress.json | cut -d':' -f2)
    TICKETS_COMPLETED=$(grep -o '"ticketsCompleted":[0-9]*' batch-execution-progress.json | cut -d':' -f2)
    TOTAL_TICKETS=$(grep -o '"totalTickets":[0-9]*' batch-execution-progress.json | cut -d':' -f2)
    TICKETS_FAILED=$(grep -o '"ticketsFailed":[0-9]*' batch-execution-progress.json | cut -d':' -f2)

    echo "   Sprints: $SPRINTS_COMPLETED / $TOTAL_SPRINTS"
    echo "   Tickets: $TICKETS_COMPLETED / $TOTAL_TICKETS"
    echo "   Failed: $TICKETS_FAILED"

    if [ ! -z "$TICKETS_COMPLETED" ] && [ "$TICKETS_COMPLETED" -gt 0 ]; then
        SUCCESS_RATE=$((TICKETS_COMPLETED * 100 / (TICKETS_COMPLETED + TICKETS_FAILED)))
        echo "   Success Rate: $SUCCESS_RATE%"
    fi

    echo ""
    echo "   Last Updated: $(grep -o '"lastUpdated":"[^"]*"' batch-execution-progress.json | cut -d'"' -f4)"
    echo ""
else
    echo "⚠️  No progress file found yet"
    echo ""
fi

# Show recent log output
echo "📝 Recent Activity (last 15 lines):"
echo ""
tail -15 batch-execution-log.txt 2>/dev/null || echo "No log output yet"
echo ""

# Show agent stats if available
if [ -f "batch-execution-progress.json" ]; then
    echo "🤖 Top Agents:"
    echo ""
    # Simple extraction of agent names and success counts
    grep -o '"[A-Z][A-Z][A-Z]":{' batch-execution-progress.json | cut -d'"' -f2 | head -5 | while read agent; do
        echo "   - $agent: Processing..."
    done
    echo ""
fi

echo "════════════════════════════════════════════════════"
echo ""
echo "Commands:"
echo "  watch -n 5 ./monitor-batch-execution.sh  # Auto-refresh every 5 seconds"
echo "  tail -f batch-execution-log.txt          # Follow live log"
echo "  cat batch-execution-progress.json        # View full progress data"
echo ""

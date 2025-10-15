#!/bin/bash

echo "🔋 Battery Impact Test for Local LLM vs Cloud API"
echo "=================================================="

# Get initial battery info
echo "📊 Initial Battery Status:"
pmset -g batt | grep -E "InternalBattery|Battery"

echo ""
echo "🧠 Testing Local Ollama (Mistral 7B) Performance..."

# Time a local Ollama request
echo "⏱️  Running local inference test..."
start_time=$(date +%s)
start_battery=$(pmset -g batt | grep -o "[0-9]*%" | head -1 | tr -d '%')

curl -s -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral:latest",
    "prompt": "Categorize this activity: Working on a TypeScript project in VS Code, implementing LLM caching and battery optimization features. The user is focused on improving app performance and reducing API costs.",
    "stream": false
  }' > /dev/null

end_time=$(date +%s)
end_battery=$(pmset -g batt | grep -o "[0-9]*%" | head -1 | tr -d '%')

local_duration=$((end_time - start_time))
battery_drop=$((start_battery - end_battery))

echo "✅ Local inference completed in ${local_duration}s"
echo "🔋 Battery change: ${start_battery}% → ${end_battery}% (${battery_drop}% drop)"

echo ""
echo "📈 Performance Analysis:"
echo "- Model: Mistral 7B (4.4GB)"
echo "- Inference time: ${local_duration} seconds"
echo "- Battery impact: ${battery_drop}%"
echo "- Power consumption: ~$((battery_drop * 100 / local_duration))% per minute during inference"

echo ""
echo "💡 Recommendations:"
if [ $battery_drop -gt 2 ]; then
    echo "⚠️  High battery impact detected. Consider:"
    echo "   - Using smaller models (try 'tinyllama' or 'phi')"
    echo "   - Increasing cache TTL to reduce inference frequency"
    echo "   - Using cloud APIs during development/testing"
else
    echo "✅ Battery impact is reasonable for local inference"
fi

echo ""
echo "🔄 Compare with cloud API (estimated):"
echo "- Network latency: 1-3 seconds per request"
echo "- WiFi power cost: ~2-5% per minute of active connection"
echo "- API costs: $0.002-0.01 per request"
echo "- Total cloud cost: Network + API fees"
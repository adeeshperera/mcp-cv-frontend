#!/bin/bash

echo "🧪 Testing MCP CV Server Deployment"
echo "=================================="

# Check if server URL is provided
if [ -z "$1" ]; then
    echo "❌ Please provide your Railway server URL as an argument"
    echo "Usage: ./test-deployment.sh https://your-app-name.railway.app"
    exit 1
fi

SERVER_URL=$1

echo "🌐 Testing server: $SERVER_URL"
echo ""

# Test health endpoint
echo "1️⃣  Testing health endpoint..."
curl -s "$SERVER_URL/health" | jq '.' || echo "❌ Health check failed"
echo ""

# Test tools endpoint
echo "2️⃣  Testing tools endpoint..."
curl -s "$SERVER_URL/tools" | jq '.tools[].name' || echo "❌ Tools endpoint failed"
echo ""

# Test tool execution
echo "3️⃣  Testing tool execution..."
curl -s -X POST "$SERVER_URL/execute" \
  -H "Content-Type: application/json" \
  -d '{"tool": "get_personal_info", "arguments": {}}' | jq '.' || echo "❌ Tool execution failed"
echo ""

echo "✅ Deployment test complete!"
echo "🔗 Your server is running at: $SERVER_URL"
echo "🔗 Your frontend will be at: https://your-app-name.vercel.app"

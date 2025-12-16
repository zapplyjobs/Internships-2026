#!/bin/bash

# Channel Test Runner
# This script runs the location channel test with environment variables

echo "🔍 Running Location Channel Test..."
echo ""
echo "⚠️  This will send test messages to Discord channels"
echo "   Messages will auto-delete after 10 seconds"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found"
    echo ""
    echo "Create .env file with:"
    echo "  DISCORD_TOKEN=your_bot_token"
    echo "  DISCORD_GUILD_ID=your_guild_id"
    echo "  DISCORD_REMOTE_USA_INT_CHANNEL_ID=..."
    echo "  DISCORD_NY_INT_CHANNEL_ID=..."
    echo "  DISCORD_AUSTIN_INT_CHANNEL_ID=..."
    echo "  DISCORD_CHICAGO_INT_CHANNEL_ID=..."
    echo "  DISCORD_SEATTLE_INT_CHANNEL_ID=..."
    echo "  DISCORD_REDMOND_INT_CHANNEL_ID=..."
    echo "  DISCORD_MV_INT_CHANNEL_ID=..."
    echo "  DISCORD_SF_INT_CHANNEL_ID=..."
    echo "  DISCORD_SUNNYVALE_INT_CHANNEL_ID=..."
    echo "  DISCORD_SAN_BRUNO_INT_CHANNEL_ID=..."
    echo "  DISCORD_BOSTON_INT_CHANNEL_ID=..."
    echo "  DISCORD_LA_INT_CHANNEL_ID=..."
    exit 1
fi

# Load environment variables
export $(cat .env | xargs)

# Run test
node .github/scripts/test-location-channels.js

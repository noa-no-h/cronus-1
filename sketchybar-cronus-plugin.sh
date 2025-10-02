#!/bin/bash

# SketchyBar plugin for Cronus category tracking
# This script reads category data from Cronus and displays the top 6 categories

DATA_FILE="/var/folders/6w/pyl18z3543j_p_j2cp1_2rg80000gn/T/cronus-category-data.json"

# Function to format duration from milliseconds
format_duration() {
    local ms=$1
    local seconds=$((ms / 1000))
    local minutes=$((seconds / 60))
    local hours=$((minutes / 60))
    local remaining_minutes=$((minutes % 60))
    
    if [ $hours -gt 0 ]; then
        echo "${hours}h ${remaining_minutes}m"
    elif [ $minutes -gt 0 ]; then
        echo "${minutes}m"
    else
        echo "${seconds}s"
    fi
}

# Check if data file exists and is recent (less than 5 minutes old)
if [ ! -f "$DATA_FILE" ] || [ $(($(date +%s) - $(stat -f %m "$DATA_FILE"))) -gt 300 ]; then
    # No data or data is stale
    sketchybar --set cronus.main label="No Data" icon="❌"
    # Hide all category items
    for i in {1..6}; do
        sketchybar --set "cronus.cat$i" drawing=off
    done
    exit 0
fi

# Read and parse JSON data
if ! command -v jq &> /dev/null; then
    sketchybar --set cronus.main label="jq required" icon="⚠️"
    exit 1
fi

# Get top 6 categories sorted by duration
categories=$(cat "$DATA_FILE" | jq -r '.categories | sort_by(-.totalDurationMs) | .[0:6] | .[] | "\(.emoji // "📋") \(.name) \(.totalDurationMs) \(.id)"')

# Get the most recently active category ID
most_recent_category_id=$(cat "$DATA_FILE" | jq -r '.mostRecentCategoryId // ""')

if [ -z "$categories" ]; then
    sketchybar --set cronus.main label="No Categories" icon="📭"
    # Hide all category items
    for i in {1..6}; do
        sketchybar --set "cronus.cat$i" drawing=off
    done
    exit 0
fi

# Hide the main item since we only want individual categories
sketchybar --set cronus.main drawing=off

# Update individual category items
counter=1
while IFS= read -r line && [ $counter -le 6 ]; do
    if [ -n "$line" ]; then
        emoji=$(echo "$line" | cut -d' ' -f1)
        # Get everything except first and last two fields for name
        name=$(echo "$line" | rev | cut -d' ' -f3- | rev | cut -d' ' -f2-)
        # Get the second to last field for duration
        duration_ms=$(echo "$line" | rev | cut -d' ' -f2 | rev)
        # Get the last field for category ID
        category_id=$(echo "$line" | rev | cut -d' ' -f1 | rev)
        
        # Format duration
        formatted_duration=$(format_duration $duration_ms)
        
        # Truncate name if too long
        if [ ${#name} -gt 8 ]; then
            name="${name:0:8}…"
        fi
        
        # Highlight the most recently active category
        if [ "$category_id" = "$most_recent_category_id" ] && [ -n "$most_recent_category_id" ]; then
            # Most recently active - use bright background and different color
            sketchybar --set "cronus.cat$counter" \
                       icon="$emoji" \
                       label="$name $formatted_duration" \
                       icon.color=0xffFFFFFF \
                       label.color=0xffFFFFFF \
                       background.color=0xff007AFF \
                       background.corner_radius=8 \
                       drawing=on
        else
            # Regular style for other categories
            sketchybar --set "cronus.cat$counter" \
                       icon="$emoji" \
                       label="$name $formatted_duration" \
                       icon.color=0xffFFFFFF \
                       label.color=0xffFFFFFF \
                       background.color=0x22000000 \
                       background.corner_radius=3 \
                       drawing=on
        fi
    else
        # Hide empty slots
        sketchybar --set "cronus.cat$counter" drawing=off
    fi
    
    counter=$((counter + 1))
done <<< "$categories"

# Hide any remaining unused category items
while [ $counter -le 6 ]; do
    sketchybar --set "cronus.cat$counter" drawing=off
    counter=$((counter + 1))
done
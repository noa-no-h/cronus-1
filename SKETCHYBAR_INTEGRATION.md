# SketchyBar Integration for Cronus

This integration sends `category.totalDurationMs` data from Cronus to SketchyBar, displaying your **top 6 categories** with time spent today in your macOS menu bar.

## What You'll See

```
📊 4h 25m (68%) | 💻 Work 2h 15m | 🎮 Break 45m | 📧 Email 20m | 📚 Learning 15m | 🤝 Meetings 10m | 💬 Social 5m
```

- **Main item**: Total time + productivity percentage (color-coded)
- **6 category items**: Top categories with emoji, name, and duration from `category.totalDurationMs`
- **Color coding**: Green (70%+ productive), Yellow (40-69%), Red (<40%)

## Complete Setup Guide

### Step 1: Install Prerequisites

```bash
# Install SketchyBar
brew tap FelixKratz/formulae
brew install sketchybar

# Install jq for JSON parsing
brew install jq
```

### Step 2: Make Plugin Executable

```bash
chmod +x "/Users/noa/cronus 2/sketchybar-cronus-plugin.sh"
```

### Step 3: Add to SketchyBar Configuration

Create or edit `~/.config/sketchybar/sketchybarrc` and add:

```bash
# Cronus Integration - Displays category.totalDurationMs data
# Main item showing total time and productivity
sketchybar --add item cronus.main right \
           --set cronus.main \
                 script="/Users/noa/cronus\ 2/sketchybar-cronus-plugin.sh" \
                 update_freq=30 \
                 label="Loading..." \
                 icon="📊" \
                 icon.color=0xffffffff \
                 label.color=0xffffffff \
                 background.color=0x44000000 \
                 background.corner_radius=5 \
                 background.height=24 \
                 padding_left=5 \
                 padding_right=5 \
                 click_script="open -a 'Cronus'"

# Category items (1-6) showing individual category.totalDurationMs values
for i in {1..6}; do
    sketchybar --add item "cronus.cat$i" right \
               --set "cronus.cat$i" \
                     script="/Users/noa/cronus\ 2/sketchybar-cronus-plugin.sh" \
                     update_freq=30 \
                     label="" \
                     icon="" \
                     label.color=0xffffffff \
                     icon.color=0xffffffff \
                     background.color=0x22000000 \
                     background.corner_radius=3 \
                     background.height=20 \
                     padding_left=3 \
                     padding_right=3 \
                     drawing=off
done
```

**Quick Setup Option:**
```bash
# Run the automated configuration
"/Users/noa/cronus 2/sketchybar-config.sh"
```

### Step 4: Start/Restart SketchyBar

```bash
brew services restart sketchybar
```

### Step 5: Start Cronus

Open the Cronus app. The integration will automatically export `category.totalDurationMs` data.

## How category.totalDurationMs Gets to SketchyBar

1. **Data Source**: In `ActivitiesByCategoryWidget.tsx`, the `processActivityEvents` function calculates `category.totalDurationMs` by summing activity durations within each category:
   ```typescript
   const totalCategoryDurationMs = activityItems.reduce((sum, act) => sum + act.durationMs, 0)
   ```

2. **Auto-Export**: When `processedData` changes, it automatically calls:
   ```typescript
   window.api.exportCategoriesForSketchybar(finalResult)
   ```

3. **IPC Handler**: The main process (`ipc.ts`) writes category data to `/tmp/cronus-category-data.json`:
   ```json
   {
     "timestamp": "2025-10-02T10:30:00.000Z", 
     "categories": [
       {
         "id": "work-category-id",
         "name": "Work",
         "color": "#22C55E",
         "emoji": "💻", 
         "isProductive": true,
         "totalDurationMs": 8100000,  // ← This is category.totalDurationMs
         "formattedDuration": "2h 15m"
       }
     ]
   }
   ```

4. **SketchyBar Plugin**: The bash script reads this file every 30 seconds and updates menu bar items with the `totalDurationMs` data.

## Verification & Testing

### Check if Integration is Working

1. **Verify plugin script exists**:
   ```bash
   ls -la "/Users/noa/cronus 2/sketchybar-cronus-plugin.sh"
   ```

2. **Check data file is created when Cronus runs**:
   ```bash
   ls -la /tmp/cronus-category-data.json
   ```

3. **View the exported category.totalDurationMs data**:
   ```bash
   cat /tmp/cronus-category-data.json | jq '.categories[] | {name, totalDurationMs, formattedDuration}'
   ```

4. **Test plugin manually**:
   ```bash
   "/Users/noa/cronus 2/sketchybar-cronus-plugin.sh"
   ```

### Sample Test Data

You can test with sample data:
```bash
cat > /tmp/cronus-category-data.json << 'EOF'
{
  "timestamp": "2025-10-02T10:30:00.000Z",
  "categories": [
    {"name": "Work", "emoji": "💻", "totalDurationMs": 8100000, "isProductive": true},
    {"name": "Break", "emoji": "🎮", "totalDurationMs": 2700000, "isProductive": false},
    {"name": "Email", "emoji": "📧", "totalDurationMs": 1200000, "isProductive": true}
  ]
}
EOF
```

## Customization

### Show More/Fewer Categories
Edit the loop in configuration:
```bash
# Show 8 categories instead of 6
for i in {1..8}; do
    # ... configuration
done
```

### Change Update Frequency
Modify `update_freq=30` (seconds) in the SketchyBar configuration.

### Adjust Display Format
Edit `sketchybar-cronus-plugin.sh` to change how `totalDurationMs` is displayed.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No data in menu bar | Start Cronus app and track some activities |
| "jq required" error | `brew install jq` |
| Items not showing | `brew services restart sketchybar` |
| Permission denied | `chmod +x "/Users/noa/cronus 2/sketchybar-cronus-plugin.sh"` |
| Stale data | Data refreshes every minute automatically |

## Files Overview

- **`sketchybar-cronus-plugin.sh`**: Reads `/tmp/cronus-category-data.json` and updates SketchyBar
- **`sketchybar-config.sh`**: SketchyBar configuration script  
- **`ActivitiesByCategoryWidget.tsx`**: Exports `category.totalDurationMs` data
- **`ipc.ts`**: IPC handler that writes JSON file
- **`/tmp/cronus-category-data.json`**: Data file containing `totalDurationMs` values

The integration automatically syncs your `category.totalDurationMs` data to SketchyBar every time the categories change, plus every minute as a backup sync! 🎉
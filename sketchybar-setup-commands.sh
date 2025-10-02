#!/bin/bash

# SketchyBar Configuration for Cronus Integration
# Copy these commands to ~/.config/sketchybar/sketchybarrc

echo "Adding Cronus integration to SketchyBar..."

# Main item showing total time and productivity percentage
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

# Individual category items (1-6) showing category.totalDurationMs data
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

echo ""
echo "✅ SketchyBar Cronus integration configured!"
echo ""
echo "📊 This will display your top 6 categories with time spent today"
echo "🎯 Data comes from category.totalDurationMs in your Cronus app"
echo "🔄 Updates every 30 seconds automatically"
echo "🎨 Color-coded productivity: Green ≥70%, Yellow 40-69%, Red <40%"
echo ""
echo "🚀 Next steps:"
echo "   1. Restart SketchyBar: brew services restart sketchybar"
echo "   2. Open Cronus app to start tracking activities"
echo "   3. Check /tmp/cronus-category-data.json for exported data"
echo ""
echo "Example display: 📊 4h 25m (68%) | 💻 Work 2h 15m | 🎮 Break 45m | 📧 Email 20m"
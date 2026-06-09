#!/bin/bash

# Generate PNG icons from SVG for PWA
# Run this script from the frontend/public directory

echo "🎨 Generating PNG icons from SVG..."

# Check if ImageMagick is installed
if command -v convert &> /dev/null; then
    echo "✓ ImageMagick found, generating icons..."

    # Generate icons
    convert icon.svg -resize 192x192 icon-192.png
    convert icon.svg -resize 512x512 icon-512.png
    convert icon.svg -resize 180x180 apple-touch-icon.png

    echo "✅ Icons generated successfully!"
    echo "  - icon-192.png (192x192)"
    echo "  - icon-512.png (512x512)"
    echo "  - apple-touch-icon.png (180x180)"

elif command -v brew &> /dev/null; then
    echo "❌ ImageMagick not found"
    echo ""
    echo "Install with: brew install imagemagick"
    echo "Then run this script again"
    exit 1

else
    echo "❌ ImageMagick not found"
    echo ""
    echo "📝 Manual options:"
    echo ""
    echo "Option 1: Install ImageMagick"
    echo "  macOS: brew install imagemagick"
    echo "  Linux: apt-get install imagemagick"
    echo "  Windows: choco install imagemagick"
    echo ""
    echo "Option 2: Use online tool"
    echo "  Visit: https://realfavicongenerator.net/"
    echo "  Upload: icon.svg"
    echo "  Download: Generated icons"
    echo "  Place them in this directory (frontend/public/)"
    echo ""
    echo "Option 3: Use design tool (Figma/Sketch)"
    echo "  1. Open icon.svg in your design tool"
    echo "  2. Export as PNG:"
    echo "     - 192x192px → icon-192.png"
    echo "     - 512x512px → icon-512.png"
    echo "     - 180x180px → apple-touch-icon.png"
    echo "  3. Save to frontend/public/"
    echo ""
    exit 1
fi

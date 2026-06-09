# Generate PNG Icons for PWA

The manifest references PNG icons that need to be generated from `icon.svg`.

## Required Icons:

1. **icon-192.png** (192x192) - Android/Chrome
2. **icon-512.png** (512x512) - Android/Chrome  
3. **apple-touch-icon.png** (180x180) - iOS

## How to Generate:

### Option 1: Online Tool (Fastest)
1. Go to https://realfavicongenerator.net/
2. Upload `icon.svg`
3. Generate all sizes
4. Download and place in `frontend/public/`

### Option 2: ImageMagick (Command Line)
```bash
cd frontend/public

# Install ImageMagick if needed:
# brew install imagemagick (macOS)
# apt-get install imagemagick (Linux)

# Convert SVG to PNGs:
convert icon.svg -resize 192x192 icon-192.png
convert icon.svg -resize 512x512 icon-512.png
convert icon.svg -resize 180x180 apple-touch-icon.png
```

### Option 3: Figma/Design Tool
1. Open icon.svg in Figma/Sketch/etc
2. Export as PNG at:
   - 192x192px → icon-192.png
   - 512x512px → icon-512.png
   - 180x180px → apple-touch-icon.png
3. Save to `frontend/public/`

## Temporary Fallback

The app will work without PNG icons - the SVG icon is already configured as fallback. PNG icons just improve compatibility with older devices and iOS.

## Screenshots (Optional)

For app store-like installation:
- screenshot-wide.png (1280x720) - Desktop preview
- screenshot-narrow.png (750x1334) - Mobile preview

Take screenshots of the app and save with these names for enhanced PWA install experience.

# PWA Icons Directory

This directory contains optimized PWA icons in various sizes.

## Icon Sizes Required

- **72x72** - Small Android icon
- **96x96** - Medium Android icon
- **128x128** - Large Android icon
- **144x144** - Microsoft tile
- **152x152** - iPad icon
- **192x192** - Standard PWA icon (required)
- **384x384** - Large PWA icon
- **512x512** - Largest PWA icon (required)

## How to Generate Icons

1. Use your base logo (logo2.png) as source
2. Use an online tool like:
   - https://www.pwabuilder.com/imageGenerator
   - https://realfavicongenerator.net/
   - https://favicon.io/

3. Or use the sharp npm package:
   ```bash
   npm install sharp-cli -g
   sharp -i ../logo2.png -o icon-72x72.png resize 72 72
   sharp -i ../logo2.png -o icon-96x96.png resize 96 96
   sharp -i ../logo2.png -o icon-128x128.png resize 128 128
   sharp -i ../logo2.png -o icon-144x144.png resize 144 144
   sharp -i ../logo2.png -o icon-152x152.png resize 152 152
   sharp -i ../logo2.png -o icon-192x192.png resize 192 192
   sharp -i ../logo2.png -o icon-384x384.png resize 384 384
   sharp -i ../logo2.png -o icon-512x512.png resize 512 512
   ```

## Current Status

For now, the manifest.json uses logo2.png for all sizes.
You should generate properly sized icons and update manifest.json accordingly.

const fs = require("fs");
const path = require("path");

// Create simple SVG icons as placeholders for PWA
const createSVGIcon = (size) => {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#f59e0b"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 3}" fill="white"/>
    <text x="${size / 2}" y="${size / 2 + 6}" font-family="Arial" font-size="${
    size / 8
  }" text-anchor="middle" fill="#f59e0b" font-weight="bold">CD</text>
  </svg>`;
};

// Required PWA icon sizes
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, "public", "icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log("Creating PWA icons...");

iconSizes.forEach((size) => {
  const svgContent = createSVGIcon(size);
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);

  // For now, create SVG files that browsers can use
  const svgFilename = `icon-${size}x${size}.svg`;
  const svgFilepath = path.join(iconsDir, svgFilename);

  fs.writeFileSync(svgFilepath, svgContent);
  console.log(`Created ${svgFilename}`);
});

// Create favicon.ico placeholder
const faviconSVG = createSVGIcon(32);
fs.writeFileSync(path.join(__dirname, "public", "favicon.svg"), faviconSVG);

console.log("PWA icons created successfully!");
console.log(
  "Note: For production, convert SVG icons to PNG format for better browser support."
);

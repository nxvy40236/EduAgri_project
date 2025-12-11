const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const svgPath = path.join(__dirname, 'eduagri-architecture-flowchart.svg');
  const outPath = path.join(__dirname, 'eduagri-architecture-flowchart.jpg');

  if (!fs.existsSync(svgPath)) {
    console.error('SVG file not found:', svgPath);
    process.exit(1);
  }

  const svgContent = fs.readFileSync(svgPath, 'utf8');
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;">${svgContent}</body></html>`;

  // Launch puppeteer
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  // Set viewport to the svg's width/height (matching the SVG viewBox if present)
  const width = 1200;
  const height = 800;
  await page.setViewport({ width, height });

  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Wait a moment for fonts/styles to apply
  await page.waitForTimeout(300);

  await page.screenshot({ path: outPath, type: 'jpeg', quality: 90, clip: { x: 0, y: 0, width, height } });
  await browser.close();
  console.log('Saved JPG to', outPath);
})();

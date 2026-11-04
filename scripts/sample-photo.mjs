// Draws the stand-in "photo" used in the style guide's image examples and
// saves it at four widths, as JPEG and WebP, in assets/img/photos/.
//
// The kit has no real photos (the college is fictional), so this script
// paints a landscape in a browser canvas: the Sleeping Giant ridge above a
// lake at sunset. The files are committed, so nobody needs to run this
// unless they want to change the picture: npm run sample-photo
//
// Files made from a canvas carry no camera or location data.

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const OUT = "assets/img/photos";
const NAME = "giant-from-willow-lake";
const WIDTHS = [480, 960, 1440]; // 3:2, so heights are 320, 640 and 960
const QUALITY = 0.72;

const browser = await chromium.launch();
const page = await browser.newPage();
const files = await page.evaluate(({ widths, quality }) => {
  const W = 1920;
  const H = 1280;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");

  // A repeatable random sequence, so the picture is the same every run
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  const horizon = H * 0.62; // the lake's far shore

  // Sky: deep blue at the top to a warm glow behind the ridge
  const sky = g.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#1d2b4a");
  sky.addColorStop(0.45, "#4f5f8f");
  sky.addColorStop(0.75, "#c9877a");
  sky.addColorStop(1, "#f2c38b");
  g.fillStyle = sky;
  g.fillRect(0, 0, W, horizon);

  // The setting sun's glow, low on the right
  const sun = g.createRadialGradient(W * 0.74, horizon - 40, 10, W * 0.74, horizon - 40, 520);
  sun.addColorStop(0, "rgba(255, 236, 190, 0.95)");
  sun.addColorStop(0.15, "rgba(255, 205, 140, 0.55)");
  sun.addColorStop(1, "rgba(255, 180, 120, 0)");
  g.fillStyle = sun;
  g.fillRect(0, 0, W, horizon);

  // Thin clouds
  for (let i = 0; i < 18; i += 1) {
    const y = 80 + rand() * horizon * 0.55;
    const x = rand() * W;
    const w = 200 + rand() * 500;
    const cloud = g.createLinearGradient(x - w, 0, x + w, 0);
    cloud.addColorStop(0, "rgba(255, 210, 190, 0)");
    cloud.addColorStop(0.5, `rgba(255, 210, 190, ${0.08 + rand() * 0.18})`);
    cloud.addColorStop(1, "rgba(255, 210, 190, 0)");
    g.fillStyle = cloud;
    g.beginPath();
    g.ellipse(x, y, w, 6 + rand() * 14, 0, 0, Math.PI * 2);
    g.fill();
  }

  // A ridge from a list of [x, height] points, smoothed, with small noise
  function ridge(points, base, color, roughness) {
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(0, base);
    const path = [];
    for (let x = 0; x <= W; x += 4) {
      let i = 0;
      while (i < points.length - 2 && points[i + 1][0] < x / W) i += 1;
      const [x0, h0] = points[i];
      const [x1, h1] = points[i + 1];
      const t = Math.min(1, Math.max(0, (x / W - x0) / (x1 - x0)));
      const s = t * t * (3 - 2 * t);
      const h = h0 + (h1 - h0) * s;
      path.push([x, base - h * H - (rand() - 0.5) * roughness]);
    }
    path.forEach(([x, y]) => g.lineTo(x, y));
    g.lineTo(W, base);
    g.closePath();
    g.fill();
  }

  // Far hills, pale with distance
  ridge([[0, 0.12], [0.2, 0.16], [0.45, 0.1], [0.7, 0.15], [1, 0.11]], horizon, "#9d8fa6", 3);
  ridge([[0, 0.07], [0.3, 0.1], [0.55, 0.06], [0.85, 0.12], [1, 0.08]], horizon, "#7c7590", 4);

  // The Sleeping Giant: head on the left, then chin, chest, folded hands, knees and feet
  ridge([
    [0, 0.04], [0.08, 0.08], [0.13, 0.15], [0.17, 0.17], [0.195, 0.215], [0.21, 0.17],
    [0.235, 0.155], [0.26, 0.135], [0.3, 0.17], [0.38, 0.185], [0.46, 0.18], [0.5, 0.205],
    [0.54, 0.18], [0.6, 0.19], [0.68, 0.25], [0.74, 0.23], [0.8, 0.15], [0.84, 0.17],
    [0.9, 0.08], [1, 0.05],
  ], horizon, "#2f3e4c", 5);

  // Treeline along the far shore
  g.fillStyle = "#1d2a2c";
  for (let x = 0; x < W; x += 5 + rand() * 6) {
    const h = 14 + rand() * 30;
    g.beginPath();
    g.moveTo(x - 6, horizon + 2);
    g.lineTo(x, horizon - h);
    g.lineTo(x + 6, horizon + 2);
    g.fill();
  }

  // Lake: the sky flipped and darkened, then ripples
  g.save();
  g.translate(0, horizon * 2);
  g.scale(1, -1);
  g.globalAlpha = 0.75;
  g.drawImage(c, 0, 0, W, horizon, 0, 0, W, horizon);
  g.restore();
  const water = g.createLinearGradient(0, horizon, 0, H);
  water.addColorStop(0, "rgba(20, 30, 50, 0.25)");
  water.addColorStop(1, "rgba(10, 18, 30, 0.85)");
  g.fillStyle = water;
  g.fillRect(0, horizon, W, H - horizon);
  for (let i = 0; i < 900; i += 1) {
    const y = horizon + 4 + Math.pow(rand(), 1.6) * (H - horizon);
    const x = rand() * W;
    const near = (y - horizon) / (H - horizon);
    const glint = Math.abs(x - W * 0.74) < 160 + near * 260;
    g.strokeStyle = glint ? `rgba(255, 220, 170, ${0.25 + rand() * 0.4})` : `rgba(200, 210, 230, ${0.04 + rand() * 0.08})`;
    g.lineWidth = 1 + near * 2;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 20 + near * 120 * rand(), y);
    g.stroke();
  }

  // Near shore with a few spruce trees on the left
  g.fillStyle = "#0f1716";
  g.beginPath();
  g.moveTo(0, H);
  g.lineTo(0, H * 0.86);
  g.quadraticCurveTo(W * 0.18, H * 0.84, W * 0.34, H * 0.93);
  g.quadraticCurveTo(W * 0.42, H * 0.97, W * 0.5, H);
  g.fill();
  for (const [x, h] of [[90, 330], [190, 250], [260, 380], [370, 210]]) {
    const base = H * 0.88;
    for (let tier = 0; tier < 9; tier += 1) {
      const y = base - (tier / 9) * h;
      const w = (1 - tier / 9) * h * 0.22 + 6;
      g.beginPath();
      g.moveTo(x - w, y);
      g.lineTo(x, y - h / 6);
      g.lineTo(x + w, y);
      g.fill();
    }
  }

  // Film grain, so it compresses like a photo rather than a flat drawing
  const img = g.getImageData(0, 0, W, H);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rand() - 0.5) * 14;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);

  // Each width, scaled down from the full picture
  const out = [];
  for (const w of widths) {
    const h = Math.round((w * H) / W);
    const s = document.createElement("canvas");
    s.width = w;
    s.height = h;
    const sg = s.getContext("2d");
    sg.imageSmoothingQuality = "high";
    sg.drawImage(c, 0, 0, w, h);
    out.push({ w, type: "jpg", data: s.toDataURL("image/jpeg", quality) });
    out.push({ w, type: "webp", data: s.toDataURL("image/webp", quality) });
  }
  return out;
}, { widths: WIDTHS, quality: QUALITY });

await browser.close();
await mkdir(OUT, { recursive: true });
for (const { w, type, data } of files) {
  const bytes = Buffer.from(data.split(",")[1], "base64");
  const file = `${OUT}/${NAME}-${w}.${type}`;
  await writeFile(file, bytes);
  console.log(`${file}: ${Math.round(bytes.length / 1024)} KB`);
}

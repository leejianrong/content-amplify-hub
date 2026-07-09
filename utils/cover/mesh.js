// Deterministic mesh-gradient cover generator.
//
// Produces a soft, blurred, swirling gradient as an SVG string, seeded from the
// article title so a given post always yields the same cover. This is the same
// algorithm prototyped in the cover-generator playground.

const W = 1600;
const H = 840;

// Soft field tints + one or two saturated accents, per palette.
export const PALETTES = {
  Azure: { base: "#dce9f7", colors: ["#cfe0f5", "#a9c9ef", "#7fb0e8", "#2f78d6", "#1552b0"] },
  Rose: { base: "#f6e2e6", colors: ["#f4d2da", "#e6a9bd", "#e58aa0", "#d76b86", "#b23a63"] },
  Seafoam: { base: "#dcefe6", colors: ["#cfeadd", "#a9dcc6", "#7fd0c4", "#3aa79a", "#2e8f6f"] },
  Violet: { base: "#e7e1f6", colors: ["#ddd3f2", "#c1aee8", "#a888e0", "#7b52d6", "#5a2fb0"] },
  Amber: { base: "#f6ecd9", colors: ["#f4e2c2", "#efcf92", "#eab35a", "#e08a2f", "#c96814"] },
  Slate: { base: "#e2e6ee", colors: ["#d5dbe6", "#b3bccb", "#8b98ac", "#5c6b83", "#38455c"] },
};

const hashSeed = (str) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const mulberry32 = (a) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const paletteForTitle = (title) => {
  const names = Object.keys(PALETTES);
  return names[hashSeed(title) % names.length];
};

export const meshSVG = (title, opts = {}) => {
  const {
    blobs = 4, // number of sweeping ribbons
    blur = 75, // Gaussian blur std deviation ("softness")
    grain = true, // faint film grain to avoid banding
    palette = paletteForTitle(title),
    seedNonce = 0,
  } = opts;

  const pal = PALETTES[palette] ?? PALETTES[paletteForTitle(title)];
  const R = mulberry32(hashSeed(title) ^ (seedNonce * 0x9e3779b1));
  const fid = "b" + (hashSeed(title + palette + seedNonce) % 100000);
  const M = Math.max(W, H);
  // One dominant direction so the whole frame reads as a single sweep.
  const baseAngle = R() * Math.PI * 2;

  const curve = (cx, cy, ang, len, bend, color, sw, op) => {
    const sx = Math.round(cx - (Math.cos(ang) * len) / 2);
    const sy = Math.round(cy - (Math.sin(ang) * len) / 2);
    const ex = Math.round(cx + (Math.cos(ang) * len) / 2);
    const ey = Math.round(cy + (Math.sin(ang) * len) / 2);
    const perp = ang + Math.PI / 2;
    const mx = Math.round((sx + ex) / 2 + Math.cos(perp) * bend);
    const my = Math.round((sy + ey) / 2 + Math.sin(perp) * bend);
    return `<path d="M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}" fill="none" stroke="${color}" stroke-width="${Math.round(sw)}" stroke-linecap="round" stroke-opacity="${op}"/>`;
  };

  let shapes = "";

  // 1) Color ground — a couple of broad, soft fields.
  for (let i = 0; i < 2; i++) {
    const cx = Math.round(R() * W);
    const cy = Math.round(R() * H);
    const rx = Math.round((0.7 + R() * 0.6) * M);
    const ry = Math.round(rx * (0.7 + R() * 0.5));
    const ci = Math.floor(Math.pow(R(), 1.7) * (pal.colors.length - 1));
    shapes += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${pal.colors[ci]}" fill-opacity="0.9"/>`;
  }

  // 2) Sweeping ribbons — long curved strokes clustered around baseAngle.
  for (let i = 0; i < blobs; i++) {
    const ang = baseAngle + (R() - 0.5) * 1.0;
    const jx = (R() - 0.5) * W * 0.7;
    const jy = (R() - 0.5) * H * 0.7;
    const ci = 1 + Math.floor(R() * (pal.colors.length - 1));
    shapes += curve(
      W / 2 + jx, H / 2 + jy, ang, M * 1.6,
      (R() - 0.5) * M * 1.1, pal.colors[ci],
      (0.28 + R() * 0.5) * H, (0.5 + R() * 0.4).toFixed(2)
    );
  }

  // 3) Highlights — a saturated core and a luminous light streak, each a
  //    ribbon of one color glowing inside the fields around it.
  const hi = [pal.colors[pal.colors.length - 1], pal.colors[0]];
  for (let i = 0; i < 2; i++) {
    const ang = baseAngle + (R() - 0.5) * 0.7;
    shapes += curve(
      W * (0.3 + R() * 0.4), H * (0.3 + R() * 0.4), ang,
      M * (0.8 + R() * 0.5), (R() - 0.5) * M * 0.6, hi[i],
      (0.12 + R() * 0.18) * H,
      (i === 0 ? 0.55 + R() * 0.3 : 0.4 + R() * 0.3).toFixed(2)
    );
  }

  const grainLayer = grain
    ? `<filter id="g${fid}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="${W}" height="${H}" filter="url(#g${fid})" opacity="0.05"/>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs><filter id="${fid}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${blur}"/></filter></defs><rect width="${W}" height="${H}" fill="${pal.base}"/><g filter="url(#${fid})">${shapes}</g>${grainLayer}</svg>`;
};

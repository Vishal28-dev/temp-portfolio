/**
 * The eight stops of the descent. Each stratum owns its ground colour,
 * ink colour and the swarm formation that belongs to it — one source of
 * truth shared by the CSS variables and the WebGL clear colour.
 */
export const STRATA = [
  {
    id: 'ingress',
    code: '—',
    name: 'Ingress',
    depth: 0,
    formation: 0,
    ground: '#080b0e', ink: '#ede9df', inkDim: '#7f8c90', accent: '#e8632a',
    rule: 'rgba(237,233,223,0.14)',
  },
  {
    id: 'l01',
    code: 'L01',
    name: 'Interface',
    depth: 40,
    formation: 1,
    ground: '#ede9df', ink: '#12171c', inkDim: '#5e6a6b', accent: '#b8480f',
    rule: 'rgba(18,23,28,0.16)',
  },
  {
    id: 'l02',
    code: 'L02',
    name: 'Motion',
    depth: 80,
    formation: 2,
    ground: '#d7d2c6', ink: '#12171c', inkDim: '#5a6566', accent: '#a8400c',
    rule: 'rgba(18,23,28,0.18)',
  },
  {
    id: 'l03',
    code: 'L03',
    name: 'Service',
    depth: 120,
    formation: 3,
    ground: '#c2c5bb', ink: '#0f1418', inkDim: '#3e4a4c', accent: '#8e3608',
    rule: 'rgba(15,20,24,0.22)',
  },
  {
    id: 'l04',
    code: 'L04',
    name: 'Data',
    depth: 168,
    formation: 4,
    ground: '#2e3f45', ink: '#ede9df', inkDim: '#b4bdbb', accent: '#f2c14e',
    rule: 'rgba(237,233,223,0.20)',
  },
  {
    id: 'l05',
    code: 'L05',
    name: 'Runtime',
    depth: 208,
    formation: 5,
    ground: '#243138', ink: '#ede9df', inkDim: '#93a0a2', accent: '#f2a04e',
    rule: 'rgba(237,233,223,0.16)',
  },
  {
    id: 'l06',
    code: 'L06',
    name: 'Delivery',
    depth: 240,
    formation: 6,
    ground: '#131c22', ink: '#dcd8ce', inkDim: '#7f8c90', accent: '#e8632a',
    rule: 'rgba(220,216,206,0.14)',
  },
  {
    id: 'core',
    code: '∎',
    name: 'The Core',
    depth: 260,
    formation: 7,
    ground: '#080b0e', ink: '#dcd8ce', inkDim: '#6e7a7e', accent: '#e8632a',
    rule: 'rgba(220,216,206,0.13)',
  },
];

export const LAYER_STRATA = STRATA.filter((s) => s.code.startsWith('L'));

const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const rgbToCss = ([r, g, b]) => `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`;

const mixRgb = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

/**
 * The ground interpolates continuously, but ink must NOT: between a pale
 * stratum (dark ink) and a dark one (light ink) a linear blend drives both
 * toward grey at the same moment, and contrast collapses mid-scroll.
 * Ink polarity is therefore chosen from the interpolated ground's luminance,
 * so text is always at full contrast against whatever is behind it.
 */
// Secondary text is what the strata copy is set in, so "dim" still has to
// clear 4.5:1 against every ground it can sit on — including the mid strata.
const INK_ON_LIGHT = {
  ink: 'rgb(18 23 28)',
  inkDim: 'rgb(58 68 70)',
  rule: 'rgba(18, 23, 28, 0.20)',
  accent: 'rgb(130 44 4)',
};

const INK_ON_DARK = {
  ink: 'rgb(237 233 223)',
  inkDim: 'rgb(178 186 180)',
  rule: 'rgba(237, 233, 223, 0.18)',
  accent: 'rgb(255 138 92)',
};

const luminance = ([r, g, b]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

// Hold, cross, hold. The colour change is confined to a narrow band centred
// on the boundary between two sections — which is padding, not text — so
// content is always read against a settled ground rather than a mid-grey.
const BAND_START = 0.38;
const BAND_END = 0.62;
const ease = (t) => {
  const k = Math.max(0, Math.min((t - BAND_START) / (BAND_END - BAND_START), 1));
  return k * k * k * (k * (k * 6 - 15) + 10);
};

export function paletteAt(index) {
  const clamped = Math.max(0, Math.min(index, STRATA.length - 1));
  const i = Math.floor(clamped);
  const t = clamped - i;
  const a = STRATA[i];
  const b = STRATA[Math.min(i + 1, STRATA.length - 1)];

  const groundRgb = mixRgb(hexToRgb(a.ground), hexToRgb(b.ground), ease(t));
  const set = luminance(groundRgb) > 0.5 ? INK_ON_LIGHT : INK_ON_DARK;

  return { groundRgb, ground: rgbToCss(groundRgb), ...set };
}

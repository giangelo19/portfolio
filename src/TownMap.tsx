import { useEffect, useRef, useState } from "react";

/*
  A walkable top-down pixel town. Each building is a section of the page: walk
  into its door (or click it) and the page scrolls there.

  All art is drawn in code with fillRect on a 16px tile grid, so there are no
  image assets. The static ground is pre-rendered into two offscreen layers (the
  water and flowers have a two-frame idle), and each frame only blits a layer
  and draws the player on top.
*/

// ─── Grid ────────────────────────────────────────────────────────────────────

const TILE = 16;
const COLS = 32;
const ROWS = 22;
const MAP_W = COLS * TILE;
const MAP_H = ROWS * TILE;

/** Milliseconds to walk one tile. */
const STEP_MS = 150;

type Tile = "grass" | "tall" | "flower" | "path" | "water" | "tree" | "fence" | "sign";
type Dir = "up" | "down" | "left" | "right";

interface Point {
  x: number;
  y: number;
}

const DIRS: Dir[] = ["up", "down", "left", "right"];
const DX: Record<Dir, number> = { up: 0, down: 0, left: -1, right: 1 };
const DY: Record<Dir, number> = { up: -1, down: 1, left: 0, right: 0 };

const KEY_DIR: Record<string, Dir> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
  W: "up",
  S: "down",
  A: "left",
  D: "right",
};

const ACTION_KEYS = new Set([" ", "Enter", "z", "Z"]);

const SOLID = new Set<Tile>(["tree", "water", "fence", "sign"]);

// ─── Town data ───────────────────────────────────────────────────────────────

// `section` is the id of the page section the door leads to. The door is always
// the bottom-centre tile of the footprint.
interface Building {
  section: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  roof: string;
}

const BUILDINGS: Building[] = [
  { section: "about", name: "Gian's House", x: 3, y: 3, w: 5, h: 4, roof: "#d65a4f" },
  { section: "experience", name: "Work Office", x: 12, y: 3, w: 6, h: 4, roof: "#4c7fd6" },
  { section: "education", name: "Academy", x: 23, y: 2, w: 6, h: 5, roof: "#8b62c9" },
  { section: "projects", name: "Project Lab", x: 4, y: 12, w: 7, h: 5, roof: "#2bb3a3" },
  { section: "skills", name: "Skill Dojo", x: 14, y: 13, w: 5, h: 4, roof: "#e08a35" },
  { section: "contact", name: "Post Office", x: 23, y: 13, w: 5, h: 4, roof: "#c94d72" },
];

const SIGNS: (Point & { text: string })[] = [
  {
    x: 13,
    y: 11,
    text: "GIAN TOWN. Population: one developer. Walk into any door to open that part of the portfolio.",
  },
  {
    x: 20,
    y: 11,
    text: "Tip: use the arrow keys or WASD to walk, or tap a spot to walk there. Space reads signs.",
  },
  {
    x: 10,
    y: 18,
    text: "Deep pond. Hard to see the bottom. MantaNet, Gian's thesis, is built to see through water like this.",
  },
];

const doorOf = (b: Building): Point => ({ x: b.x + Math.floor(b.w / 2), y: b.y + b.h - 1 });

function buildMap(): Tile[][] {
  const m: Tile[][] = Array.from({ length: ROWS }, () => Array<Tile>(COLS).fill("grass"));
  const rect = (t: Tile, x0: number, y0: number, x1: number, y1: number) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) m[y][x] = t;
  };

  // Tree border.
  rect("tree", 0, 0, COLS - 1, 0);
  rect("tree", 0, ROWS - 1, COLS - 1, ROWS - 1);
  rect("tree", 0, 0, 0, ROWS - 1);
  rect("tree", COLS - 1, 0, COLS - 1, ROWS - 1);

  // Main road, the lower street, and the two lanes between them.
  rect("path", 1, 9, 30, 10);
  rect("path", 5, 17, 27, 17);
  rect("path", 12, 11, 12, 16);
  rect("path", 21, 11, 21, 16);

  // Front paths from the upper doors down to the road.
  rect("path", 5, 7, 5, 8);
  rect("path", 15, 7, 15, 8);
  rect("path", 26, 7, 26, 8);

  // Groves.
  rect("tree", 9, 4, 10, 5);
  rect("tree", 20, 3, 20, 4);
  rect("tree", 21, 3, 21, 3);
  rect("tree", 1, 12, 2, 15);
  rect("tree", 28, 11, 29, 11);

  // Pond, tall grass, gardens.
  rect("water", 2, 18, 9, 20);
  rect("fence", 1, 17, 4, 17);
  rect("tall", 13, 18, 20, 20);
  rect("tall", 29, 13, 30, 16);
  rect("flower", 23, 18, 28, 20);
  rect("flower", 3, 7, 4, 7);
  rect("flower", 6, 7, 7, 7);
  rect("flower", 18, 7, 20, 7);

  for (const s of SIGNS) m[s.y][s.x] = "sign";
  // The door tile sits on path so the path below it has no edge line.
  for (const b of BUILDINGS) {
    const d = doorOf(b);
    m[d.y][d.x] = "path";
  }

  return m;
}

const MAP = buildMap();

/** Building index per tile, or -1. */
const OCC: number[][] = (() => {
  const occ = Array.from({ length: ROWS }, () => Array<number>(COLS).fill(-1));
  BUILDINGS.forEach((b, i) => {
    for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) occ[y][x] = i;
  });
  return occ;
})();

const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < COLS && y < ROWS;
const tileAt = (x: number, y: number): Tile => (inBounds(x, y) ? MAP[y][x] : "tree");

const doorBuildingAt = (x: number, y: number) =>
  BUILDINGS.find((b) => {
    const d = doorOf(b);
    return d.x === x && d.y === y;
  });

const walkable = (x: number, y: number) =>
  inBounds(x, y) && OCC[y][x] === -1 && !SOLID.has(MAP[y][x]);

/** Doors can only be entered walking up into them. */
const passable = (x: number, y: number, dir: Dir) =>
  walkable(x, y) || (dir === "up" && doorBuildingAt(x, y) !== undefined);

/** Shortest walkable route from `start` to the first tile matching `isGoal`, excluding `start`. */
function findRoute(start: Point, isGoal: (x: number, y: number) => boolean): Point[] | null {
  if (isGoal(start.x, start.y)) return [];
  const key = (x: number, y: number) => y * COLS + x;
  const startKey = key(start.x, start.y);
  const prev = new Map<number, number>([[startKey, -1]]);
  const queue = [startKey];

  for (let i = 0; i < queue.length; i++) {
    const k = queue[i];
    const x = k % COLS;
    const y = (k - x) / COLS;
    for (const d of DIRS) {
      const nx = x + DX[d];
      const ny = y + DY[d];
      if (!walkable(nx, ny)) continue;
      const nk = key(nx, ny);
      if (prev.has(nk)) continue;
      prev.set(nk, k);
      if (isGoal(nx, ny)) {
        const route: Point[] = [];
        for (let c = nk; c !== startKey; c = prev.get(c)!) {
          route.push({ x: c % COLS, y: Math.floor(c / COLS) });
        }
        return route.reverse();
      }
      queue.push(nk);
    }
  }
  return null;
}

const dirToward = (from: Point, to: Point): Dir | null => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) + Math.abs(dy) !== 1) return null;
  if (dx === 1) return "right";
  if (dx === -1) return "left";
  return dy === 1 ? "down" : "up";
};

// ─── Palette ─────────────────────────────────────────────────────────────────

const C = {
  grass: "#86c95c",
  grassDark: "#5ea845",
  grassLight: "#a8dc7c",
  tall: "#4f9e3f",
  tallMid: "#3d8634",
  tallLight: "#7cc457",
  tallDark: "#2f6d29",
  path: "#e6cf96",
  pathDark: "#cdb276",
  pathLight: "#f3e3b8",
  pathEdge: "#c9ab6c",
  water: "#4c9fe0",
  waterDeep: "#3f8bd0",
  waterLight: "#a9dcf8",
  foam: "#e4f5ff",
  trunk: "#7b4b2a",
  trunkDark: "#5a341c",
  leafOut: "#22552a",
  leaf: "#3f8f3f",
  leafDark: "#2f7333",
  leafLight: "#67b657",
  shadow: "rgba(20, 40, 20, 0.28)",
  fence: "#c99556",
  fenceDark: "#8a5d2e",
  fenceLight: "#e3b678",
  signBoard: "#c48c4c",
  signLine: "#8a5d2e",
  flowers: ["#e8505b", "#f6f2ea", "#f2c84b", "#e47ab8"],
  flowerCenter: "#f29d38",
  wall: "#f3eee2",
  wallShade: "#ddd4c1",
  wallBase: "#c9bea6",
  outline: "#3a302c",
  windowFrame: "#5e4f45",
  glass: "#9ed6f0",
  glassLight: "#dcf2fb",
  door: "#7a4a2a",
  doorDark: "#5a341c",
  knob: "#f2c84b",
};

function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + amount * 255)));
  const r = ch(n >> 16);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/** Deterministic per-tile noise, so tufts and pebbles are the same every load. */
function hash(x: number, y: number, k: number) {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(k + 1, -2047144777);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (n ^ (n >>> 16)) >>> 0;
}

// ─── Tile art ────────────────────────────────────────────────────────────────

type Ctx = CanvasRenderingContext2D;

const px = (ctx: Ctx, color: string, x: number, y: number, w: number, h: number) => {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
};

function drawGrass(ctx: Ctx, x: number, y: number, tx: number, ty: number) {
  px(ctx, C.grass, x, y, TILE, TILE);
  for (let k = 0; k < 3; k++) {
    const h = hash(tx, ty, k);
    if (h % 3 === 0) continue;
    const gx = x + 1 + ((h >>> 3) % 12);
    const gy = y + 2 + ((h >>> 8) % 11);
    px(ctx, C.grassDark, gx, gy, 1, 2);
    px(ctx, C.grassDark, gx + 2, gy, 1, 2);
    px(ctx, C.grassDark, gx + 1, gy + 1, 1, 1);
  }
  const h = hash(tx, ty, 9);
  if (h % 4 === 0) px(ctx, C.grassLight, x + 1 + ((h >>> 4) % 14), y + 1 + ((h >>> 9) % 14), 1, 1);
}

function drawTall(ctx: Ctx, x: number, y: number, sway: number) {
  px(ctx, C.tall, x, y, TILE, TILE);
  for (const oy of [1, 9]) {
    for (const ox of [0, 4, 8, 12]) {
      const cx = x + ox;
      const cy = y + oy;
      px(ctx, C.tallDark, cx, cy + 5, 4, 2);
      px(ctx, C.tallMid, cx + 2, cy + 2, 1, 4);
      px(ctx, C.tallLight, cx + sway, cy + 2, 1, 4);
      px(ctx, C.tallLight, cx + 1 + sway, cy, 1, 6);
      px(ctx, C.tallLight, cx + 3, cy + 1, 1, 5);
    }
  }
}

function drawPath(ctx: Ctx, x: number, y: number, tx: number, ty: number) {
  px(ctx, C.path, x, y, TILE, TILE);
  for (let k = 0; k < 3; k++) {
    const h = hash(tx, ty, k + 30);
    const color = h % 2 ? C.pathDark : C.pathLight;
    px(ctx, color, x + 1 + ((h >>> 2) % 13), y + 1 + ((h >>> 7) % 14), 2, 1);
  }
  const isPath = (nx: number, ny: number) => tileAt(nx, ny) === "path";
  if (!isPath(tx, ty - 1)) px(ctx, C.pathEdge, x, y, TILE, 1);
  if (!isPath(tx, ty + 1)) px(ctx, C.pathEdge, x, y + TILE - 1, TILE, 1);
  if (!isPath(tx - 1, ty)) px(ctx, C.pathEdge, x, y, 1, TILE);
  if (!isPath(tx + 1, ty)) px(ctx, C.pathEdge, x + TILE - 1, y, 1, TILE);
}

function drawWater(ctx: Ctx, x: number, y: number, tx: number, ty: number, frame: number) {
  px(ctx, (tx + ty) % 2 ? C.water : C.waterDeep, x, y, TILE, TILE);
  for (let k = 0; k < 2; k++) {
    const h = hash(tx, ty, k + 20);
    const wx = x + 1 + ((h >>> 2) % 9) + frame;
    const wy = y + 4 + k * 6 + ((h >>> 6) % 3);
    px(ctx, C.waterLight, wx, wy, 2, 1);
    px(ctx, C.waterLight, wx + 2, wy - 1, 2, 1);
  }
  const isWater = (nx: number, ny: number) => tileAt(nx, ny) === "water";
  if (!isWater(tx, ty - 1)) px(ctx, C.foam, x, y, TILE, 2);
  if (!isWater(tx, ty + 1)) px(ctx, C.foam, x, y + TILE - 2, TILE, 2);
  if (!isWater(tx - 1, ty)) px(ctx, C.foam, x, y, 2, TILE);
  if (!isWater(tx + 1, ty)) px(ctx, C.foam, x + TILE - 2, y, 2, TILE);
}

function drawTree(ctx: Ctx, x: number, y: number, tx: number, ty: number) {
  drawGrass(ctx, x, y, tx, ty);
  px(ctx, C.shadow, x + 3, y + 13, 10, 3);
  px(ctx, C.trunk, x + 6, y + 11, 4, 4);
  px(ctx, C.trunkDark, x + 8, y + 11, 2, 4);
  // Canopy: outline, fill, shade, highlight.
  px(ctx, C.leafOut, x + 4, y, 8, 1);
  px(ctx, C.leafOut, x + 2, y + 1, 12, 1);
  px(ctx, C.leafOut, x + 1, y + 2, 14, 8);
  px(ctx, C.leafOut, x + 2, y + 10, 12, 1);
  px(ctx, C.leafOut, x + 4, y + 11, 8, 1);
  px(ctx, C.leaf, x + 4, y + 1, 8, 1);
  px(ctx, C.leaf, x + 2, y + 2, 12, 8);
  px(ctx, C.leaf, x + 4, y + 10, 8, 1);
  px(ctx, C.leafDark, x + 2, y + 7, 12, 3);
  px(ctx, C.leafDark, x + 4, y + 10, 8, 1);
  px(ctx, C.leafLight, x + 4, y + 2, 4, 2);
  px(ctx, C.leafLight, x + 3, y + 3, 2, 2);
  px(ctx, C.leafLight, x + 9, y + 4, 2, 1);
}

function drawFlowers(ctx: Ctx, x: number, y: number, tx: number, ty: number, frame: number) {
  drawGrass(ctx, x, y, tx, ty);
  const h = hash(tx, ty, 40);
  const spots = [
    { fx: x + 2 + (h % 4), fy: y + 2 + ((h >>> 2) % 3) },
    { fx: x + 9 + ((h >>> 4) % 4), fy: y + 8 + ((h >>> 6) % 3) },
  ];
  spots.forEach(({ fx, fy }, i) => {
    const color = C.flowers[(h >>> (8 + i * 2)) % C.flowers.length];
    const sx = fx + (frame && i === 0 ? 1 : 0);
    px(ctx, C.grassDark, fx + 1, fy + 3, 1, 2);
    px(ctx, color, sx + 1, fy, 1, 1);
    px(ctx, color, sx, fy + 1, 3, 1);
    px(ctx, color, sx + 1, fy + 2, 1, 1);
    px(ctx, C.flowerCenter, sx + 1, fy + 1, 1, 1);
  });
}

function drawFence(ctx: Ctx, x: number, y: number, tx: number, ty: number) {
  drawGrass(ctx, x, y, tx, ty);
  px(ctx, C.fence, x, y + 6, TILE, 2);
  px(ctx, C.fence, x, y + 10, TILE, 1);
  px(ctx, C.fenceDark, x, y + 11, TILE, 1);
  for (const ox of [2, 11]) {
    px(ctx, C.fenceDark, x + ox, y + 3, 3, 10);
    px(ctx, C.fence, x + ox, y + 3, 2, 9);
    px(ctx, C.fenceLight, x + ox, y + 3, 2, 1);
  }
}

function drawSign(ctx: Ctx, x: number, y: number, tx: number, ty: number) {
  drawGrass(ctx, x, y, tx, ty);
  px(ctx, C.shadow, x + 4, y + 14, 8, 2);
  px(ctx, C.trunk, x + 7, y + 9, 2, 6);
  px(ctx, C.trunkDark, x + 2, y + 2, 12, 8);
  px(ctx, C.signBoard, x + 3, y + 3, 10, 6);
  px(ctx, C.signLine, x + 5, y + 5, 6, 1);
  px(ctx, C.signLine, x + 5, y + 7, 4, 1);
}

function drawTile(ctx: Ctx, tx: number, ty: number, frame: number) {
  const x = tx * TILE;
  const y = ty * TILE;
  switch (MAP[ty][tx]) {
    case "grass":
      return drawGrass(ctx, x, y, tx, ty);
    case "tall":
      return drawTall(ctx, x, y, 0);
    case "flower":
      return drawFlowers(ctx, x, y, tx, ty, frame);
    case "path":
      return drawPath(ctx, x, y, tx, ty);
    case "water":
      return drawWater(ctx, x, y, tx, ty, frame);
    case "tree":
      return drawTree(ctx, x, y, tx, ty);
    case "fence":
      return drawFence(ctx, x, y, tx, ty);
    case "sign":
      return drawSign(ctx, x, y, tx, ty);
  }
}

function drawBuilding(ctx: Ctx, b: Building) {
  const bx = b.x * TILE;
  const by = b.y * TILE;
  const w = b.w * TILE;
  const h = b.h * TILE;
  const roofBottom = by + (b.h - 2) * TILE + 4;
  const wallTop = roofBottom - 6;
  const door = doorOf(b);

  // Ground shadow.
  px(ctx, C.shadow, bx + 2, by + h, w - 2, 2);

  // Walls.
  px(ctx, C.outline, bx, wallTop, w, by + h - wallTop);
  px(ctx, C.wall, bx + 1, wallTop, w - 2, by + h - wallTop - 1);
  px(ctx, C.wallShade, bx + 1, wallTop, 2, by + h - wallTop - 1);
  px(ctx, C.wallShade, bx + w - 3, wallTop, 2, by + h - wallTop - 1);
  px(ctx, C.wallBase, bx + 1, by + h - 4, w - 2, 3);

  // Windows on the door row, skipping the corners and the door.
  const winY = (b.y + b.h - 1) * TILE + 1;
  for (let c = 1; c < b.w - 1; c++) {
    if (b.x + c === door.x) continue;
    const wx = (b.x + c) * TILE + 3;
    px(ctx, C.windowFrame, wx, winY, 10, 8);
    px(ctx, C.glass, wx + 1, winY + 1, 8, 6);
    px(ctx, C.glassLight, wx + 1, winY + 1, 3, 2);
    px(ctx, C.windowFrame, wx + 5, winY + 1, 1, 6);
  }

  // Roof, with a 2px overhang, shingle lines, a lit ridge and a dark eave.
  const dark = shade(b.roof, -0.16);
  const light = shade(b.roof, 0.14);
  const rx = bx - 2;
  const ry = by + 2;
  const rw = w + 4;
  const rh = roofBottom - ry;
  px(ctx, C.outline, rx, ry, rw, rh);
  px(ctx, b.roof, rx + 1, ry + 1, rw - 2, rh - 2);
  px(ctx, light, rx + 1, ry + 1, rw - 2, 2);
  for (let yy = ry + 6; yy < ry + rh - 5; yy += 5) px(ctx, dark, rx + 1, yy, rw - 2, 1);
  px(ctx, dark, rx + 1, ry + rh - 4, rw - 2, 3);

  // Chimney on the house.
  if (b.section === "about") {
    px(ctx, C.outline, bx + w - 20, by - 3, 8, 8);
    px(ctx, "#9a6e57", bx + w - 19, by - 2, 6, 6);
  }

  // Door.
  const dx = door.x * TILE + 3;
  const dy = door.y * TILE - 2;
  px(ctx, C.outline, dx - 1, dy - 1, 12, 19);
  px(ctx, C.door, dx, dy, 10, 18);
  px(ctx, C.doorDark, dx, dy, 10, 2);
  px(ctx, C.doorDark, dx + 4, dy + 3, 2, 13);
  px(ctx, C.knob, dx + 7, dy + 9, 1, 2);
}

/** Ground, buildings and decorations, pre-rendered once per idle frame. */
let staticLayers: HTMLCanvasElement[] | null = null;

function getStaticLayers() {
  if (staticLayers) return staticLayers;
  staticLayers = [0, 1].map((frame) => {
    const canvas = document.createElement("canvas");
    canvas.width = MAP_W;
    canvas.height = MAP_H;
    const ctx = canvas.getContext("2d")!;
    for (let ty = 0; ty < ROWS; ty++) for (let tx = 0; tx < COLS; tx++) drawTile(ctx, tx, ty, frame);
    for (const b of BUILDINGS) drawBuilding(ctx, b);
    return canvas;
  });
  return staticLayers;
}

// ─── Player ──────────────────────────────────────────────────────────────────

const P = {
  out: "#1b1622",
  hair: "#2a2233",
  skin: "#f0c7a0",
  top: "#2bb3a3",
  topDark: "#1d8679",
  pants: "#2f3b5e",
  shoe: "#f5f3ee",
};

/** `step` is 0 standing, or 1 / 2 for the alternating stride frames. */
function drawPlayer(ctx: Ctx, x: number, y: number, dir: Dir, step: number) {
  px(ctx, "rgba(0, 0, 0, 0.22)", x + 3, y + 14, 10, 2);

  // Legs.
  if (dir === "up" || dir === "down") {
    const left = step === 1 ? 1 : 2;
    const right = step === 2 ? 1 : 2;
    px(ctx, P.pants, x + 4, y + 12, 3, left);
    px(ctx, P.pants, x + 9, y + 12, 3, right);
    px(ctx, P.shoe, x + 4, y + 12 + left, 3, 1);
    px(ctx, P.shoe, x + 9, y + 12 + right, 3, 1);
  } else if (step) {
    px(ctx, P.pants, x + 4, y + 12, 3, 2);
    px(ctx, P.pants, x + 9, y + 12, 3, 2);
    px(ctx, P.shoe, x + 4, y + 14, 3, 1);
    px(ctx, P.shoe, x + 9, y + 14, 3, 1);
  } else {
    px(ctx, P.pants, x + 6, y + 12, 4, 2);
    px(ctx, P.shoe, x + 6, y + 14, 4, 1);
  }

  // Body.
  px(ctx, P.out, x + 3, y + 7, 10, 6);
  px(ctx, P.top, x + 4, y + 8, 8, 4);
  px(ctx, P.topDark, x + 4, y + 11, 8, 1);
  if (dir === "up" || dir === "down") {
    px(ctx, P.skin, x + 3, y + 11, 1, 1);
    px(ctx, P.skin, x + 12, y + 11, 1, 1);
  }

  // Head.
  px(ctx, P.out, x + 3, y, 10, 8);
  px(ctx, P.hair, x + 4, y + 1, 8, 6);
  if (dir === "down") {
    px(ctx, P.skin, x + 4, y + 4, 8, 3);
    px(ctx, P.out, x + 5, y + 4, 1, 2);
    px(ctx, P.out, x + 10, y + 4, 1, 2);
  } else if (dir === "left") {
    px(ctx, P.skin, x + 4, y + 4, 5, 3);
    px(ctx, P.out, x + 5, y + 4, 1, 2);
  } else if (dir === "right") {
    px(ctx, P.skin, x + 7, y + 4, 5, 3);
    px(ctx, P.out, x + 10, y + 4, 1, 2);
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

const SPAWN: Point = { x: 16, y: 10 };

interface GameState {
  /** Current tile, or the tile being walked into. */
  x: number;
  y: number;
  /** Tile the current step started from. */
  from: Point;
  /** Step progress, 0..1. */
  t: number;
  moving: boolean;
  dir: Dir;
  /** Flips each step so the legs alternate. */
  stride: number;
  /** Queued tiles from a click. */
  path: Point[];
  /** Held direction keys, most recent last. */
  held: Dir[];
  /** Runs once the queued path is walked (reading a sign). */
  pending: (() => void) | null;
  /** True while a door transition plays. */
  busy: boolean;
}

export default function TownMap() {
  const measureRef = useRef<HTMLDivElement>(null);
  const playRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visibleRef = useRef(false);
  const dialogRef = useRef<string | null>(null);
  const timers = useRef<number[]>([]);
  const game = useRef<GameState>({
    ...SPAWN,
    from: { ...SPAWN },
    t: 1,
    moving: false,
    dir: "down",
    stride: 0,
    path: [],
    held: [],
    pending: null,
    busy: false,
  });

  const [scale, setScale] = useState(2);
  const [cssWidth, setCssWidth] = useState(MAP_W * 2);
  const [dialog, setDialog] = useState<string | null>(null);
  const [typed, setTyped] = useState(0);
  const [fadeLabel, setFadeLabel] = useState<string | null>(null);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const openDialog = (text: string) => {
    dialogRef.current = text;
    setDialog(text);
    setTyped(prefersReducedMotion() ? text.length : 0);
  };

  const advanceDialog = () => {
    const text = dialogRef.current;
    if (!text) return;
    if (typed < text.length) {
      setTyped(text.length);
    } else {
      dialogRef.current = null;
      setDialog(null);
    }
  };

  const enter = (b: Building) => {
    const g = game.current;
    const reduced = prefersReducedMotion();
    g.busy = true;
    g.path = [];
    g.pending = null;
    g.held = [];
    setFadeLabel(b.name);
    later(() => {
      // Release focus so arrow keys scroll the page again once it lands.
      playRef.current?.blur();
      document
        .getElementById(b.section)
        ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      // Step back out of the door, facing the street, for when they return.
      const d = doorOf(b);
      g.x = d.x;
      g.y = d.y + 1;
      g.from = { x: g.x, y: g.y };
      g.t = 1;
      g.dir = "down";
      later(() => {
        setFadeLabel(null);
        g.busy = false;
      }, 250);
    }, reduced ? 80 : 420);
  };

  const tryStep = (dir: Dir) => {
    const g = game.current;
    g.dir = dir;
    const nx = g.x + DX[dir];
    const ny = g.y + DY[dir];
    if (!passable(nx, ny, dir)) {
      g.path = [];
      return;
    }
    if (g.path.length && g.path[0].x === nx && g.path[0].y === ny) g.path.shift();
    g.from = { x: g.x, y: g.y };
    g.x = nx;
    g.y = ny;
    g.t = 0;
    g.moving = true;
  };

  const update = (dt: number) => {
    const g = game.current;
    if (g.moving) {
      g.t += dt / STEP_MS;
      if (g.t >= 1) {
        g.t = 1;
        g.moving = false;
        g.stride ^= 1;
        const b = doorBuildingAt(g.x, g.y);
        if (b) {
          enter(b);
          return;
        }
      }
    }
    if (g.moving || g.busy || dialogRef.current) return;

    const held = g.held[g.held.length - 1];
    if (held) {
      tryStep(held);
    } else if (g.path.length) {
      const dir = dirToward(g, g.path[0]);
      if (dir) tryStep(dir);
      else g.path = [];
    } else if (g.pending) {
      const run = g.pending;
      g.pending = null;
      run();
    }
  };

  /** Read the sign or building the player is facing. */
  const interact = () => {
    const g = game.current;
    const fx = g.x + DX[g.dir];
    const fy = g.y + DY[g.dir];
    const sign = SIGNS.find((s) => s.x === fx && s.y === fy);
    if (sign) {
      openDialog(sign.text);
      return;
    }
    if (inBounds(fx, fy) && OCC[fy][fx] !== -1) {
      const b = BUILDINGS[OCC[fy][fx]];
      const d = doorOf(b);
      if (fx === d.x && fy === d.y && g.dir === "up") tryStep("up");
      else openDialog(`${b.name}. The door is around the front.`);
    }
  };

  const walkToBuilding = (b: Building) => {
    const g = game.current;
    if (g.busy) return;
    const d = doorOf(b);
    const route = findRoute(g, (x, y) => x === d.x && y === d.y + 1);
    if (!route) return;
    g.held = [];
    g.pending = null;
    g.path = [...route, d];
  };

  const walkToSign = (sign: Point & { text: string }) => {
    const g = game.current;
    const route = findRoute(g, (x, y) => Math.abs(x - sign.x) + Math.abs(y - sign.y) === 1);
    if (!route) return;
    g.held = [];
    g.path = route;
    g.pending = () => {
      g.dir = dirToward(g, sign) ?? g.dir;
      openDialog(sign.text);
    };
  };

  // Size the canvas to a whole multiple of the map's pixels, so every art pixel
  // covers the same number of device pixels and nothing smears.
  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const measure = () => {
      const dpr = window.devicePixelRatio || 1;
      const s = Math.max(1, Math.floor((el.clientWidth * dpr) / MAP_W));
      setScale(s);
      setCssWidth((MAP_W * s) / dpr);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Game loop. Runs only while the map is on screen.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const layers = getStaticLayers();
    const reduced = prefersReducedMotion();
    let raf = 0;
    let last = 0;
    let running = false;

    const render = (now: number) => {
      const g = game.current;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(layers[reduced ? 0 : Math.floor(now / 650) % 2], 0, 0);

      const fx = g.from.x + (g.x - g.from.x) * g.t;
      const fy = g.from.y + (g.y - g.from.y) * g.t;
      const step = g.moving && g.t < 0.5 ? 1 + g.stride : 0;
      drawPlayer(ctx, Math.round(fx * TILE), Math.round(fy * TILE) - 3, g.dir, step);

      // Tall grass hides the player's legs, and rustles while they walk through.
      for (const t of [g.from, { x: g.x, y: g.y }]) {
        if (tileAt(t.x, t.y) !== "tall") continue;
        ctx.save();
        ctx.beginPath();
        ctx.rect(t.x * TILE, t.y * TILE + 9, TILE, 7);
        ctx.clip();
        drawTall(ctx, t.x * TILE, t.y * TILE, g.moving && !reduced ? 1 : 0);
        ctx.restore();
      }
    };

    const frame = (now: number) => {
      update(Math.min(now - last, 64));
      last = now;
      render(now);
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    render(performance.now());
    const io = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
      if (entry.isIntersecting) start();
      else stop();
    });
    io.observe(canvas);
    return () => {
      stop();
      io.disconnect();
    };
    // update/render read only refs and stable setters, so they need not be deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale]);

  // Typewriter for the dialog box.
  useEffect(() => {
    if (!dialog || typed >= dialog.length) return;
    const id = window.setTimeout(() => setTyped((n) => Math.min(dialog.length, n + 2)), 28);
    return () => window.clearTimeout(id);
  }, [dialog, typed]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Once the map scrolls away, give the arrow keys back to the page.
    if (!visibleRef.current) return;
    const g = game.current;
    const dir = KEY_DIR[e.key];
    const fromSelf = e.target === e.currentTarget;

    if (dialogRef.current) {
      if (e.key === "Escape" || (fromSelf && ACTION_KEYS.has(e.key))) {
        e.preventDefault();
        if (e.key === "Escape") {
          dialogRef.current = null;
          setDialog(null);
        } else advanceDialog();
      } else if (dir) e.preventDefault();
      return;
    }

    if (dir) {
      e.preventDefault();
      g.path = [];
      g.pending = null;
      if (!g.held.includes(dir)) g.held.push(dir);
      if (!g.moving && !g.busy) tryStep(dir);
    } else if (fromSelf && ACTION_KEYS.has(e.key)) {
      e.preventDefault();
      if (!e.repeat && !g.moving && !g.busy) interact();
    }
  };

  const onKeyUp = (e: React.KeyboardEvent) => {
    const dir = KEY_DIR[e.key];
    if (dir) game.current.held = game.current.held.filter((d) => d !== dir);
  };

  const onMapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dialogRef.current) {
      advanceDialog();
      return;
    }
    const g = game.current;
    if (g.busy) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const tx = Math.floor(((e.clientX - rect.left) / rect.width) * COLS);
    const ty = Math.floor(((e.clientY - rect.top) / rect.height) * ROWS);
    if (!inBounds(tx, ty)) return;

    if (OCC[ty][tx] !== -1) return walkToBuilding(BUILDINGS[OCC[ty][tx]]);
    const sign = SIGNS.find((s) => s.x === tx && s.y === ty);
    if (sign) return walkToSign(sign);
    if (!walkable(tx, ty)) return;

    const route = findRoute(g, (x, y) => x === tx && y === ty);
    if (route) {
      g.held = [];
      g.pending = null;
      g.path = route;
    }
  };

  const labelSize = Math.max(7, Math.round(cssWidth / 95));

  return (
    <div ref={measureRef} className="town-map w-full">
      <div
        ref={playRef}
        tabIndex={0}
        role="group"
        aria-label="Town map. Use the arrow keys to walk and Space to read signs. Walk into a building to open that section, or use the building buttons."
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={() => (game.current.held = [])}
        className="town-frame relative mx-auto"
        style={{ width: cssWidth, maxWidth: "100%" }}
      >
        <canvas
          ref={canvasRef}
          width={MAP_W * scale}
          height={MAP_H * scale}
          onClick={onMapClick}
          className="block w-full h-auto"
          aria-hidden="true"
        />

        {BUILDINGS.map((b) => (
          <button
            key={b.section}
            type="button"
            className="town-label"
            onClick={() => walkToBuilding(b)}
            aria-label={`Walk to ${b.name} (${b.section})`}
            style={
              {
                left: `${((b.x + b.w / 2) / COLS) * 100}%`,
                top: `${((b.y * TILE + 1) / MAP_H) * 100}%`,
                fontSize: labelSize,
                "--roof": b.roof,
              } as React.CSSProperties
            }
          >
            {b.name}
          </button>
        ))}

        {dialog && (
          <div className="town-dialog" onClick={advanceDialog} style={{ fontSize: labelSize + 2 }}>
            <p aria-hidden="true">{dialog.slice(0, typed)}</p>
            {typed >= dialog.length && <span className="town-caret" aria-hidden="true" />}
          </div>
        )}
        <p className="sr-only" aria-live="polite">
          {dialog ?? ""}
        </p>

        <div
          className="town-fade"
          data-on={fadeLabel ? "" : undefined}
          style={{ fontSize: labelSize + 4 }}
          aria-hidden="true"
        >
          {fadeLabel}
        </div>
      </div>

      <p className="meta text-center mt-4" style={{ fontSize: 12 }}>
        Arrow keys or WASD to walk · Space to read signs · Tap anywhere to walk there
      </p>
    </div>
  );
}

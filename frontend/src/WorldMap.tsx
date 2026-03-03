import React, { useRef, useEffect } from "react";

interface Civilization {
  id: number;
  name: string;
  iron: number;
  food: number;
  wood: number;
  population: number;
  isAlive: boolean;
}

const COLORS = {
  bg: "#0a0a1a",
  ground: "#1a1a0a",
  ironKingdom: "#ff6b35",
  greenValley: "#35ff6b",
  water: "#1a3a5a",
  tree: "#2d5a1e",
  mountain: "#4a4a4a",
  road: "#3a3020",
  building: "#8a7a5a",
};

export default function WorldMap({ civs, tick }: { civs: Civilization[]; tick: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 400;
  const H = 200;
  const PIXEL = 4; // pixel size

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;

    // Clear
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    // Ground
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, H * 0.5, W, H * 0.5);

    // River in center
    ctx.fillStyle = COLORS.water;
    ctx.fillRect(W / 2 - 6, H * 0.3, 12, H * 0.7);

    // Mountains top
    for (let i = 0; i < W; i += 20) {
      ctx.fillStyle = COLORS.mountain;
      const h = 15 + Math.sin(i * 0.3) * 8;
      drawPixelTriangle(ctx, i + 10, H * 0.35, 10, h, PIXEL);
    }

    // Trees
    ctx.fillStyle = COLORS.tree;
    const treePositions = [
      [40, 120], [60, 130], [80, 110], [100, 140],
      [300, 120], [320, 130], [340, 110], [360, 140],
    ];
    for (const [x, y] of treePositions) {
      drawPixelRect(ctx, x, y, 4, 8, PIXEL, COLORS.tree);
      drawPixelRect(ctx, x - 2, y - 4, 8, 4, PIXEL, COLORS.tree);
    }

    // Iron Kingdom (left)
    const civA = civs[0];
    if (civA?.isAlive) {
      // Castle
      drawPixelRect(ctx, 60, 85, 16, 20, PIXEL, COLORS.ironKingdom);
      drawPixelRect(ctx, 56, 80, 8, 8, PIXEL, COLORS.ironKingdom);
      drawPixelRect(ctx, 72, 80, 8, 8, PIXEL, COLORS.ironKingdom);
      
      // Houses based on population
      const houses = Math.min(5, Math.floor(civA.population / 20));
      for (let i = 0; i < houses; i++) {
        const hx = 30 + i * 25 + (i >= 3 ? -75 : 0);
        const hy = i >= 3 ? 150 : 130;
        drawPixelRect(ctx, hx, hy, 8, 8, PIXEL, COLORS.building);
        drawPixelRect(ctx, hx - 1, hy - 3, 10, 3, PIXEL, COLORS.ironKingdom);
      }

      // Label
      ctx.fillStyle = COLORS.ironKingdom;
      ctx.font = "8px 'Press Start 2P'";
      ctx.textAlign = "center";
      ctx.fillText("⚔️ Iron Kingdom", 90, 175);
    } else {
      ctx.fillStyle = "#333";
      ctx.font = "8px 'Press Start 2P'";
      ctx.textAlign = "center";
      ctx.fillText("💀 Ruins", 90, 175);
    }

    // Green Valley (right)
    const civB = civs[1];
    if (civB?.isAlive) {
      // Main hall
      drawPixelRect(ctx, 290, 85, 16, 20, PIXEL, COLORS.greenValley);
      drawPixelRect(ctx, 286, 80, 8, 8, PIXEL, COLORS.greenValley);
      drawPixelRect(ctx, 302, 80, 8, 8, PIXEL, COLORS.greenValley);
      
      // Farms based on food
      const farms = Math.min(5, Math.floor(civB.food / 20));
      for (let i = 0; i < farms; i++) {
        const fx = 260 + i * 25 + (i >= 3 ? -75 : 0);
        const fy = i >= 3 ? 150 : 130;
        drawPixelRect(ctx, fx, fy, 8, 8, PIXEL, COLORS.building);
        drawPixelRect(ctx, fx - 1, fy - 3, 10, 3, PIXEL, COLORS.greenValley);
      }

      ctx.fillStyle = COLORS.greenValley;
      ctx.font = "8px 'Press Start 2P'";
      ctx.textAlign = "center";
      ctx.fillText("🌿 Green Valley", 310, 175);
    } else {
      ctx.fillStyle = "#333";
      ctx.font = "8px 'Press Start 2P'";
      ctx.textAlign = "center";
      ctx.fillText("💀 Ruins", 310, 175);
    }

    // Trade route animation (if tick > 0)
    if (tick > 0) {
      const tradeX = W / 2 + Math.sin(tick * 0.5) * 20;
      drawPixelRect(ctx, tradeX - 2, H * 0.55, 4, 4, PIXEL, "#ffd700");
    }

  }, [civs, tick]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{
        width: "100%",
        maxWidth: 800,
        imageRendering: "pixelated",
        border: "2px solid #333",
        background: COLORS.bg,
      }}
    />
  );
}

function drawPixelRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  _pixel: number, color: string
) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawPixelTriangle(
  ctx: CanvasRenderingContext2D,
  cx: number, baseY: number, halfW: number, h: number,
  _pixel: number
) {
  ctx.beginPath();
  ctx.moveTo(cx, baseY - h);
  ctx.lineTo(cx - halfW, baseY);
  ctx.lineTo(cx + halfW, baseY);
  ctx.closePath();
  ctx.fill();
}

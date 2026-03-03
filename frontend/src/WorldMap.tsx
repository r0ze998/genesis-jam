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

export default function WorldMap({ civs, tick }: { civs: Civilization[]; tick: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 560;
  const H = 240;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.45);
    skyGrad.addColorStop(0, "#0a0a1a");
    skyGrad.addColorStop(1, "#0f1628");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H * 0.45);

    // Stars
    const starSeed = 42;
    for (let i = 0; i < 40; i++) {
      const x = ((starSeed * (i + 1) * 7) % W);
      const y = ((starSeed * (i + 1) * 13) % (H * 0.4));
      const brightness = 40 + ((i * 17) % 60);
      const twinkle = Math.sin(tick * 0.3 + i) * 20;
      ctx.fillStyle = `rgba(255,255,255,${(brightness + twinkle) / 255})`;
      ctx.fillRect(x, y, 1, 1);
    }

    // Ground
    const groundGrad = ctx.createLinearGradient(0, H * 0.45, 0, H);
    groundGrad.addColorStop(0, "#1a1a0a");
    groundGrad.addColorStop(1, "#0d0d05");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, H * 0.45, W, H * 0.55);

    // Mountains
    ctx.fillStyle = "#1a1a2a";
    for (let i = 0; i < W; i += 25) {
      const h = 20 + Math.sin(i * 0.15) * 12 + Math.cos(i * 0.08) * 8;
      drawTriangle(ctx, i + 12, H * 0.45, 14, h);
    }
    // Smaller mountains in front
    ctx.fillStyle = "#151520";
    for (let i = 10; i < W; i += 35) {
      const h = 12 + Math.sin(i * 0.2) * 6;
      drawTriangle(ctx, i + 8, H * 0.48, 10, h);
    }

    // River
    ctx.fillStyle = "#0a2a4a";
    const riverX = W / 2;
    ctx.beginPath();
    ctx.moveTo(riverX - 4, H * 0.4);
    for (let y = H * 0.4; y < H; y += 2) {
      const wobble = Math.sin(y * 0.05 + tick * 0.2) * 3;
      ctx.lineTo(riverX + wobble - 5, y);
    }
    for (let y = H; y > H * 0.4; y -= 2) {
      const wobble = Math.sin(y * 0.05 + tick * 0.2) * 3;
      ctx.lineTo(riverX + wobble + 5, y);
    }
    ctx.closePath();
    ctx.fill();

    // River shimmer
    ctx.fillStyle = "#1a4a7a44";
    for (let y = H * 0.5; y < H; y += 12) {
      const wobble = Math.sin(y * 0.05 + tick * 0.2) * 3;
      ctx.fillRect(riverX + wobble - 3, y + Math.sin(tick * 0.5 + y) * 2, 6, 1);
    }

    // === LEFT SIDE: Iron Kingdom ===
    const civA = civs[0];
    if (civA?.isAlive) {
      // Castle
      ctx.fillStyle = "#8a4a1a";
      rect(ctx, 80, 88, 24, 28);
      // Towers
      ctx.fillStyle = "#aa5a2a";
      rect(ctx, 74, 78, 10, 38);
      rect(ctx, 96, 78, 10, 38);
      // Tower tops
      ctx.fillStyle = "#ff6b35";
      drawTriangle(ctx, 79, 78, 6, 8);
      drawTriangle(ctx, 101, 78, 6, 8);
      // Flag
      ctx.fillStyle = "#ff6b35";
      rect(ctx, 90, 72, 1, 16);
      rect(ctx, 91, 72, 6, 4);
      // Gate
      ctx.fillStyle = "#1a0a00";
      rect(ctx, 87, 102, 10, 14);

      // Houses based on population
      const houses = Math.min(6, Math.floor(civA.population / 15));
      for (let i = 0; i < houses; i++) {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const hx = 30 + col * 30;
        const hy = 135 + row * 28;
        ctx.fillStyle = "#5a3a1a";
        rect(ctx, hx, hy, 12, 10);
        ctx.fillStyle = "#8a4a1a";
        drawTriangle(ctx, hx + 6, hy, 8, 6);
        // Chimney smoke
        if (tick % 3 === i % 3) {
          ctx.fillStyle = "#ffffff15";
          rect(ctx, hx + 9, hy - 4 - (tick % 4) * 2, 2, 2);
        }
      }

      // Mine (if iron > 50)
      if (civA.iron > 50) {
        ctx.fillStyle = "#4a4a4a";
        rect(ctx, 150, 120, 14, 10);
        ctx.fillStyle = "#333";
        drawTriangle(ctx, 157, 120, 9, 7);
        ctx.fillStyle = "#1a1a1a";
        rect(ctx, 154, 124, 6, 6);
      }
    } else {
      // Ruins
      ctx.fillStyle = "#2a1a0a";
      rect(ctx, 80, 95, 24, 20);
      rect(ctx, 74, 90, 4, 25);
      ctx.fillStyle = "#1a0a00";
      rect(ctx, 85, 100, 14, 15);
    }

    // === RIGHT SIDE: Green Valley ===
    const civB = civs[1];
    if (civB?.isAlive) {
      // Main hall
      ctx.fillStyle = "#2a5a1a";
      rect(ctx, 390, 88, 24, 28);
      ctx.fillStyle = "#35aa35";
      drawTriangle(ctx, 402, 82, 16, 10);
      // Flag
      ctx.fillStyle = "#35ff6b";
      rect(ctx, 400, 72, 1, 16);
      rect(ctx, 401, 72, 6, 4);

      // Farms
      const farms = Math.min(6, Math.floor(civB.food / 15));
      for (let i = 0; i < farms; i++) {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const fx = 440 + col * 30;
        const fy = 130 + row * 28;
        // Field
        ctx.fillStyle = "#1a3a0a";
        rect(ctx, fx - 2, fy + 6, 16, 8);
        // Crops
        ctx.fillStyle = "#35aa35";
        for (let c = 0; c < 3; c++) {
          rect(ctx, fx + c * 5, fy + 7 + (tick + c) % 2, 1, 3 + (tick + c) % 2);
        }
        // Farmhouse
        ctx.fillStyle = "#5a4a2a";
        rect(ctx, fx, fy, 10, 8);
        ctx.fillStyle = "#35aa35";
        drawTriangle(ctx, fx + 5, fy, 7, 5);
      }

      // Cottage
      ctx.fillStyle = "#4a3a1a";
      rect(ctx, 360, 140, 14, 12);
      ctx.fillStyle = "#2a6a1a";
      drawTriangle(ctx, 367, 140, 9, 7);
    } else {
      ctx.fillStyle = "#0a2a0a";
      rect(ctx, 390, 95, 24, 20);
    }

    // Trees scattered
    const trees = [
      [180, 125], [200, 140], [215, 118], [340, 128], [355, 115], [330, 145],
      [20, 130], [10, 145], [520, 135], [540, 125],
    ];
    for (const [tx, ty] of trees) {
      ctx.fillStyle = "#3a2a1a";
      rect(ctx, tx + 2, ty, 2, 8);
      ctx.fillStyle = "#1a4a0a";
      drawTriangle(ctx, tx + 3, ty, 5, 7);
      ctx.fillStyle = "#2a5a1a";
      drawTriangle(ctx, tx + 3, ty + 3, 4, 5);
    }

    // Trade caravan animation
    if (tick > 0) {
      const caravanPhase = (tick * 0.15) % (Math.PI * 2);
      const cx = W / 2 + Math.sin(caravanPhase) * 80;
      const cy = H * 0.6 + Math.cos(caravanPhase * 0.5) * 5;

      // Cart
      ctx.fillStyle = "#8a7a4a";
      rect(ctx, cx - 4, cy - 2, 8, 4);
      // Wheels
      ctx.fillStyle = "#5a4a2a";
      rect(ctx, cx - 3, cy + 2, 2, 2);
      rect(ctx, cx + 2, cy + 2, 2, 2);
      // Goods
      ctx.fillStyle = "#ffd700";
      rect(ctx, cx - 2, cy - 4, 4, 2);
    }

    // Civ labels
    ctx.font = "8px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.fillStyle = civA?.isAlive ? "#ff6b3588" : "#33333388";
    ctx.fillText(civA?.isAlive ? "⚔️ Iron Kingdom" : "💀 Ruins", 100, H - 8);
    ctx.fillStyle = civB?.isAlive ? "#35ff6b88" : "#33333388";
    ctx.fillText(civB?.isAlive ? "🌿 Green Valley" : "💀 Ruins", 420, H - 8);

  }, [civs, tick]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{
        width: "100%",
        maxWidth: 840,
        imageRendering: "pixelated",
        border: "1px solid #1a1a2e",
        borderRadius: 4,
        background: "#0a0a1a",
      }}
    />
  );
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillRect(x, y, w, h);
}

function drawTriangle(ctx: CanvasRenderingContext2D, cx: number, baseY: number, halfW: number, h: number) {
  ctx.beginPath();
  ctx.moveTo(cx, baseY - h);
  ctx.lineTo(cx - halfW, baseY);
  ctx.lineTo(cx + halfW, baseY);
  ctx.closePath();
  ctx.fill();
}

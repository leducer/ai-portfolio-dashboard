"use client";

import { useEffect, useRef } from "react";

/** Katakana + Ziffern – klassisches Matrix-Set, sparsamer als ein volles Alphabet. */
const GLYPHS = "ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ0123456789";

const FONT_SIZE = 18;
/** Extrem geringe Deckkraft – auf `bg-brand-black` nur als zarter Hauch sichtbar. */
const GLYPH_COLOR = "rgba(0, 255, 102, 0.04)";
/** Entspricht `--color-brand-black` (#0a0b0d), damit Trails ins Hintergrundschwarz auflösen. */
const TRAIL_FADE = "rgba(10, 11, 13, 0.08)";
const BACKGROUND = "#0a0b0d";
/** ~11 fps – driftend, nicht stürmisch. */
const FRAME_INTERVAL_MS = 90;
const MIN_DROP_STEP = 0.12;
const MAX_DROP_STEP = 0.28;

export default function SubtleMatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let drops: number[] = [];
    let speeds: number[] = [];
    let columnCount = 0;
    let rafId = 0;
    let lastFrame = 0;
    let running = true;

    const randomSpeed = () => MIN_DROP_STEP + Math.random() * (MAX_DROP_STEP - MIN_DROP_STEP);

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, width, height);

      columnCount = Math.max(1, Math.floor(width / FONT_SIZE));
      const nextDrops = new Array<number>(columnCount);
      const nextSpeeds = new Array<number>(columnCount);
      for (let i = 0; i < columnCount; i++) {
        nextDrops[i] = drops[i] ?? Math.random() * (height / FONT_SIZE);
        nextSpeeds[i] = speeds[i] ?? randomSpeed();
      }
      drops = nextDrops;
      speeds = nextSpeeds;
    };

    const draw = () => {
      const { width, height } = canvas;

      ctx.fillStyle = TRAIL_FADE;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = GLYPH_COLOR;
      ctx.font = `${FONT_SIZE}px ui-monospace, monospace`;

      for (let i = 0; i < columnCount; i++) {
        const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!;
        ctx.fillText(glyph, i * FONT_SIZE, drops[i]! * FONT_SIZE);

        if (drops[i]! * FONT_SIZE > height && Math.random() > 0.994) {
          drops[i] = 0;
          speeds[i] = randomSpeed();
        }
        drops[i]! += speeds[i]!;
      }
    };

    const loop = (timestamp: number) => {
      if (!running) return;
      rafId = requestAnimationFrame(loop);
      if (timestamp - lastFrame < FRAME_INTERVAL_MS) return;
      lastFrame = timestamp;
      draw();
    };

    resize();
    window.addEventListener("resize", resize);
    rafId = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
    />
  );
}

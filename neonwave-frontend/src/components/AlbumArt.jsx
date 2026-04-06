import React, { useEffect, useRef } from "react";

export default function AlbumArt({ song, theme, size = 200 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    const seed = (song?.name || "default").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const rng = (n) => ((seed * (n + 1) * 2654435761) >>> 0) / 4294967295;

    ctx.fillStyle = theme.card;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 6; i++) {
      const x = rng(i * 3) * W;
      const y = rng(i * 3 + 1) * H;
      const r = 30 + rng(i * 3 + 2) * 80;
      const colors = [theme.accent, theme.accent2, theme.accent3];
      const c = colors[i % 3];
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, c + "55");
      grad.addColorStop(1, c + "00");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = theme.accent + "33";
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const x = rng(i + 20) * W;
      const y = rng(i + 21) * H;
      const r = 20 + rng(i + 22) * 60;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = theme.accent + "22";
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = theme.accent + "44";
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = theme.bg;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 8, 0, Math.PI * 2);
    ctx.fill();
  }, [song, theme]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size, borderRadius: 12, display: "block" }}
    />
  );
}

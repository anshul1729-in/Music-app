import React, { useEffect, useRef } from "react";

export default function Visualizer({ analyser, isPlaying, theme }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      if (!analyser || !isPlaying) {
        const bars = 48;
        const barW = (W - bars * 2) / bars;
        for (let i = 0; i < bars; i++) {
          const h = 3 + Math.sin(Date.now() / 800 + i * 0.4) * 2;
          const x = i * (barW + 2);
          ctx.fillStyle = theme.muted + "66";
          ctx.beginPath();
          ctx.roundRect(x, H / 2 - h / 2, barW, h, 2);
          ctx.fill();
        }
        return;
      }

      const bufLen = analyser.frequencyBinCount;
      const data = new Uint8Array(bufLen);
      analyser.getByteFrequencyData(data);

      const bars = 64;
      const barW = (W - bars * 2) / bars;
      for (let i = 0; i < bars; i++) {
        const idx = Math.floor((i / bars) * bufLen * 0.7);
        const v = data[idx] / 255;
        const h = Math.max(4, v * H * 0.9);
        const x = i * (barW + 2);
        const hue = i / bars;

        let color;
        if (hue < 0.5) {
          const t = hue * 2;
          color = `rgba(${Math.round(0 + t * 168)}, ${Math.round(245 - t * 75)}, ${Math.round(255 - t * 138)}, ${0.6 + v * 0.4})`;
        } else {
          const t = (hue - 0.5) * 2;
          color = `rgba(${Math.round(168 + t * 87)}, ${Math.round(170 - t * 170)}, ${Math.round(117 + t * 110)}, ${0.6 + v * 0.4})`;
        }

        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = v * 15;
        ctx.beginPath();
        ctx.roundRect(x, H - h, barW, h, 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [analyser, isPlaying, theme]);

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={80}
      style={{ width: "100%", height: 80, display: "block" }}
    />
  );
}

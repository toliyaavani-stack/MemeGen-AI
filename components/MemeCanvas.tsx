import React, { useEffect, useRef } from 'react';
import { MemeText } from '../types';

interface MemeCanvasProps {
  imageSrc: string | null;
  texts: MemeText[];
  width?: number;
  height?: number;
  onImageLoaded?: (width: number, height: number) => void;
}

const MemeCanvas: React.FC<MemeCanvasProps> = ({ 
  imageSrc, 
  texts, 
  width = 600, 
  height = 600,
  onImageLoaded 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (imageSrc) {
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        // Draw Image
        // Calculate aspect ratio to fit within max dimensions while maintaining ratio
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width / 2) - (img.width / 2) * scale;
        const y = (canvas.height / 2) - (img.height / 2) * scale;
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        // Draw Texts
        texts.forEach(text => {
          ctx.save();
          ctx.font = `bold ${text.fontSize}px Impact, sans-serif`;
          ctx.fillStyle = text.color;
          ctx.strokeStyle = text.strokeColor;
          ctx.lineWidth = text.fontSize / 15;
          ctx.textAlign = 'center';
          
          // Simple multi-line support
          const words = text.text.split(' ');
          let line = '';
          const lines = [];
          
          // Very basic wrapping logic for canvas
          for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > canvas.width * 0.9 && n > 0) {
              lines.push(line);
              line = words[n] + ' ';
            } else {
              line = testLine;
            }
          }
          lines.push(line);

          lines.forEach((l, i) => {
            const lineHeight = text.fontSize * 1.2;
            const lineY = text.y + (i * lineHeight);
            ctx.strokeText(l, text.x, lineY);
            ctx.fillText(l, text.x, lineY);
          });

          ctx.restore();
        });
      };
    } else {
      // Placeholder
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Select or Upload an Image', canvas.width / 2, canvas.height / 2);
    }

  }, [imageSrc, texts, width, height]);

  return (
    <div className="rounded-lg overflow-hidden shadow-2xl border border-slate-700 bg-slate-900 flex justify-center items-center">
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height}
        className="max-w-full h-auto object-contain"
      />
    </div>
  );
};

export default MemeCanvas;

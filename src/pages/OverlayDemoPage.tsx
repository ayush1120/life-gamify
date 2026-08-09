import React, { useState, useRef, useEffect } from "react";
import "./OverlayDemoPage.css";
import { Layers, Sliders, Circle, Hexagon, Star, Eye, Target, Sparkles, Upload, Download, Square } from "lucide-react";

export default function OverlayDemoPage() {
  // Uploaded Image State
  const [imageSrc, setImageSrc] = useState<string>("https://picsum.photos/800/450");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shape & Integer Size
  const [shape, setShape] = useState<string>("none"); // 'none', 'circle', 'ellipse', 'hexagon', 'star'
  const [shapeSize, setShapeSize] = useState<number>(100);

  // Movable Points (x, y as percentage 0-100 of image container)
  const [pointA, setPointA] = useState<{ x: number; y: number }>({ x: 25, y: 50 });
  const [pointB, setPointB] = useState<{ x: number; y: number }>({ x: 75, y: 50 });

  // Opacity limits at each point
  const [opacityA, setOpacityA] = useState<number>(1.0);
  const [opacityB, setOpacityB] = useState<number>(0.0);

  // Pattern / Gradient style: 'linear', 'radial', 'square', 'conic', 'elliptical'
  const [patternMode, setPatternMode] = useState<string>("linear");

  // Overlay Mode: 'no-color' (pure image opacity), 'color', 'darken', 'lighten'
  const [overlayMode, setOverlayMode] = useState<string>("no-color");
  const [overlayColor, setOverlayColor] = useState<string>("#3b82f6");

  // Dragging state
  const [dragging, setDragging] = useState<"A" | "B" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // File Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Global Dragging Effect
  useEffect(() => {
    if (!dragging) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

      if (dragging === "A") {
        setPointA({ x: Math.round(x), y: Math.round(y) });
      } else if (dragging === "B") {
        setPointB({ x: Math.round(x), y: Math.round(y) });
      }
    };

    const handleWindowPointerUp = () => {
      setDragging(null);
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
    };
  }, [dragging]);

  // Handle pointer down on nodes
  const handleNodePointerDown = (point: "A" | "B") => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(point);
  };

  // Gradient & Mask Calculations
  const dx = pointB.x - pointA.x;
  const dy = pointB.y - pointA.y;
  const angleDeg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI + 90);
  const dist = Math.round(Math.sqrt(dx * dx + dy * dy));

  const buildMaskOrGradient = (isColor: boolean) => {
    const colorA = isColor ? (overlayMode === 'darken' ? '#000000' : overlayMode === 'lighten' ? '#ffffff' : overlayColor) : '#000000';
    const colorB = isColor ? (overlayMode === 'darken' ? '#000000' : overlayMode === 'lighten' ? '#ffffff' : overlayColor) : '#000000';

    const stopA = isColor ? colorA : `rgba(0,0,0,${opacityA})`;
    const stopB = isColor ? colorB : `rgba(0,0,0,${opacityB})`;

    if (patternMode === "linear") {
      return `linear-gradient(${angleDeg}deg, ${stopA} 0%, ${stopB} 100%)`;
    }
    if (patternMode === "radial") {
      return `radial-gradient(circle at ${pointA.x}% ${pointA.y}%, ${stopA} 0%, ${stopB} ${Math.max(10, dist)}%)`;
    }
    if (patternMode === "square") {
      return `radial-gradient(square at ${pointA.x}% ${pointA.y}%, ${stopA} 0%, ${stopB} ${Math.max(10, dist)}%)`;
    }
    if (patternMode === "conic") {
      return `conic-gradient(from ${angleDeg}deg at ${pointA.x}% ${pointA.y}%, ${stopA} 0deg, ${stopB} 180deg, ${stopA} 360deg)`;
    }
    if (patternMode === "elliptical") {
      const rx = Math.max(10, Math.abs(dx));
      const ry = Math.max(10, Math.abs(dy));
      return `radial-gradient(ellipse ${rx * 2}% ${ry * 2}% at ${pointA.x}% ${pointA.y}%, ${stopA} 0%, ${stopB} 100%)`;
    }
    return `linear-gradient(${angleDeg}deg, ${stopA} 0%, ${stopB} 100%)`;
  };

  // Compute shape clip-path directly without scaling the underlying image!
  const buildShapeClipPath = (): string => {
    if (shape === "none") return "none";
    const s = shapeSize / 100;

    if (shape === "circle") {
      return `circle(${50 * s}% at 50% 50%)`;
    }
    if (shape === "ellipse") {
      return `ellipse(${50 * s}% ${35 * s}% at 50% 50%)`;
    }
    if (shape === "hexagon") {
      const scalePt = (x: number, y: number) => `${50 + (x - 50) * s}% ${50 + (y - 50) * s}%`;
      return `polygon(${scalePt(25, 5)}, ${scalePt(75, 5)}, ${scalePt(98, 50)}, ${scalePt(75, 95)}, ${scalePt(25, 95)}, ${scalePt(2, 50)})`;
    }
    if (shape === "star") {
      const scalePt = (x: number, y: number) => `${50 + (x - 50) * s}% ${50 + (y - 50) * s}%`;
      return `polygon(${scalePt(50, 0)}, ${scalePt(61, 35)}, ${scalePt(98, 35)}, ${scalePt(68, 57)}, ${scalePt(79, 91)}, ${scalePt(50, 70)}, ${scalePt(21, 91)}, ${scalePt(32, 57)}, ${scalePt(2, 35)}, ${scalePt(39, 35)})`;
    }
    return "none";
  };

  const maskCSS = buildMaskOrGradient(false);
  const colorCSS = buildMaskOrGradient(true);
  const clipPathCSS = buildShapeClipPath();

  // Download Output Canvas (Image remains 100% unscaled; shape clip scales from center)
  const handleDownload = () => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      const ax = (pointA.x / 100) * width;
      const ay = (pointA.y / 100) * height;
      const bx = (pointB.x / 100) * width;
      const by = (pointB.y / 100) * height;

      if (overlayMode === "no-color") {
        const imgCanvas = document.createElement("canvas");
        imgCanvas.width = width;
        imgCanvas.height = height;
        const ictx = imgCanvas.getContext("2d");

        if (ictx) {
          // Draw image at 100% exact size
          ictx.drawImage(img, 0, 0, width, height);

          // Apply opacity gradient mask
          ictx.globalCompositeOperation = "destination-in";
          let gradient: CanvasGradient;
          if (patternMode === "radial") {
            const radius = Math.max(10, Math.hypot(bx - ax, by - ay));
            gradient = ictx.createRadialGradient(ax, ay, 0, ax, ay, radius);
          } else {
            gradient = ictx.createLinearGradient(ax, ay, bx, by);
          }
          gradient.addColorStop(0, `rgba(0,0,0,${opacityA})`);
          gradient.addColorStop(1, `rgba(0,0,0,${opacityB})`);
          ictx.fillStyle = gradient;
          ictx.fillRect(0, 0, width, height);

          // Clip by shape mask centered on canvas
          ctx.save();
          if (shape !== "none") {
            const cx = width / 2;
            const cy = height / 2;
            const s = shapeSize / 100;
            ctx.translate(cx, cy);
            ctx.scale(s, s);
            ctx.translate(-cx, -cy);

            ctx.beginPath();
            if (shape === "circle") {
              ctx.arc(cx, cy, Math.min(width, height) * 0.5, 0, Math.PI * 2);
            } else if (shape === "ellipse") {
              ctx.ellipse(cx, cy, width * 0.5, height * 0.35, 0, 0, Math.PI * 2);
            } else if (shape === "hexagon") {
              ctx.moveTo(width * 0.25, height * 0.05);
              ctx.lineTo(width * 0.75, height * 0.05);
              ctx.lineTo(width * 0.98, height * 0.5);
              ctx.lineTo(width * 0.75, height * 0.95);
              ctx.lineTo(width * 0.25, height * 0.95);
              ctx.lineTo(width * 0.02, height * 0.5);
              ctx.closePath();
            } else if (shape === "star") {
              const points = 5;
              const outerR = Math.min(width, height) * 0.45;
              const innerR = outerR * 0.4;
              for (let i = 0; i < points * 2; i++) {
                const r = i % 2 === 0 ? outerR : innerR;
                const angle = (i * Math.PI) / points - Math.PI / 2;
                const x = cx + r * Math.cos(angle);
                const y = cy + r * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
              ctx.closePath();
            }
            ctx.clip();
          }

          ctx.drawImage(imgCanvas, 0, 0);
          ctx.restore();
        }
      } else {
        // COLOR TINT MODE
        ctx.save();
        ctx.drawImage(img, 0, 0, width, height);

        if (shape !== "none") {
          const cx = width / 2;
          const cy = height / 2;
          const s = shapeSize / 100;
          ctx.translate(cx, cy);
          ctx.scale(s, s);
          ctx.translate(-cx, -cy);

          ctx.beginPath();
          if (shape === "circle") {
            ctx.arc(cx, cy, Math.min(width, height) * 0.5, 0, Math.PI * 2);
          } else if (shape === "ellipse") {
            ctx.ellipse(cx, cy, width * 0.5, height * 0.35, 0, 0, Math.PI * 2);
          } else if (shape === "hexagon") {
            ctx.moveTo(width * 0.25, height * 0.05);
            ctx.lineTo(width * 0.75, height * 0.05);
            ctx.lineTo(width * 0.98, height * 0.5);
            ctx.lineTo(width * 0.75, height * 0.95);
            ctx.lineTo(width * 0.25, height * 0.95);
            ctx.lineTo(width * 0.02, height * 0.5);
            ctx.closePath();
          } else if (shape === "star") {
            const points = 5;
            const outerR = Math.min(width, height) * 0.45;
            const innerR = outerR * 0.4;
            for (let i = 0; i < points * 2; i++) {
              const r = i % 2 === 0 ? outerR : innerR;
              const angle = (i * Math.PI) / points - Math.PI / 2;
              const x = cx + r * Math.cos(angle);
              const y = cy + r * Math.sin(angle);
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
          }
          ctx.clip();
        }

        let color = overlayColor;
        if (overlayMode === "darken") color = "#000000";
        if (overlayMode === "lighten") color = "#ffffff";

        ctx.globalAlpha = Math.max(opacityA, opacityB);
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      // Download PNG
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `overlay-output-${width}x${height}-${Date.now()}.png`;
      a.click();
    };
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="font-outfit text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
              Image Layer & Opacity Studio
            </h1>
          </div>
          <p className="text-sm sm:text-base font-medium max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            Image scale is locked at 100%. Adjusting shape size resizes only the mask boundary, leaving your photo untouched.
          </p>
        </div>

        {/* Upload & Download Action Buttons */}
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 py-3 px-5 rounded-2xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-sm border border-blue-400/40 transition-all cursor-pointer shadow-lg"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Custom Image</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-bold text-sm border border-amber-300 transition-all cursor-pointer shadow-xl"
          >
            <Download className="w-4 h-4" />
            <span>Export Transparent PNG</span>
          </button>
        </div>
      </div>

      {/* Main Control Panel */}
      <div className="glass-panel p-6 rounded-3xl border border-amber-500/20 shadow-xl space-y-6">
        {/* Row 1: Points & Limits */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-blue-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Target className="w-4 h-4" /> Point A (Start)</span>
              <span className="font-mono">({pointA.x}%, {pointA.y}%)</span>
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-bold text-gray-300 mb-1">
                <span>Opacity at A:</span>
                <span className="text-blue-300 font-mono">{Math.round(opacityA * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={opacityA}
                onChange={e => setOpacityA(parseFloat(e.target.value))}
                className="w-full accent-blue-400 cursor-pointer h-2 bg-gray-700 rounded-lg"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-amber-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Target className="w-4 h-4" /> Point B (End)</span>
              <span className="font-mono">({pointB.x}%, {pointB.y}%)</span>
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-bold text-gray-300 mb-1">
                <span>Opacity at B:</span>
                <span className="text-amber-300 font-mono">{Math.round(opacityB * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={opacityB}
                onChange={e => setOpacityB(parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer h-2 bg-gray-700 rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <Sparkles className="w-4 h-4 text-amber-400" /> Pattern Distribution
            </label>
            <select
              value={patternMode}
              onChange={e => setPatternMode(e.target.value)}
              className="w-full bg-black/40 border border-white/15 text-white text-xs font-bold rounded-xl p-2.5 focus:border-amber-400 outline-none cursor-pointer"
            >
              <option value="linear">📏 Linear / Cylindrical (A ➔ B)</option>
              <option value="radial">⭕ Radial (Circle outward from A)</option>
              <option value="elliptical">🥚 Elliptical (Oval stretch)</option>
              <option value="conic">📐 Conic / Sweeping Fan</option>
              <option value="square">🔲 Square / Box Expansion</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              <span>Shape Mask Size</span>
              <span className="text-amber-400 font-mono text-xs">{shape === "none" ? "N/A (Disabled)" : `${shapeSize}%`}</span>
            </div>
            <input
              type="range"
              min="20"
              max="300"
              step="1"
              disabled={shape === "none"}
              value={shapeSize}
              onChange={e => setShapeSize(parseInt(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer h-2 bg-gray-700 rounded-lg disabled:opacity-30"
            />
          </div>
        </div>

        <div className="h-px bg-white/10" />

        {/* Row 2: Mode & Shape Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <Eye className="w-4 h-4 text-amber-400" /> Layer Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setOverlayMode("no-color")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  overlayMode === "no-color"
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-md"
                    : "bg-black/20 border-white/10 text-gray-400"
                }`}
              >
                💧 Pure Image Opacity
              </button>
              <button
                onClick={() => setOverlayMode("color")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  overlayMode === "color"
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-md"
                    : "bg-black/20 border-white/10 text-gray-400"
                }`}
              >
                🎨 Custom Color Tint
              </button>
              <button
                onClick={() => setOverlayMode("darken")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  overlayMode === "darken"
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-md"
                    : "bg-black/20 border-white/10 text-gray-400"
                }`}
              >
                🌙 Darken / Shadow
              </button>
              <button
                onClick={() => setOverlayMode("lighten")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  overlayMode === "lighten"
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-md"
                    : "bg-black/20 border-white/10 text-gray-400"
                }`}
              >
                ☀️ Lighten / Highlight
              </button>
            </div>
            {overlayMode === "color" && (
              <div className="flex items-center space-x-2 pt-2">
                <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>Color:</span>
                <input
                  type="color"
                  value={overlayColor}
                  onChange={e => setOverlayColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-white/20 cursor-pointer bg-transparent"
                />
              </div>
            )}
          </div>

          <div className="space-y-2 col-span-1 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <Sliders className="w-4 h-4 text-amber-400" /> Filter Shape Mask
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: 'none', icon: Square, label: 'None (Full Image)' },
                { id: 'circle', icon: Circle, label: 'Circle' },
                { id: 'ellipse', icon: Circle, label: 'Oval' },
                { id: 'hexagon', icon: Hexagon, label: 'Hexagon' },
                { id: 'star', icon: Star, label: 'Star' }
              ].map(item => {
                const Icon = item.icon;
                const isActive = shape === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setShape(item.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-lg scale-105 font-extrabold' 
                        : 'bg-black/20 border-white/10 text-gray-400 hover:border-amber-500/40'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span className="text-[10px] text-center leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Aspect Ratio Canvas Views */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Input Base Image Box */}
        <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="font-outfit font-bold text-sm tracking-wide" style={{ color: 'var(--text-primary)' }}>
              🖼️ Input Image (Uncropped)
            </span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all cursor-pointer"
            >
              Change Image
            </button>
          </div>

          <div 
            className="relative rounded-2xl overflow-hidden border border-white/10 shadow-inner flex items-center justify-center p-2 min-h-[250px] max-h-[500px]"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '16px 16px',
              backgroundColor: 'rgba(0,0,0,0.6)'
            }}
          >
            <img
              src={imageSrc}
              alt="Input base image"
              className="w-auto h-auto max-w-full max-h-[460px] object-contain rounded-xl"
            />
          </div>
        </div>

        {/* Output Result Canvas Box */}
        <div className="glass-panel p-5 rounded-3xl border border-amber-500/30 space-y-3 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between">
            <span className="font-outfit font-bold text-sm tracking-wide text-amber-400">
              ✨ Output Canvas (Image Scale Locked 100%)
            </span>
            <button
              onClick={handleDownload}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all cursor-pointer"
            >
              Export Transparent PNG
            </button>
          </div>

          <div 
            className="relative rounded-2xl overflow-hidden border border-amber-400/30 shadow-2xl flex items-center justify-center p-2 min-h-[250px] max-h-[500px]"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '16px 16px',
              backgroundColor: 'rgba(0,0,0,0.6)'
            }}
          >
            <div
              ref={containerRef}
              className="relative max-w-full max-h-[460px] inline-block select-none touch-none rounded-xl overflow-hidden"
            >
              {/* Output Rendering with Unscaled Image and Dynamic Clip-Path */}
              {overlayMode === "no-color" ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <div
                    className="relative w-full h-full"
                    style={{
                      WebkitMaskImage: maskCSS,
                      maskImage: maskCSS,
                      clipPath: clipPathCSS,
                    } as React.CSSProperties}
                  >
                    <img
                      src={imageSrc}
                      alt="Output pure opacity"
                      className="block w-auto h-auto max-w-full max-h-[460px] object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={imageSrc}
                    alt="Output tinted base"
                    className="block w-auto h-auto max-w-full max-h-[460px] object-contain"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className="w-full h-full"
                      style={{
                        background: colorCSS,
                        clipPath: clipPathCSS,
                        opacity: Math.max(opacityA, opacityB),
                        transition: 'background 0.2s ease',
                      } as React.CSSProperties}
                    />
                  </div>
                </div>
              )}

              {/* Vector Line */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <line
                  x1={`${pointA.x}%`}
                  y1={`${pointA.y}%`}
                  x2={`${pointB.x}%`}
                  y2={`${pointB.y}%`}
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              </svg>

              {/* Node A */}
              <div
                onPointerDown={handleNodePointerDown("A")}
                style={{ left: `${pointA.x}%`, top: `${pointA.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-blue-500 border-2 border-white shadow-xl flex items-center justify-center text-white font-extrabold text-xs cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
                title={`Point A: Opacity ${Math.round(opacityA * 100)}%`}
              >
                A
              </div>

              {/* Node B */}
              <div
                onPointerDown={handleNodePointerDown("B")}
                style={{ left: `${pointB.x}%`, top: `${pointB.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-amber-500 border-2 border-white shadow-xl flex items-center justify-center text-white font-extrabold text-xs cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
                title={`Point B: Opacity ${Math.round(opacityB * 100)}%`}
              >
                B
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

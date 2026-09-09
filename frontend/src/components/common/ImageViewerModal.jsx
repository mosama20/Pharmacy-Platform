import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  RefreshCw,
  Download,
  ExternalLink,
  Move,
} from 'lucide-react';

export const ImageViewerModal = ({
  isOpen,
  onClose,
  imageUrl,
  title = 'معاينة صورة الروشتة الطبية',
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // Reset transform state when image or open status changes
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageUrl]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleReset();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleRotate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, scale, rotation]);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.35, 4.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max(prev - 0.35, 0.75);
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Dragging logic
  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    if (scale <= 1 || e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y,
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Safe open in new window (using blob to avoid Chrome blocking top-frame data URL navigation)
  const handleOpenInNewTab = () => {
    if (!imageUrl) return;
    if (imageUrl.startsWith('data:')) {
      const win = window.open('');
      if (win) {
        win.document.write(
          `<html><head><title>معاينة الروشتة</title><style>body{margin:0;background:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh;}img{max-width:100%;max-height:100vh;object-contain;box-shadow:0 10px 30px rgba(0,0,0,0.5);}</style></head><body><img src="${imageUrl}" alt="Prescription" /></body></html>`
        );
        win.document.close();
      }
    } else {
      window.open(imageUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Safe download image
  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `chefaa-prescription-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
            <ZoomIn className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm sm:text-base leading-tight">
              {title}
            </h3>
            <span className="text-[11px] text-slate-300">
              استخدم عجلة الماوس أو الأزرار للتكبير والتدوير ووضوح خط الطبيب
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all text-xs font-medium flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
            title="تحميل الصورة بجودتها الأصلية"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">تحميل</span>
          </button>

          <button
            onClick={handleOpenInNewTab}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all text-xs font-medium flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
            title="فتح في نافذة كاملة جديدة"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">نافذة جديدة</span>
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition-all cursor-pointer backdrop-blur-xs mr-2"
            title="إغلاق (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Canvas / Viewport */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`w-full h-full flex items-center justify-center overflow-hidden p-6 relative ${
          scale > 1
            ? isDragging
              ? 'cursor-grabbing'
              : 'cursor-grab'
            : 'cursor-default'
        }`}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.18s cubic-bezier(0.2, 0, 0, 1)',
          }}
          className="max-w-[90vw] max-h-[82vh] flex items-center justify-center origin-center"
        >
          <img
            src={imageUrl}
            alt="Prescription Large"
            draggable={false}
            className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10 pointer-events-none"
          />
        </div>
      </div>

      {/* Floating Interactive Controls Toolbar */}
      <div className="absolute bottom-6 z-20 flex items-center gap-1.5 sm:gap-2 p-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md text-white">
        <button
          onClick={handleZoomOut}
          disabled={scale <= 0.8}
          className="p-2.5 rounded-xl hover:bg-white/10 text-slate-200 hover:text-white transition-all disabled:opacity-30 cursor-pointer"
          title="تصغير (-)"
        >
          <ZoomOut className="w-5 h-5" />
        </button>

        <div className="px-3 py-1 font-mono text-xs font-bold text-teal-400 min-w-[54px] text-center bg-black/40 rounded-lg">
          {Math.round(scale * 100)}%
        </div>

        <button
          onClick={handleZoomIn}
          disabled={scale >= 4.5}
          className="p-2.5 rounded-xl hover:bg-white/10 text-slate-200 hover:text-white transition-all disabled:opacity-30 cursor-pointer"
          title="تكبير (+)"
        >
          <ZoomIn className="w-5 h-5" />
        </button>

        <div className="w-[1px] h-5 bg-slate-700 mx-1" />

        <button
          onClick={handleRotate}
          className="p-2.5 rounded-xl hover:bg-white/10 text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1"
          title="تدوير الصورة 90 درجة (R)"
        >
          <RotateCw className="w-5 h-5" />
          {rotation > 0 && (
            <span className="text-[10px] font-mono text-amber-400">{rotation}°</span>
          )}
        </button>

        <button
          onClick={handleReset}
          className="p-2.5 rounded-xl hover:bg-white/10 text-slate-200 hover:text-white transition-all cursor-pointer"
          title="إعادة الضبط للحجم الأصلي (0)"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        {scale > 1 && (
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 px-2">
            <Move className="w-3.5 h-3.5 text-teal-400" />
            <span>اسحب للتحريك</span>
          </div>
        )}
      </div>
    </div>
  );
};

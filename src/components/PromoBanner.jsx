import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PromoBanner({ title, subtitle, buttonText, buttonLink, imageUrl, active }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = imageUrl ? [imageUrl, imageUrl] : [];

  useEffect(() => {
    if (images.length === 0) return;
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  if (!active) return null;

  const handlePrev = (e) => {
    e.preventDefault();
    setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (e) => {
    e.preventDefault();
    setCurrentImageIndex(prev => (prev + 1) % images.length);
  };

  return (
    <section className="max-w-7xl mx-auto px-6 py-8">
      <div
        className="relative overflow-hidden flex items-center min-h-[180px] md:min-h-[220px] group"
        style={{ border: '3px solid #1B2A4A', boxShadow: '5px 5px 0 #E8622A' }}
      >
        {/* Background image with fade transition */}
        {images.length > 0 && (
          <img
            src={images[currentImageIndex]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
          />
        )}

        {/* Dark overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: images.length > 0
              ? 'linear-gradient(90deg, rgba(27,42,74,0.92) 50%, rgba(27,42,74,0.3) 100%)'
              : 'linear-gradient(135deg, #1B2A4A 0%, #2d4070 100%)',
          }}
        />

        {/* Diagonal stripe accent */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #E8622A 0px, #E8622A 2px, transparent 2px, transparent 20px)'
        }} />

        {/* Content */}
        <div className="relative z-10 px-8 py-6 flex-1">
          {/* Label */}
          <div className="inline-flex items-center gap-1.5 bg-[#E8622A] text-white px-3 py-1 text-xs font-heading font-bold uppercase tracking-widest mb-3">
            <Zap className="w-3 h-3" />
            מבצע מיוחד
          </div>

          <h2 className="font-heading font-black text-white text-2xl md:text-4xl uppercase leading-tight mb-2">
            {title || 'מבצע ענק על חולצות סייל'}
          </h2>
          <p className="font-body text-white/70 text-sm md:text-base mb-5 max-w-md">
            {subtitle || 'הנחות מיוחדות על מאות חולצות — לזמן מוגבל בלבד!'}
          </p>

          <Link
            to={buttonLink || '/catalog?sale=true'}
            className="inline-block bg-[#E8622A] text-white font-heading font-black text-sm px-6 py-3 uppercase tracking-wide hover:bg-[#D0551F] transition-colors"
            style={{ boxShadow: '3px 3px 0 rgba(255,255,255,0.3)' }}
          >
            {buttonText || 'לחולצות הסייל ←'}
          </Link>
        </div>

        {/* Right decorative element (desktop only) */}
        <div className="hidden md:flex flex-col items-center justify-center pr-12 relative z-10 gap-2">
          <div className="font-mono font-black text-[#E8622A] text-6xl leading-none drop-shadow-lg">
            %
          </div>
          <div className="font-heading text-white/65 text-xs uppercase tracking-widest">SALE</div>
        </div>

        {/* Navigation arrows - RTL adapted */}
        {images.length > 1 && (
          <>
            <button
              onClick={handleNext}
              className="absolute top-1/2 -translate-y-1/2 right-4 z-20 w-10 h-10 flex items-center justify-center bg-[#E8622A]/80 text-white hover:bg-[#E8622A] transition-colors rounded-full"
              aria-label="הבא"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={handlePrev}
              className="absolute top-1/2 -translate-y-1/2 left-4 z-20 w-10 h-10 flex items-center justify-center bg-[#E8622A]/80 text-white hover:bg-[#E8622A] transition-colors rounded-full"
              aria-label="הקודם"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#1B2A4A] text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-[#E8622A] px-2.5 py-1 font-heading font-bold text-white text-lg leading-tight">
                <div>LAB</div>
                <div>JERSEY</div>
              </div>
            </div>
            <p className="text-sm text-white/80 leading-relaxed font-body">
              חולצות כדורגל איכותיות, נדירות ובמחירים טובים.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-bold text-sm mb-4 text-[#E8622A] uppercase tracking-widest">דף הבית</h4>
            <div className="space-y-2">
              <Link to="/" className="block text-sm text-white/80 hover:text-white hover:translate-x-1 transition-all duration-200 font-body">דף הבית</Link>
              <Link to="/catalog" className="block text-sm text-white/80 hover:text-white hover:translate-x-1 transition-all duration-200 font-body">קטלוג</Link>
              <Link to="/faq" className="block text-sm text-white/80 hover:text-white hover:translate-x-1 transition-all duration-200 font-body">שאלות ותשובות</Link>
              <Link to="/size-guide" className="block text-sm text-white/80 hover:text-white hover:translate-x-1 transition-all duration-200 font-body">מדריך מידות</Link>
            </div>
          </div>

          {/* Catalog */}
          <div>
            <h4 className="font-heading font-bold text-sm mb-4 text-[#E8622A] uppercase tracking-widest">קטלוג</h4>
            <div className="space-y-2">
              <Link to="/catalog?gender=men" className="block text-sm text-white/80 hover:text-white hover:translate-x-1 transition-all duration-200 font-body">חולצות גברים</Link>
              <Link to="/catalog?sale=true" className="block text-sm text-white/80 hover:text-white hover:translate-x-1 transition-all duration-200 font-body">סייל</Link>
              <Link to="/catalog?new=true" className="block text-sm text-white/80 hover:text-white hover:translate-x-1 transition-all duration-200 font-body">חדשים</Link>
              <Link to="/size-guide" className="block text-sm text-white/80 hover:text-white hover:translate-x-1 transition-all duration-200 font-body">מדריך מידות</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-bold text-sm mb-4 text-[#E8622A] uppercase tracking-widest">צור קשר</h4>
            <div className="space-y-2">
              <Link to="/faq" className="block text-sm text-white/80 hover:text-white hover:translate-x-1 transition-all duration-200 font-body">שאלות ותשובות</Link>
              <Link to="/contact" className="block text-sm text-white/80 hover:text-white hover:translate-x-1 transition-all duration-200 font-body">צור קשר</Link>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 mt-10 pt-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <a
              href="https://instagram.com/Jerseylabil"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-9 h-9 flex items-center justify-center border border-white/20 hover:bg-[#E8622A] hover:border-[#E8622A] transition-colors"
            >
              <Instagram className="w-4 h-4 text-white" />
            </a>
          </div>
          <p className="text-center text-xs text-white/65 font-body">© {new Date().getFullYear()} JerseyLab. כל הזכיות שמורות.</p>
        </div>
      </div>
    </footer>
  );
}
import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';
import { COLLECTIONS } from '@/lib/collections';
import { LEGAL_PAGES } from '@/components/LegalPage';

// The collections worth linking from every page on the site. Sitewide links
// are what give these landing pages enough internal weight to be crawled
// often, instead of sitting reachable only from each other.
const FOOTER_COLLECTIONS = ['retro', 'national-teams', 'israeli-league', 'la-liga', 'premier-league']
  .map(slug => COLLECTIONS.find(c => c.slug === slug))
  .filter(Boolean);

export default function Footer() {
  return (
    <footer className="bg-brand-navy text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-brand-orange px-2.5 py-1 font-heading font-bold text-white text-lg leading-tight">
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
            <h4 className="font-heading font-bold text-sm mb-4 text-brand-orange uppercase tracking-widest">דף הבית</h4>
            <div className="space-y-2">
              <Link to="/" className="block text-sm text-white/80 hover:text-white hover:translate-x-1 transition-all duration-200 font-body">דף הבית</Link>
              <Link to="/catalog" className="block text-sm text-white/80 hover:text-white hover:translate-x-1 transition-all duration-200 font-body">קטלוג</Link>
              <Link to="/faq" className="block text-sm text-white/80 hover:text-white hover:translate-x-1 transition-all duration-200 font-body">שאלות ותשובות</Link>
              <Link to="/size-guide" className="block text-sm text-white/80 hover:text-white hover:translate-x-1 transition-all duration-200 font-body">מדריך מידות</Link>
            </div>
          </div>

          {/* Catalog */}
          <div>
            <h4 className="font-heading font-bold text-sm mb-4 text-brand-orange uppercase tracking-widest">קטלוג</h4>
            <div className="space-y-2">
              {FOOTER_COLLECTIONS.map(c => (
                <Link key={c.slug} to={`/collections/${c.slug}`}
                  className="block text-sm text-white/80 hover:text-white hover:translate-x-1 transition-all duration-200 font-body">
                  חולצות {c.name}
                </Link>
              ))}
              <Link to="/mystery-box" className="block text-sm text-white/80 hover:text-white hover:translate-x-1 transition-all duration-200 font-body">מיסטרי בוקס</Link>
              <Link to="/request-shirt" className="block text-sm text-white/80 hover:text-white hover:translate-x-1 transition-all duration-200 font-body">בקשת חולצה</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-bold text-sm mb-4 text-brand-orange uppercase tracking-widest">צור קשר</h4>
            <div className="space-y-2">
              <Link to="/faq" className="block text-sm text-white/80 hover:text-white hover:translate-x-1 transition-all duration-200 font-body">שאלות ותשובות</Link>
              <Link to="/contact" className="block text-sm text-white/80 hover:text-white hover:translate-x-1 transition-all duration-200 font-body">צור קשר</Link>
            </div>
          </div>
        </div>

        {/* Legal. Regulation 35 requires the accessibility statement to be
            reachable from every page, and consumer law requires the business
            details to be published; the footer is where both belong. */}
        <nav className="border-t border-white/10 mt-10 pt-6" aria-label="מידע משפטי">
          <h4 className="font-heading font-bold text-sm mb-3 text-brand-orange uppercase tracking-widest">מידע משפטי</h4>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {LEGAL_PAGES.map(p => (
              <Link key={p.path} to={p.path}
                className="text-sm text-white/75 hover:text-white hover:underline transition-colors font-body">
                {p.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/10 mt-6 pt-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <a
              href="https://instagram.com/Jerseylabil"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-9 h-9 flex items-center justify-center border border-white/20 hover:bg-brand-orange hover:border-brand-orange transition-colors"
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
import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, MessageCircle, Accessibility } from 'lucide-react';
import { OPEN_A11Y_EVENT } from '@/lib/accessibilityPrefs';
import Disclosure from '@/components/shop/Disclosure';
import { COLLECTIONS } from '@/lib/collections';
import { LEGAL_PAGES } from '@/components/LegalPage';
import { withStock } from '@/lib/catalogFacets';
import { SHOP_PHONE, WHATSAPP_URL, INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/lib/contact';

// The collections worth linking from every page on the site. Sitewide links
// are what give these landing pages enough internal weight to be crawled
// often, instead of sitting reachable only from each other.
const FOOTER_COLLECTIONS = withStock(
  ['retro', 'national-teams', 'israeli-league', 'la-liga', 'premier-league', 'serie-a']
    .map(slug => COLLECTIONS.find(c => c.slug === slug))
    .filter(Boolean)
    .map(c => ({ label: `חולצות ${c.name}`, href: `/collections/${c.slug}` })),
);

const SHOP_LINKS = withStock([
  { label: 'כל החולצות', href: '/catalog' },
  { label: 'חדשים באתר', href: '/catalog?new=true' },
  { label: 'מלאי בארץ', href: '/catalog?fast=true' },
  { label: 'מיסטרי בוקס', href: '/mystery-box' },
  { label: 'בקשת חולצה', href: '/request-shirt' },
]);

const HELP_LINKS = [
  { label: 'שאלות ותשובות', href: '/faq' },
  { label: 'צור קשר', href: '/contact' },
  { label: 'מדריך מידות', href: '/size-guide' },
  { label: 'משלוחים והחזרות', href: '/legal/shipping' },
];

// Regulation 35 requires the accessibility statement to be reachable from
// every page, and consumer law requires the business details to be published;
// the footer is where both belong.
const LEGAL_LINKS = LEGAL_PAGES.map(p => ({ label: p.label, href: p.path }));

function Column({ title, links }) {
  return (
    <>
      {/* Phone: a row that opens, as the big club stores do, instead of four
          lists of links stacked down the screen. */}
      <Disclosure title={title} variant="dark" className="sm:hidden">
        <nav aria-label={title}>
          <ul className="space-y-3 pb-1">
            {links.map(link => (
              <li key={link.href}>
                <Link to={link.href} className="text-[15px] text-white/70 transition hover:text-white">{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </Disclosure>
      <nav aria-label={title} className="hidden sm:block">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <ul className="mt-5 space-y-3">
          {links.map(link => (
            <li key={link.href}>
              <Link to={link.href} className="text-[15px] text-white/65 transition hover:text-white">{link.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

function ContactButton({ href, icon: Icon, label, value }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex min-h-[3.25rem] items-center gap-3 rounded-xl border border-white/25 px-5 transition hover:border-white/60 hover:bg-white/5">
      <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
      <span className="text-start leading-tight">
        <span className="block text-[11px] text-white/60">{label}</span>
        <span dir="ltr" className="block text-[15px] font-semibold">{value}</span>
      </span>
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="mt-20 bg-brand-navy text-white">
      <div className="shop-container pb-12 pt-14 lg:pt-20">
        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-10 lg:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.4fr)] lg:gap-8">
          <Column title="חנות" links={SHOP_LINKS} />
          <Column title="קטגוריות" links={FOOTER_COLLECTIONS} />
          <Column title="עזרה" links={HELP_LINKS} />
          <Column title="מידע משפטי" links={LEGAL_LINKS} />

          <div className="mt-5 flex flex-col justify-center rounded-3xl bg-white/[0.07] p-7 sm:col-span-2 sm:mt-0 lg:col-span-1 lg:p-9">
            <h2 className="text-2xl font-semibold leading-tight">לא מצאתם את החולצה?</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-white/70">
              שלחו לנו תמונה או תיאור, ונבדוק אם אפשר להשיג אותה ובכמה.
            </p>
            <Link to="/request-shirt"
              className="mt-6 inline-flex min-h-[3.25rem] items-center justify-center rounded-2xl bg-white px-6 text-[15px] font-semibold text-brand-orange-ink transition hover:bg-brand-orange-soft">
              בקשת חולצה
            </Link>
          </div>
        </div>

        <div className="mt-14 text-center">
          <p className="text-base font-semibold">דברו איתנו</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <ContactButton href={WHATSAPP_URL} icon={MessageCircle} label="וואטסאפ" value={SHOP_PHONE} />
            <ContactButton href={INSTAGRAM_URL} icon={Instagram} label="אינסטגרם" value={`@${INSTAGRAM_HANDLE}`} />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="shop-container flex flex-col items-center gap-5 py-6 sm:flex-row sm:justify-between">
          <Link to="/" aria-label="JerseyLab - דף הבית" className="rounded-lg">
            <img src="/logo-navbar.png" alt="JerseyLab" width="391" height="128" loading="lazy" className="h-10 w-auto" />
          </Link>
          <p className="order-last text-[13px] text-white/55 sm:order-none">
            © {new Date().getFullYear()} JerseyLab. כל הזכויות שמורות.
          </p>
          <div className="flex items-center gap-1">
            {/* Opens the accessibility menu - the way back in for a visitor who
                hid its tab at the edge of the screen. */}
            <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_A11Y_EVENT))}
              className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-full px-3 text-[13px] text-white/75 transition hover:bg-white/10 hover:text-white">
              <Accessibility className="h-5 w-5" aria-hidden="true" />
              תפריט נגישות
            </button>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="JerseyLab באינסטגרם"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-white/10">
              <Instagram className="h-5 w-5" />
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="JerseyLab בוואטסאפ"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-white/10">
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

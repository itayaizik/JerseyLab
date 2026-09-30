import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PackageSearch } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SectionHeader from '@/components/shop/SectionHeader';
import ProductRail from '@/components/shop/ProductRail';
import { t } from '@/lib/i18n';
import { term } from '@/lib/english';
import { resized } from '@/lib/imageUrl';

// The Israelis abroad, a player at a time.
//
// The shop carries a shirt for each season an Israeli spent at a club abroad,
// and those shirts are spread across a dozen clubs - unfindable unless you
// already know that Benayoun was at Chelsea in 2010. Here the player is the
// way in, and the shirts follow.
//
// The list of players is its own table rather than something derived from the
// catalogue (supabase/legionnaires.sql). A player with no shirt yet still gets
// a chip, because "we have not got to him yet" is worth saying out loud: it
// tells a fan we know who he is, and it tells us what to buy next when they
// ask.

export default function LegionnairesSection({ title, shirts = [], user, wishlistIds = [], onToggleWishlist }) {
  const [players, setPlayers] = useState([]);
  const [activeName, setActiveName] = useState('');

  useEffect(() => {
    let cancelled = false;
    base44.entities.Legionnaire.filter({ active: true }, 'sort_order', 40)
      .then(rows => { if (!cancelled) setPlayers(rows); })
      // A table that does not exist yet, or a failed request, hides the
      // section rather than breaking the page around it.
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // A player's shirts are the ones whose player_name is his name, which is
  // what the admin page tells the owner to keep in step.
  const byPlayer = useMemo(() => {
    const map = new Map();
    for (const shirt of shirts) {
      const name = String(shirt.player_name || '').trim();
      if (!name) continue;
      if (!map.has(name)) map.set(name, []);
      map.get(name).push(shirt);
    }
    return map;
  }, [shirts]);

  // Whoever the owner put first, unless he has nothing behind him and someone
  // else does: the section should open on shirts.
  const firstWithShirts = players.find(p => (byPlayer.get(p.name) || []).length > 0);
  const active = players.find(p => p.name === activeName) || firstWithShirts || players[0] || null;
  const activeShirts = active ? byPlayer.get(active.name) || [] : [];

  if (!players.length) return null;

  return (
    <section className="mt-16 sm:mt-24" aria-labelledby="legionnaires-heading">
      <div className="shop-container">
        <SectionHeader
          id="legionnaires-heading"
          title={title || t('הלגיונרים', 'Israelis abroad')}
          subtitle={t('החולצות של הישראלים בחו״ל, מהעונות שבהן הם באמת שיחקו שם.',
                      'Shirts of the Israelis playing abroad, from the seasons they were actually there.')}
        />

        {/* Wrapped and centred once there is room, and a single scrolling line
            on a phone. Faces this size wrap to one per row on a 375px screen,
            which put five rows of chips between the heading and the shirts -
            the section would have pushed what it is selling off the screen. */}
        <div role="tablist" aria-label={t('בחירת שחקן', 'Choose a player')}
          className="scrollbar-hide -mx-4 mt-6 flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-x-visible sm:px-0">
          {players.map(player => {
            const count = (byPlayer.get(player.name) || []).length;
            const selected = active?.id === player.id;
            return (
              <button key={player.id} type="button" role="tab"
                id={`legionnaire-tab-${player.id}`} aria-selected={selected} aria-controls="legionnaire-panel"
                onClick={() => setActiveName(player.name)}
                className={`shop-chip min-h-[4.5rem] flex-shrink-0 snap-start ${player.image_url ? 'ps-1.5 pe-6' : 'px-6'} ${selected ? 'shop-chip-active' : ''}`}>
                {/* A face, when the owner has uploaded one. Every chip is the
                    taller height whether it carries a photo or not, so a row of
                    players with and without still lines up.
                    `object-top`, because these are head-and-shoulders portraits
                    with the head in the upper third: a square crop taken from
                    the middle of one cuts the face off at the eyebrows. */}
                {player.image_url && (
                  <img src={resized(player.image_url, 192)} alt="" loading="lazy" width="64" height="64"
                    className="h-16 w-16 flex-shrink-0 rounded-full bg-brand-mist object-cover object-top" />
                )}
                {term(player.name)}
                {count > 0 && <span className="tabular-nums text-brand-navy/45">{count}</span>}
              </button>
            );
          })}
        </div>

        <div id="legionnaire-panel" role="tabpanel"
          aria-labelledby={active ? `legionnaire-tab-${active.id}` : undefined} className="mt-8 sm:mt-10">
          {activeShirts.length > 0 ? (
            <ProductRail shirts={activeShirts} user={user} wishlistIds={wishlistIds}
              onToggleWishlist={onToggleWishlist} label={term(active.name)} />
          ) : active && (
            // Not a dead end: a player we have nothing for is a question the
            // shopper can answer for us.
            <div className="flex flex-col items-start justify-between gap-5 rounded-3xl bg-brand-mist p-7 sm:flex-row sm:items-center sm:p-9">
              <div className="flex items-center gap-4">
                {active.image_url && (
                  <img src={resized(active.image_url, 384)} alt="" loading="lazy" width="128" height="128"
                    className="h-28 w-28 flex-shrink-0 rounded-full bg-white object-cover object-top sm:h-32 sm:w-32" />
                )}
                <div>
                <p className="text-[17px] font-semibold text-brand-navy">
                  {t(`עוד אין לנו חולצה של ${active.name}`, `We don't have a ${term(active.name)} shirt yet`)}
                </p>
                <p className="mt-1.5 max-w-lg text-[15px] leading-relaxed text-brand-navy/65">
                  {active.club
                    ? t(`הוא משחק ב${term(active.club)}. בקשו ונבדוק אם אפשר להשיג.`,
                        `He plays for ${term(active.club)}. Ask us and we'll see what we can get.`)
                    : t('בקשו ונבדוק אם אפשר להשיג.', "Ask us and we'll see what we can get.")}
                </p>
                </div>
              </div>
              <Link to="/request-shirt" className="shop-btn flex-shrink-0">
                <PackageSearch className="h-5 w-5" aria-hidden="true" />
                {t('בקשת חולצה', 'Request a shirt')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

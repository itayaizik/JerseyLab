// The two messages the shop keeps meaning to send and forgets.
//
// Both are the same shape: something changed in the data that gives a reason
// to write to someone who already asked to hear from us, and nobody notices
// because noticing means remembering to go and look.
//
// Neither sends anything by itself. They find the people worth writing to and
// hand over the message ready to go, because every one of these is a real
// person who is owed a sentence written for them rather than a mailshot - and
// because a shop run by one person should never send on its own.

import { SITE_ORIGIN } from '@/lib/siteUrl';
import { shirtPath } from '@/lib/shirtSlug';
import { dateSortValue } from '@/lib/dates';

const firstNameOf = (fullName) => (fullName || '').trim().split(/\s+/)[0] || '';

// Club names arrive typed by hand on one side and chosen from a list on the
// other, so "ריאל מדריד " and "ריאל-מדריד" have to meet somewhere.
const normalise = (value) => String(value || '')
  .toLowerCase()
  .replace(/[׳״'"’.\-_]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

// Seasons are written "2024/25", "24/25", "2024-25" and sometimes just
// "2024". Compared on their digits, those are all the same season.
const seasonDigits = (value) => String(value || '').replace(/\D/g, '');

const seasonsAgree = (wanted, shirtSeason) => {
  const a = seasonDigits(wanted);
  const b = seasonDigits(shirtSeason);
  // Nothing asked for means anything will do.
  if (!a) return true;
  if (!b) return false;
  return a === b || a.includes(b) || b.includes(a);
};

// ---------------------------------------------------------------------------
// 1. The shirt you asked for is here
// ---------------------------------------------------------------------------

// A request is still open while nobody has closed it, and a shirt answers it
// when it is the same club, the season does not contradict, and it went up
// after they asked. That last part is what makes this a notification rather
// than a list of things they could already have found themselves.
export function matchRequestsToShirts(requests, shirts) {
  const available = (shirts || []).filter(s => s.status === 'available');

  return (requests || [])
    .filter(r => r.status !== 'closed')
    .map(request => {
      const askedClub = normalise(request.club);
      if (!askedClub) return null;
      const askedAt = dateSortValue(request.created_date);

      const matches = available.filter(shirt => {
        const shirtClub = normalise(shirt.club) || normalise(shirt.national_team);
        if (!shirtClub) return false;
        const sameClub = shirtClub === askedClub
          || shirtClub.includes(askedClub)
          || askedClub.includes(shirtClub);
        if (!sameClub) return false;
        if (!seasonsAgree(request.season, shirt.season)) return false;
        // Added since they asked. A shirt that was already on the site when
        // the request came in is not news, and telling them it is would read
        // as if nobody had read their message.
        return dateSortValue(shirt.created_date) >= askedAt;
      });

      return matches.length ? { request, matches } : null;
    })
    .filter(Boolean);
}

export function shirtArrivedText({ request, shirt }) {
  const firstName = firstNameOf(request?.full_name);
  const what = [shirt?.club || shirt?.national_team, shirt?.season].filter(Boolean).join(' ') || shirt?.name;
  const size = request?.wanted_size ? ` במידה ${request.wanted_size}` : '';
  return [
    `היי${firstName ? ` ${firstName}` : ''}, כאן JerseyLab 👋`,
    `ביקשת מאיתנו חולצה של ${request?.club || what} - היא הגיעה 🙌`,
    `${shirt?.name || what}${size ? `, ושאלת על${size.replace(' במידה', ' מידה')}` : ''}`,
    `${SITE_ORIGIN}${shirtPath(shirt)}`,
    '',
    'אם זו לא בדיוק זו שחיפשת, תגידו ונמשיך לחפש.',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// 2. The review nobody asked for
// ---------------------------------------------------------------------------

// A closed order is one that arrived. Two weeks later the shirt has been worn,
// which is the moment a review is worth asking for - earlier and there is
// nothing to say, much later and the order is forgotten.
export const REVIEW_WAIT_DAYS = 14;

// Orders that are closed, old enough, and have never had an invite opened -
// or had one sent and never used. The second group is the one worth a nudge:
// they were asked once and it slipped.
export function ordersAwaitingReview(orderGroups, invites, { waitDays = REVIEW_WAIT_DAYS } = {}) {
  const cutoff = Date.now() - waitDays * 24 * 60 * 60 * 1000;

  return (orderGroups || [])
    .filter(group => group.status === 'closed')
    .filter(group => dateSortValue(group.closedAt || group.created_date) <= cutoff)
    .map(group => {
      const invite = invites?.[group.orderKey];
      // Already reviewed. Nothing owed, and asking again would be rude.
      if (invite?.used_at) return null;
      return { ...group, invite: invite || null, reminded: !!invite };
    })
    .filter(Boolean);
}

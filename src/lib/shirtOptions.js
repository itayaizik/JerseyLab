// Which extras a shirt can be ordered with.
//
// Israeli Premier League shirts come in one version and without league
// patches, and retro shirts are made in the fan version only. The product page
// and quick add both ask here, so a shirt cannot offer an option in one and not
// the other.

// Clubs used when a shirt has no league filled in. A shirt whose league is set
// goes by its league: an Israeli club's Champions League shirt is not a
// Premier League one.
const ISRAELI_LEAGUE_CLUBS = ['ביתר ירושלים', 'הפועל באר שבע', 'הפועל תל אביב', 'מכבי חיפה', 'מכבי תל אביב'];

export function isIsraeliLeagueShirt(shirt) {
  const league = String(shirt?.league || '').trim();
  if (league) return league === 'ליגת העל';
  return ISRAELI_LEAGUE_CLUBS.includes(String(shirt?.club || '').trim());
}

export const allowsPlayerVersion = (shirt) => !shirt?.is_retro && !isIsraeliLeagueShirt(shirt);

export const allowsPatches = (shirt) => !isIsraeliLeagueShirt(shirt);

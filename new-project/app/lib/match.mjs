// Who is "the right person"? v1 rule: tag overlap in both directions.
// What they offer that I seek counts double, because the needle should
// favour people who can help me, then people I can help.

export const normTags = (v) =>
  [...new Set((Array.isArray(v) ? v : String(v ?? '').split(','))
    .map((t) => String(t).trim().toLowerCase())
    .filter(Boolean))].slice(0, 8).map((t) => t.slice(0, 30));

export function matchScore(me, other) {
  const theyOffer = new Set(other.offers);
  const theySeek = new Set(other.seeks);
  const helpsMe = me.seeks.filter((t) => theyOffer.has(t));
  const iHelp = me.offers.filter((t) => theySeek.has(t));
  return { score: helpsMe.length * 2 + iHelp.length, helpsMe, iHelp };
}

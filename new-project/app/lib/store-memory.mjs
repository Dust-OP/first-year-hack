// In-memory store: the default, so the demo runs with no account anywhere.
// Same interface as store-snowflake.mjs. State is lost on restart.

import { distanceM, bearingDeg } from './geo.mjs';

export function createMemoryStore() {
  const users = new Map(); // id -> user
  const byToken = new Map(); // tokenHash -> id
  const bySub = new Map(); // Logto user id -> id
  const locations = new Map(); // userId -> { lat, lon, accuracy, updatedMs }
  const requests = new Map(); // id -> request

  return {
    kind: 'memory',

    async createUser(user) {
      users.set(user.id, user);
      if (user.tokenHash) byToken.set(user.tokenHash, user.id);
      if (user.sub) bySub.set(user.sub, user.id);
      return user;
    },
    async getUserBySub(sub) {
      return users.get(bySub.get(sub)) ?? null;
    },
    /** A new sign-in replaces the previous session token. */
    async setUserToken(id, tokenHash) {
      const u = users.get(id);
      if (!u) return;
      byToken.delete(u.tokenHash);
      u.tokenHash = tokenHash;
      byToken.set(tokenHash, id);
    },
    async updateUser(id, patch) {
      const u = users.get(id);
      if (u) Object.assign(u, patch);
      return u ?? null;
    },
    async getUserByTokenHash(hash) {
      return users.get(byToken.get(hash)) ?? null;
    },
    async getUsers(ids) {
      return ids.map((id) => users.get(id)).filter(Boolean);
    },

    async setLocation(userId, { lat, lon, accuracy, updatedMs }) {
      locations.set(userId, { lat, lon, accuracy, updatedMs });
    },
    async clearLocation(userId) {
      locations.delete(userId);
    },
    /** People with a fresh location within radiusM of `at`, nearest first. */
    async nearby(userId, at, radiusM, freshAfterMs) {
      const out = [];
      for (const [id, loc] of locations) {
        if (id === userId || loc.updatedMs <= freshAfterMs) continue;
        const d = distanceM(at, loc);
        if (d > radiusM) continue;
        out.push({ user: users.get(id), accuracy: loc.accuracy, distanceM: d, bearingDeg: bearingDeg(at, loc) });
      }
      return out.sort((a, b) => a.distanceM - b.distanceM).slice(0, 50);
    },

    async createRequest(req) {
      requests.set(req.id, req);
      return req;
    },
    async getRequest(id) {
      return requests.get(id) ?? null;
    },
    async setRequestStatus(id, status, respondedMs) {
      const r = requests.get(id);
      if (r) Object.assign(r, { status, respondedMs });
      return r ?? null;
    },
    async requestsFor(userId) {
      return [...requests.values()].filter((r) => r.fromId === userId || r.toId === userId);
    },
  };
}

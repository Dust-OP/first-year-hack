// In-memory store: the default, so the demo runs with no account anywhere.
// Same interface as store-snowflake.mjs. State is lost on restart.

import { distanceM, bearingDeg } from './geo.mjs';

export function createMemoryStore() {
  const users = new Map(); // id -> user
  const byToken = new Map(); // tokenHash -> id
  const bySub = new Map(); // sign-in identity (Logto user id, or "linkedin|<sub>") -> id
  const locations = new Map(); // userId -> { lat, lon, accuracy, updatedMs }
  const requests = new Map(); // id -> request
  const linkedinProfiles = new Map(); // userId -> what LinkedIn told us about that user
  const photos = new Map(); // userId -> the photo they picked (JPEG data URL)

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

    // What LinkedIn returned at sign-in, one record per user, kept apart from the app's own
    // profile so it can be read by a later job and deleted on its own.
    /** Insert or refresh. `fields` is linkedinRecord() plus `profileUrl`; the first-seen time survives a refresh. */
    async saveLinkedinProfile(userId, fields, atMs) {
      const old = linkedinProfiles.get(userId);
      const rec = { userId, ...fields, profileUrl: fields.profileUrl ?? null, firstSeenMs: old?.firstSeenMs ?? atMs, lastRefreshedMs: atMs };
      linkedinProfiles.set(userId, rec);
      return rec;
    },
    async getLinkedinProfile(userId) {
      return linkedinProfiles.get(userId) ?? null;
    },
    /** The linkedin.com/in/ address the user typed: LinkedIn itself does not tell us. */
    async setLinkedinProfileUrl(userId, profileUrl) {
      const rec = linkedinProfiles.get(userId);
      if (rec) rec.profileUrl = profileUrl;
    },
    async deleteLinkedinProfile(userId) {
      linkedinProfiles.delete(userId);
    },
    /** Every record, oldest first: the reading side for a later processing job. */
    async listLinkedinProfiles() {
      return [...linkedinProfiles.values()].sort((a, b) => a.firstSeenMs - b.firstSeenMs);
    },

    /**
     * Deletes one account and everything linked to it: position, invitations sent or received,
     * LinkedIn record, picked photo, sign-in links and the profile itself. Returns false if unknown.
     */
    async deleteUser(userId) {
      if (!users.has(userId)) return false;
      locations.delete(userId);
      for (const [id, r] of requests) if (r.fromId === userId || r.toId === userId) requests.delete(id);
      linkedinProfiles.delete(userId);
      photos.delete(userId);
      for (const [hash, id] of byToken) if (id === userId) byToken.delete(hash);
      for (const [sub, id] of bySub) if (id === userId) bySub.delete(sub);
      users.delete(userId);
      return true;
    },

    async setPhoto(userId, dataUrl) {
      if (dataUrl) photos.set(userId, dataUrl);
      else photos.delete(userId);
    },
    /** What the avatar route needs for one person, or null if there is no such user. */
    async getAvatar(userId) {
      const u = users.get(userId);
      return u ? { name: u.name, photo: photos.get(userId) ?? null, picture: linkedinProfiles.get(userId)?.picture ?? null } : null;
    },
  };
}

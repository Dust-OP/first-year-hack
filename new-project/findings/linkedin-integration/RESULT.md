# LinkedIn integration: what "Sign In with LinkedIn" gives us, and what we may keep

Inspected: 2026-11-21 (about 13:40 to 14:00 GMT). LinkedIn's documentation pages and API Terms of Use were read, and three of LinkedIn's public endpoints were called without credentials. **No LinkedIn developer app exists yet, so nothing was run as a signed-in member.**
Adoption state: **adopted in code (2026-11-21), not yet run against the real LinkedIn.** `app/lib/linkedin.mjs` implements the flow below and is tested against a local stand-in (`app/dev/mock-linkedin.mjs`).

Evidence labels are the ones in [`../README.md`](../README.md). No `E-*.json` notes were recorded for this topic: the sources, dates and quotes are in this file.

## Question

Can the app sign people in with LinkedIn and get their real name, email and profile picture? What exactly comes back, what does not, and what do LinkedIn's terms say about storing it?

## Answer in brief

1. **Yes, with the self-service product "Sign In with LinkedIn using OpenID Connect".** Scopes `openid profile email`. It returns a member id, name, given and family name, picture link, locale and (optionally) email and whether it is verified.
2. **It does not return the member's profile address or headline.** The profile address (`linkedin.com/in/<vanityName>`) needs a permission LinkedIn gives only to approved developers. Users still type their own `linkedin.com/in/...` link.
3. **The code exchange must run on our server.** The token endpoint requires the client secret. LinkedIn's PKCE flow is for native apps only and has to be enabled by a LinkedIn contact.
4. **Storing the profile is allowed only on conditions**, and those conditions limit the planned "make further use of the data" job. See [What the terms say about keeping the data](#what-the-terms-say-about-keeping-the-data). This is a reading of the terms, not legal advice.
5. **Sending connection requests through the API is not available to us.** The Invitations API is "restricted to approved partners".

## What was confirmed, point by point

The left column is what the team assumed from memory before this check.

| Assumption | Result | Label | Source |
|---|---|---|---|
| Scopes are `openid profile email` | Confirmed. `openid`: "Required to indicate the application wants to use OIDC". `profile`: "lite profile including their id, name, and profile picture". `email`: "the member's email address" | verified-in-spec | [1] |
| Product to enable | "Sign in with LinkedIn using OpenID Connect", requested on the app's Products tab. It is in the "Open Permissions" list, "available to all developers" and added "via self-service" | verified-in-spec | [1], [3] |
| Discovery document at `https://www.linkedin.com/oauth/.well-known/openid-configuration` | Confirmed: it answered HTTP 200 with JSON on 21 Nov 2026, 13:42 GMT | verified-live | fetched directly |
| Authorize endpoint `https://www.linkedin.com/oauth/v2/authorization` | Confirmed in the docs and in the live discovery document | verified-live | [2], discovery |
| Token endpoint `https://www.linkedin.com/oauth/v2/accessToken`, needs the client secret | Confirmed. POST, `x-www-form-urlencoded`, with `grant_type=authorization_code`, `code`, `client_id`, `client_secret`, `redirect_uri`, all marked required | verified-in-spec | [2] |
| Userinfo endpoint `https://api.linkedin.com/v2/userinfo` | Confirmed. `GET` with `Authorization: Bearer <access token>`. Called with no token on 21 Nov 2026 it answered HTTP 401 `{"status":401,"serviceErrorCode":65604,"code":"EMPTY_ACCESS_TOKEN","message":"Empty oauth2 access token"}`, so the endpoint exists | verified-live (exists), verified-in-spec (fields) | [1], fetched directly |
| Userinfo returns sub, name, given_name, family_name, picture, locale, email, email_verified | Confirmed, with one addition: **`email` and `email_verified` are optional** "and may not be included in all responses" | verified-in-spec | [1] |
| It does not return the public profile URL or vanity name | Confirmed. Neither is in the userinfo schema or the discovery document's `claims_supported`. `vanityName` needs `r_basicprofile` on the Profile API, whose use "is restricted to those developers approved by LinkedIn" | verified-in-spec | [1], [4] |
| The code exchange must be server-side (no browser PKCE) | Confirmed. The standard flow requires `client_secret`. PKCE exists only as "OAuth 2.0 for Native Clients", on a different authorize URL with a loopback redirect, and only after "reach out to your point of contact at LinkedIn, and we will enable PKCE OAuth 2 flow for your app" | verified-in-spec | [2], [5] |
| Picture URLs may expire | **Not stated for the OpenID Connect picture.** The older profile-picture reference shows picture links of the form `...?e=1526940000&v=alpha&t=12345` with `"identifierExpiresInSeconds":1526940000`, so links carrying an `e=` time are treated as expiring then | inferred | [6] |

## Corrections and things the assumption list did not have

- **The issuer differs between the docs and the live document.** The docs page shows `"issuer": "https://www.linkedin.com"`. The live discovery document on 21 Nov 2026 says `"issuer" : "https://www.linkedin.com/oauth"`. A check of the ID token's `iss` written from the docs page could reject real tokens. (verified-live for the live value; which one real ID tokens carry is **unverified**: decode one after the first real sign-in.)
- **ID tokens are RS256**, keys at `https://www.linkedin.com/oauth/openid/jwks` (answered HTTP 200 with RSA keys). The documented ID token payload lists only `iss`, `sub`, `aud`, `iat`, `exp`; the name, picture and email are documented for the userinfo answer. (verified-live for the key set, verified-in-spec for the payload.)
- **`sub` is pairwise**: `subject_types_supported: ["pairwise"]`, and the Profile API page says "Each member `id` is unique to the context of your application only". It cannot be used to find the person on linkedin.com or matched with another app's data. (verified-live, verified-in-spec.)
- **`locale` may not be text.** The schema says "Text" and the sample shows `"en-US"`. From prior knowledge (not re-checked today) real answers have carried an object, `{"country":"US","language":"en"}`. The code reads both. (**unverified**: look at the first real answer.)
- **State is optional for LinkedIn but we always send it**: "A unique string value of your choice that is hard to guess. Used to prevent CSRF". Cancelling comes back as `error=user_cancelled_login` or `error=user_cancelled_authorize`. The authorization code lives 30 minutes. Access tokens live 60 days; we use ours once and do not keep it. (verified-in-spec, [2].)
- **Redirect URLs** must be absolute and match exactly; query parameters are ignored and `#` is not allowed. The page says to add the URL "via HTTPS". Whether `http://localhost:3000/...` is accepted for testing is **unverified** (prior knowledge says yes): try adding it on the Auth tab.
- **A repeat sign-in can skip the consent screen**: "If there is an existing permission grant from the member: the authorization screen is bypassed". There is no end-session endpoint in the discovery document, so signing out of our app does not sign the browser out of LinkedIn. On a shared device the next person could be signed in as the previous one. (verified-in-spec, [2]; consequence inferred.)
- **The scope description is inconsistent about the headline.** The permissions table says `profile` retrieves "name, headline, and photo" [3], but the userinfo schema has no headline field [1]. We ask users to type what they do. (verified-in-spec; what a real answer contains is **unverified**.)
- **LinkedIn says it is not identity verification**: "Sign In with LinkedIn using OpenID Connect does not verify user identities and should not be marketed as such." [1]

## What the terms say about keeping the data

Source: LinkedIn API Terms of Use, "Last revised on December 13th, 2022", read 21 Nov 2026 [8]. The quotes are short extracts; read the page before relying on them. This is not legal advice.

| Clause | What it says | What the app does |
|---|---|---|
| 4.1 | "You may not store any Content, except in the specific circumstances outlined." Where allowed, it must be stored so you can "identify, segregate, and selectively delete" it, and "only for the duration necessary" to provide the service | LinkedIn data sits in its own record per user (`LINKEDIN_PROFILES` on Snowflake), apart from the app's own profile, and can be deleted on its own |
| 4.2 | You may store the member id LinkedIn gives you and the access token | We keep the id (`sub`). We do not keep the access token |
| 4.3 | Profile data (the terms name "first name, last name, and profile picture") may be stored with "the legally valid consent of the Member". A refresh is allowed "only ... when the Member is actually using your Application and not on an automated schedule" | The sign-in screen says what is kept before the person taps. The record is refreshed only when that person signs in. **A scheduled job must not re-fetch from LinkedIn** |
| 4.4 | "You must delete all data collected on behalf of a User when that User requests deletion or closes their account." This does not cover data the user typed in themselves | "Delete my LinkedIn data" under People, `POST /api/linkedin/forget`. There is no delete-account route yet |
| 3.1 | Content may not be used "for any purpose other than to allow your Users to use the Content in your Application", in advertisements or to target them, or combined "with any other LinkedIn content" including scraped content | **This bounds the later processing job**: matching people inside this app fits; exporting, selling, advertising or joining with scraped LinkedIn pages does not |
| 5.2 | Before sign-in the member must be told how the data is used, when it is collected, what types, how to withdraw consent and how to request deletion; the app needs its own privacy policy (5.1) | The sign-in fine print covers use, type, timing and deletion in one paragraph. **There is no privacy policy page yet** (another session is adding one) |

The Profile API page adds: "You may never store data returned from the Profile API for members other than the authenticated member" [4]. We only ever store the signing-in member's own data.

## Decisions taken in the code

- **Userinfo, not the ID token, is the source of the member's data.** Our server gets the access token straight from LinkedIn over TLS using the client secret and calls userinfo with it once. Reasons: the name, picture and email are documented for userinfo, not for the ID token; the issuer value is in doubt (above), so verifying `iss` could lock real users out on the day with no way to test beforehand; and no token passes through the browser, so there is nothing a signature check would protect. No second token verifier was written. If the ID token is wanted later, `createIdTokenVerifier` in `app/lib/logto.mjs` already handles RS256 with a `{ issuer, jwksUri, appId }` config.
- **The email is kept only in the LinkedIn record**, not in the app's user row, and is never sent to another user.
- **Pictures are passed through our server** (`/api/avatar?id=...`), not hot-linked: the viewer's browser never contacts LinkedIn, and a dead link turns into generated initials. Nothing is cached on the server.
- **No scraping and no unofficial APIs.**

## Limits

- **Not run against the real LinkedIn.** Everything about real behaviour above is from documentation, except the three unauthenticated calls.
- The stand-in follows the documented paths, parameters, fields and error names. It cannot show what LinkedIn really sends for `locale`, for a member with no picture, or for a member without a verified email.
- LinkedIn's docs pages are dated: the OpenID Connect page 2022-12-14 (updated 2024-08-08), the OAuth flow page 2025-11-10 (updated 2026-05-15).

## Next checks, in order

1. Create the LinkedIn developer app and add the product (steps in `app/.env.example`). Note whether the form demands a LinkedIn Page (prior knowledge says it does; **unverified**).
2. Add `http://localhost:3000/api/linkedin/callback` on the Auth tab. If it is refused, use the https address from `npm run phones`.
3. Sign in once with a real account and look at **People, Your LinkedIn data**, and at the stored record: the shape of `locale`, whether `email` is present, whether the picture link has an `e=` expiry, and whether the picture shows on another person's compass.
4. Decode the ID token from that sign-in (if one is returned) and record its `iss`.
5. Before writing the processing job, re-read clauses 3.1, 4.1 and 4.3 against what the job will do.

## Sources

All read on 2026-11-21.

1. Sign In with LinkedIn using OpenID Connect (Microsoft Learn): https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2
2. LinkedIn 3-Legged OAuth Flow: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
3. Getting Access to LinkedIn APIs: https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access
4. Profile API: https://learn.microsoft.com/en-us/linkedin/shared/integrations/people/profile-api
5. Authenticating with OAuth 2.0 for Native Clients (PKCE): https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow-native
6. Profile Picture Fields: https://learn.microsoft.com/en-us/linkedin/shared/references/v2/profile/profile-picture
7. Invitations API ("restricted to approved partners"): https://learn.microsoft.com/en-us/linkedin/shared/integrations/communications/invitations
8. LinkedIn API Terms of Use: https://www.linkedin.com/legal/l/api-terms-of-use

Called directly, without credentials: `https://www.linkedin.com/oauth/.well-known/openid-configuration` (200), `https://www.linkedin.com/oauth/openid/jwks` (200), `https://api.linkedin.com/v2/userinfo` (401, as quoted above).

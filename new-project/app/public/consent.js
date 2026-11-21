// First-open consent for Career Compass.
// Uses CookieConsent 3.3.0 by Orest Bida (MIT): https://github.com/orestbida/cookieconsent
// Vendored copy and licence: vendor/cookieconsent/ (see vendor/cookieconsent/SOURCE.md).
//
// Works on its own, without touching app.js:
// - The dialog blocks the page until the visitor chooses.
// - "No thanks" keeps a blocking notice up, because the compass cannot work without
//   showing your profile and direction to people nearby. The notice offers to change your mind.
// - Bump REVISION whenever privacy.html changes in substance, and everyone is asked again.
(() => {
  const REVISION = 4; // 2: pictures are shown to people nearby; sign-in with LinkedIn (21 Nov 2026). 3: the live site stores data in Neon Postgres (21 Nov 2026). 4: sign-in with a code emailed through Resend, its records in the database on the live site (21 Nov 2026)
  // On the privacy notice itself, don't block the page: people must be able to read it first.
  const onPrivacyPage = /privacy\.html$/.test(location.pathname);
  const CC = window.CookieConsent;
  if (!CC) return; // library failed to load: the app still works as before

  for (const href of ['vendor/cookieconsent/cookieconsent.css', 'consent.css']) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.append(link);
  }

  const dark = matchMedia('(prefers-color-scheme: dark)');
  const applyTheme = () => document.documentElement.classList.toggle('cc--darkmode', dark.matches);
  applyTheme();
  dark.addEventListener?.('change', applyTheme);

  let notice = null;
  function showDeclinedNotice() {
    if (notice) return;
    notice = document.createElement('div');
    notice.className = 'consent-declined';
    notice.setAttribute('role', 'alertdialog');
    notice.setAttribute('aria-modal', 'true');
    notice.setAttribute('aria-labelledby', 'consent-declined-title');
    notice.innerHTML = `
      <div class="consent-declined__box">
        <h2 id="consent-declined-title">No problem</h2>
        <p>Career Compass only works by showing your profile, and the direction and distance to you,
           to people within 500 m. Without that there is nothing for the needle to point at,
           so the app stays closed. ${localStorage.getItem('cc.token')
             ? 'The compass has stopped and your position has been removed. Your profile, your photo, your invitations and anything kept from LinkedIn stay stored until the team deletes them.'
             : 'Nothing about you has been sent to our server. A cookie on this device remembers this choice.'}</p>
        <p><a href="privacy.html">Read what the app stores and why</a></p>
        <button type="button" class="consent-declined__retry">Change my mind</button>
      </div>`;
    notice.querySelector('button').addEventListener('click', () => CC.showPreferences());
    document.body.append(notice);
    lockPage(true);
    notice.querySelector('button').focus();
  }

  // The page behind the notice must not be reachable by keyboard or screen reader either.
  function lockPage(on) {
    for (const el of document.body.children) if (el !== notice && el.id !== 'cc-main') el.inert = on;
  }

  function check() {
    if (CC.acceptedCategory('nearby')) {
      lockPage(false);
      notice?.remove();
      notice = null;
    } else if (CC.validConsent() && !onPrivacyPage) {
      showDeclinedNotice();
    }
  }

  CC.run({
    revision: REVISION,
    mode: 'opt-in',
    autoShow: !onPrivacyPage,
    disablePageInteraction: true,
    hideFromBots: false,
    cookie: { name: 'cc_consent', expiresAfterDays: 182, sameSite: 'Lax' },
    guiOptions: {
      consentModal: { layout: 'box', position: 'middle center', equalWeightButtons: true, flipButtons: false },
      preferencesModal: { layout: 'box', equalWeightButtons: true, flipButtons: false },
    },
    categories: {
      necessary: { enabled: true, readOnly: true },
      nearby: {},
    },
    onFirstConsent: check,
    onConsent: check,
    onChange: () => {
      const token = localStorage.getItem('cc.token');
      if (CC.acceptedCategory('nearby') || !token) return check();
      fetch('/api/hide', { method: 'POST', keepalive: true, headers: { Authorization: `Bearer ${token}` } })
        .catch(() => {})
        .finally(() => (onPrivacyPage ? check() : location.reload())); // reload stops app.js's 3 s position upload
    },
    language: {
      default: 'en',
      translations: {
        en: {
          consentModal: {
            title: 'Before you start',
            description:
              'Career Compass points you at people nearby you should be working with. ' +
              'To do that, people within 500 m who also have the app open can see your name, your picture (a photo or your initials), ' +
              'what you do, your LinkedIn link and what you offer and seek, plus <b>a direction and a distance</b> to you. ' +
              'They never see your position on a map. Only your latest position is kept, and it stops counting after 45 seconds. ' +
              '<a href="privacy.html">Privacy notice</a>',
            acceptAllBtn: 'Agree and continue',
            acceptNecessaryBtn: 'No thanks',
            showPreferencesBtn: 'Choose what to share',
          },
          preferencesModal: {
            title: 'What Career Compass uses',
            acceptAllBtn: 'Agree to all',
            acceptNecessaryBtn: 'Essential only',
            savePreferencesBtn: 'Save my choice',
            closeIconLabel: 'Close',
            sections: [
              {
                description:
                  'There are no adverts, analytics or tracking cookies in this app. ' +
                  'You can change this choice at any time from the link at the bottom of the privacy notice.',
              },
              {
                title: 'Essential (always on)',
                description:
                  'A random session token on this device so you stay signed in (the server keeps only a hash of it), ' +
                  'a small cookie that remembers this choice, and, if you sign in with LinkedIn, a cookie that lasts at most ' +
                  '10 minutes and ties that sign-in to this browser.',
                linkedCategory: 'necessary',
              },
              {
                title: 'Show me to people nearby',
                description:
                  'Your profile (name, picture, what you do, LinkedIn link, what you offer and seek), and the direction and distance to you, ' +
                  'are shown to people within 500 m who have the app open. ' +
                  'Your latest position is stored in the app’s database in London and replaced each time it updates; ' +
                  '“Go invisible” removes it; signing out or closing the page asks the server to remove it. The compass needs this to work.',
                linkedCategory: 'nearby',
              },
              {
                title: 'More detail',
                description: '<a href="privacy.html">Read the full privacy notice</a>.',
              },
            ],
          },
        },
      },
    },
  });

  // Lets privacy.html (or anyone) reopen the choice.
  window.compassConsent = {
    accepted: () => CC.acceptedCategory('nearby'),
    change: () => CC.showPreferences(),
  };
})();

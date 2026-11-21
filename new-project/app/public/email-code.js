// Sign in with a 6-digit code emailed by our own server (lib/email-code.mjs).
// Step 1 asks for the address, step 2 for the code. The code is bound to this browser by an
// HttpOnly cookie the server sets; nothing about the sign-in ever goes into a URL.

const $ = (id) => document.getElementById(id);

export function setupEmailCode({ api, signedIn, showError }) {
  const form = $('email-code');
  let step = 'email';
  let timer = null;

  function toStep(next, email) {
    step = next;
    $('ec-email-row').hidden = next !== 'email';
    $('ec-code-row').hidden = next !== 'code';
    $('ec-resend').hidden = $('ec-change').hidden = next !== 'code';
    $('ec-submit').textContent = next === 'email' ? 'Email me a sign-in code' : 'Sign in';
    if (next === 'code') {
      $('ec-sent').textContent = `Enter the 6-digit code we emailed to ${email}`;
      $('ec-code').value = '';
      $('ec-code').focus();
    }
  }

  /** "Send a new code" waits as long as the server would make it wait anyway. */
  function cooldown(ms) {
    clearInterval(timer);
    const until = Date.now() + ms;
    const tick = () => {
      const left = Math.ceil((until - Date.now()) / 1000);
      $('ec-resend').disabled = left > 0;
      $('ec-resend').textContent = left > 0 ? `Send a new code (${left} s)` : 'Send a new code';
      if (left <= 0) clearInterval(timer);
    };
    tick();
    timer = setInterval(tick, 1000);
  }

  async function sendCode() {
    const out = await api('POST', '/api/email-code/start', { email: $('ec-email').value });
    toStep('code', out.email);
    cooldown(out.resendWaitMs);
  }

  async function busy(button, run) {
    showError('');
    button.disabled = true;
    try { await run(); } catch (ex) { showError(ex.message); } finally { if (button !== $('ec-resend')) button.disabled = false; }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    busy($('ec-submit'), async () => {
      if (step === 'email') return sendCode();
      signedIn(await api('POST', '/api/email-code/verify', { code: $('ec-code').value }));
    });
  });
  $('ec-resend').addEventListener('click', () => busy($('ec-resend'), sendCode).then(() => { if (!timer) $('ec-resend').disabled = false; }));
  $('ec-change').addEventListener('click', () => { showError(''); toStep('email'); $('ec-email').focus(); });
  // Six digits typed or pasted: sign in without another tap.
  $('ec-code').addEventListener('input', () => {
    $('ec-code').value = $('ec-code').value.replace(/\D/g, '').slice(0, 6);
    if ($('ec-code').value.length === 6 && !$('ec-submit').disabled) form.requestSubmit();
  });
}

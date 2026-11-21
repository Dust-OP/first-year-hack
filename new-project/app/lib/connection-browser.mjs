import { connectionTarget } from './connection-client.mjs';

const verification = (page) => /\/(login|uas\/login|authwall|checkpoint|challenge)(?:[/?#]|$)/.test(page.url());

// Only act inside the requested profile's header or its invitation dialog. A different
// layout, language or unexpected redirect must never select a suggested person's Connect.
export async function invite(page, target) {
  let clicked = false;
  try {
    await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30000 });
    if (verification(page)) return 'verification_required';
    const heading = page.locator('main h1');
    await heading.waitFor({ timeout: 10000 });
    if (connectionTarget(page.url()) !== target) return 'failed';
    const card = page.locator('main section').filter({ has: page.locator('h1') }).last();
    const pending = card.getByRole('button', { name: /^(pending|invitation pending)\b/i });
    if (await pending.isVisible()) return 'pending';
    if (await card.getByText(/^·?\s*1st(?: degree connection)?$/i).first().isVisible()) return 'already_connected';
    const connect = card.getByRole('button', { name: /^(connect|invite .+ to connect)$/i });
    if (!await connect.isVisible()) {
      const more = card.getByRole('button', { name: /^(more|more actions)$/i });
      if (await more.isVisible()) await more.click();
    }
    const action = connect.or(card.getByRole('menuitem', { name: /^(connect|invite .+ to connect)$/i }));
    await action.waitFor({ timeout: 4500 });
    if (connectionTarget(page.url()) !== target) return 'failed';
    // A Connect click can send immediately on some versions of the profile.
    clicked = true;
    await action.click({ timeout: 4500 });
    const dialog = page.getByRole('dialog');
    const send = dialog.getByRole('button', { name: /^(send without a note|send invitation|send)$/i });
    const confirmation = page.getByRole('alert').filter({ hasText: /invitation sent|invitation was sent/i });
    const next = await Promise.any([
      send.waitFor().then(() => 'dialog'),
      pending.waitFor().then(() => 'confirmed'),
      confirmation.waitFor().then(() => 'confirmed'),
    ]);
    if (next === 'dialog') {
      if (connectionTarget(page.url()) !== target) return 'outcome_unknown';
      await send.click();
      await Promise.any([pending.waitFor(), confirmation.waitFor()]);
    }
    return 'sent';
  } catch {
    if (!clicked && verification(page)) return 'verification_required';
    return clicked ? 'outcome_unknown' : 'failed';
  }
}

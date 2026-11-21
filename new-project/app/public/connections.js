const labels = {
  queued: 'Queued', running: 'Opening the profile…', sent: 'Invitation sent.',
  pending: 'An invitation is already pending.', already_connected: 'Already connected.',
  verification_required: 'Link or verify your LinkedIn account on the private sign-in display, then try again.',
  failed: 'Could not complete the request. Check the profile before trying again.',
  outcome_unknown: 'Delivery could not be confirmed. Check your sent invitations on LinkedIn.',
};

export function setupConnectionPanel(api) {
  const panel = document.getElementById('connection-panel');
  const form = panel.querySelector('form');
  const field = form.elements.profileUrl;
  const feedback = panel.querySelector('output');
  const submit = form.querySelector('button');
  let generation = 0;
  panel.querySelector('[data-pair]').onclick = async () => {
    try {
      const { code } = await api('POST', '/api/connections/pair');
      panel.querySelector('[data-code]').textContent = 'Private sign-in display pairing code (10 minutes): ' + code;
    } catch (err) { feedback.textContent = err.message; }
  };
  panel.querySelector('[data-disconnect]').onclick = async () => {
    try {
      await api('POST', '/api/connections/disconnect');
      generation++;
      submit.disabled = false;
      panel.querySelector('[data-code]').textContent = '';
      feedback.textContent = 'Worker session and job history removed.';
    } catch (err) { feedback.textContent = err.message; }
  };
  form.onsubmit = async (e) => {
    e.preventDefault();
    const run = ++generation;
    submit.disabled = true;
    try {
      let job = await api('POST', '/api/connections', { profileUrl: field.value }, 10000);
      while (run === generation && ['queued','running'].includes(job.status)) {
        feedback.textContent = labels[job.status];
        await new Promise(resolve => setTimeout(resolve, 1200));
        if (run !== generation) return;
        job = await api('GET', '/api/connections?jobId=' + encodeURIComponent(job.jobId), null, 10000);
      }
      if (run === generation) feedback.textContent = labels[job.status] || 'Unknown job status.';
    } catch (err) { if (run === generation) feedback.textContent = err.message; }
    finally { if (run === generation) submit.disabled = false; }
  };
  return (url) => { field.value = url; field.focus(); };
}

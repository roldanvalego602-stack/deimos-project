const LABELS = { ok: 'GO', caution: 'PRECAUCIÓN', nogo: 'NO-GO' };

export function renderGoNoGo(safety, badgeEl, reasonsEl) {
  badgeEl.innerHTML = '';
  const badge = document.createElement('span');
  badge.className = `badge ${safety.status}`;
  badge.textContent = LABELS[safety.status] ?? '—';
  badgeEl.append(badge);

  reasonsEl.innerHTML = '';
  (safety.reasons ?? []).forEach((r) => {
    const li = document.createElement('li');
    li.textContent = r;
    reasonsEl.append(li);
  });
}
export function renderSafetyPanel(safety, container) {
  container.innerHTML = '';
  safety.metrics.forEach((m) => {
    const row = document.createElement('div');
    row.className = `metric ${m.status}`;

    const left = document.createElement('div');
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = m.label;
    left.append(label);
    if (m.note) {
      const note = document.createElement('span');
      note.className = 'note';
      note.textContent = m.note;
      left.append(note);
    }

    const value = document.createElement('span');
    value.className = 'value';
    value.textContent = `${m.value} ${m.unit}`;

    row.append(left, value);
    container.append(row);
  });
}
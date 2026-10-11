/** Native disclosure groups retain all existing scientific controls and fieldsets. */
export function groupInspector(container) {
  for (const fieldset of [...container.children].filter(node => node.tagName === 'FIELDSET')) {
    const details = document.createElement('details'), summary = document.createElement('summary');
    details.className = 'inspector-group'; details.open = true;
    if (fieldset.dataset.object) details.dataset.object = fieldset.dataset.object;
    summary.textContent = fieldset.querySelector(':scope > legend')?.textContent ?? 'Parámetros';
    fieldset.before(details); details.append(summary, fieldset);
  }
}

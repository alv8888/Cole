// Explicit calculation state, independent of save/share notifications and physics.
export function createCalculationState(form, id, options = {}) {
  const panel = document.createElement('section');
  panel.id = id;
  panel.className = 'calculation-state';
  panel.setAttribute('aria-label', options.label ?? 'Estado del cálculo');
  const heading = document.createElement('strong');
  const message = document.createElement('p');
  message.setAttribute('role', 'status');
  message.setAttribute('aria-live', 'polite');
  const review = document.createElement('button');
  review.type = 'button';
  review.className = 'quiet';
  review.textContent = options.reviewLabel ?? 'Revisar campos';
  panel.append(heading, message, review);
  (options.before ?? form).before(panel);
  review.addEventListener('click', () => {
    const target = options.reviewTarget ? options.reviewTarget() : form.querySelector('[aria-invalid="true"]:not(:disabled)') ?? form.querySelector('input:not(:disabled), select:not(:disabled)');
    if (!target) return;
    const tab = target.closest('[role="tabpanel"]')?.getAttribute('aria-labelledby');
    document.getElementById(tab ?? 'tab-simulation')?.click();
    for (let parent = target.parentElement; parent; parent = parent.parentElement) {
      if (parent.tagName === 'DETAILS') parent.open = true;
    }
    target.focus();
    target.scrollIntoView({block: 'center'});
  });
  return {
    update(state, detail, needsReview = ['invalid', 'warning'].includes(state)) {
      const labels = {ready: 'Cálculo vigente', pending: 'Trayectoria pendiente', invalid: 'Revisar configuración', warning: 'Cálculo vigente · revisión pendiente', partial: 'Solo geometría y masa'};
      if (!(state in labels)) throw new Error('Estado de cálculo desconocido.');
      panel.dataset.state = state;
      heading.textContent = labels[state];
      // Avoid repeated live announcements for unchanged calculation state.
      if (message.textContent !== detail) message.textContent = detail;
      review.hidden = !needsReview;
    },
  };
}

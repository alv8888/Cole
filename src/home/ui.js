import { CATALOG, selectCatalog } from './catalog.js';
import { demoOrbit, previewModel } from './models.js';
import { drawOrbit, moveSatellite } from '../visualization.js';
import { number } from '../units.js';
import { createAnimationLoop } from '../rendering/clock.js';

const $ = id => document.getElementById(id);
const e = $('home-e'), time = $('home-time'), svg = $('home-orbit');
let current, fraction = Number(time.value) / 100, previous = null, previewRevision = 0, previewTrigger = null;
function position() {
  const state = moveSatellite(svg, current.orbit, current.orbit.period * fraction);
  $('home-speed').value = number(state.speed / 1000);
  $('home-altitude').value = number((state.r - current.config.radius * 1000) / 1000, 0);
  $('home-time-value').value = `${number(fraction * 100, 1)} %`;
}
function update() {
  fraction = Number(time.value) / 100;
  current = demoOrbit(Number(e.value), fraction);
  drawOrbit(svg, current.config, current.orbit, 0, current.orbit.apoapsis);
  svg.setAttribute('aria-label', `Demostración de una órbita terrestre con e = ${number(Number(e.value))}; periapsis a 400 km. Escala ajustada al apoapsis.`);
  $('home-e-value').value = number(Number(e.value));
  $('home-period').value = number(current.orbit.period / 60, 1);
  position();
}
const loop = createAnimationLoop(now => {
  // Accumulate at full precision: range step rounding must not freeze slow motion.
  if (previous !== null) fraction = (fraction + Math.min((now - previous) / 1000, .1) * 300 / current.orbit.period) % 1;
  time.value = fraction * 100;
  previous = now;
  position();
});
function pause(message) {
  loop.stop(); previous = null;
  $('home-play').textContent = 'Reproducir vuelta'; $('home-play').setAttribute('aria-pressed', 'false');
  if (message) $('home-feedback').textContent = message;
}
$('home-play').addEventListener('click', () => {
  if (loop.active) pause('Reproducción pausada.');
  else {
    previous = null; loop.start();
    $('home-play').textContent = 'Pausar vuelta'; $('home-play').setAttribute('aria-pressed', 'true');
    $('home-feedback').textContent = 'Reproduciendo a 300 s simulados por segundo real.';
  }
});
[e, time].forEach(input => input.addEventListener('input', () => { pause('Demostración actualizada. Tus configuraciones de laboratorio se conservan.'); update(); }));
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
const motion = matchMedia('(prefers-reduced-motion: reduce)');
motion.addEventListener('change', () => pause('Reproducción pausada por cambio de preferencia de movimiento.'));
if ('IntersectionObserver' in window) new IntersectionObserver(entries => { if (entries[0].intersectionRatio < .15) pause(); }, { threshold: .15 }).observe(document.querySelector('.home-demo'));

function enableApply() { $('home-apply').disabled = false; }
if (document.documentElement.dataset.spaceReady === 'true') enableApply();
document.addEventListener('aerolab:space-ready', enableApply);
$('home-apply').addEventListener('click', () => {
  pause();
  document.dispatchEvent(new CustomEvent('aerolab:home-orbit', { detail: { configuration: { ...current.config } } }));
});
document.addEventListener('aerolab:home-orbit-applied', event => {
  $('home-feedback').textContent = event.detail.message;
  if (event.detail.ok) location.hash = 'lab';
});

// Schematics identify a subject. Numerical previews below use the real models.
const illustrations = {
  orbit: '<circle cx="90" cy="85" r="34"/><ellipse cx="128" cy="85" rx="105" ry="57"/><circle class="home-mark" cx="220" cy="57" r="5"/><path d="M90 85L220 57" stroke-dasharray="4 6"/>',
  aircraft: '<path d="M28 88L205 88L226 82L205 75L149 75L113 41L92 41L114 75L55 75L41 54L26 54L36 79Z"/><path d="M30 117H224M80 100V140M165 62V27" stroke-dasharray="5 5"/><path class="home-mark" d="M80 140L75 130M80 140L85 130M165 27L160 37M165 27L170 37"/>',
  rocket: '<path d="M112 35Q130 5 148 35V115H112ZM112 96L94 130L112 119M148 96L166 130L148 119M112 60H148M112 87H148"/><path class="home-mark" d="M119 125L130 147L141 125"/><path d="M185 136Q210 64 227 30" stroke-dasharray="5 5"/>',
  structure: '<path d="M23 60H230M23 88H230M23 60V88M64 60V88M106 60V88M148 60V88M190 60V88M230 60V88M12 42V107M12 42L3 50M12 60L3 68M12 78L3 86M12 96L3 104"/><path class="home-mark" d="M23 88Q140 88 230 135"/><path d="M70 27V48M140 27V48M210 27V48M70 48L65 40M140 48L135 40M210 48L205 40"/>',
};
function makeCard(item) {
  const card = document.createElement('article'); card.className = `home-card home-card-${item.id}`; card.dataset.homeCard = item.id;
  card.innerHTML = `<div class="home-card-top"><span class="eyebrow">${item.number} / ${item.category}</span><span class="home-card-index" aria-hidden="true">${item.number}</span></div><svg viewBox="0 0 260 160" aria-hidden="true">${illustrations[item.shape]}</svg><div class="home-card-copy"><h3>${item.title}</h3><p class="home-question">${item.question}</p><p>${item.description}</p><ul>${item.tools.map(tool => `<li>${tool}</li>`).join('')}</ul><p class="home-note">${item.model}</p><div class="home-card-actions"><a href="${item.href}">${item.action} <span aria-hidden="true">→</span></a><button type="button" class="quiet" aria-controls="home-preview" aria-expanded="false" data-home-preview="${item.id}">Calcular ejemplo</button></div></div>`;
  return card;
}
$('home-cards').append(...CATALOG.map(makeCard));
function closePreview(returnFocus = false) {
  previewRevision++;
  $('home-preview').hidden = true;
  document.querySelectorAll('[data-home-preview]').forEach(button => button.setAttribute('aria-expanded', 'false'));
  if (returnFocus && previewTrigger && !previewTrigger.closest('article').hidden) previewTrigger.focus();
}
$('home-preview-close').addEventListener('click', () => closePreview(true));
$('home-preview').addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); closePreview(true); } });
document.querySelectorAll('[data-home-filter]').forEach(button => button.addEventListener('click', () => {
  closePreview();
  const visible = selectCatalog(button.dataset.homeFilter);
  document.querySelectorAll('[data-home-card]').forEach(card => card.hidden = !visible.some(item => item.id === card.dataset.homeCard));
  document.querySelectorAll('[data-home-filter]').forEach(control => control.setAttribute('aria-pressed', String(control === button)));
  $('home-catalog-status').textContent = `${visible.length} laboratorios disponibles para este tema. Esquemas ilustrativos; ejemplos calculados al seleccionarlos.`;
}));
$('home-cards').addEventListener('click', async event => {
  const button = event.target.closest('[data-home-preview]'); if (!button) return;
  closePreview(); previewTrigger = button;
  const revision = ++previewRevision, item = CATALOG.find(entry => entry.id === button.dataset.homePreview);
  const panel = $('home-preview'); panel.hidden = false; panel.setAttribute('aria-busy', 'true');
  button.setAttribute('aria-expanded', 'true');
  $('home-preview-title').textContent = item.title;
  $('home-preview-inputs').textContent = ''; $('home-preview-metrics').replaceChildren();
  $('home-preview-note').textContent = 'Calculando con el modelo del laboratorio…';
  $('home-preview-open').href = item.href;
  panel.scrollIntoView({ block: 'nearest', behavior: motion.matches ? 'instant' : 'smooth' });
  try {
    const result = await previewModel(item.id);
    if (revision !== previewRevision) return;
    $('home-preview-inputs').textContent = result.inputs;
    for (const [label, value, unit] of result.metrics) {
      const group = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = label; dd.textContent = `${number(value)} ${unit}`; group.append(dt, dd); $('home-preview-metrics').append(group);
    }
    $('home-preview-note').textContent = result.note;
  } catch {
    if (revision === previewRevision) $('home-preview-note').textContent = 'No se pudo cargar el ejemplo. Abre el laboratorio o recarga la página para reintentar.';
  } finally { if (revision === previewRevision) panel.setAttribute('aria-busy', 'false'); }
});
update(); $('home-play').disabled = false;
$('home-feedback').textContent = 'Demostración pausada. Cambia la forma o recorre una vuelta.';

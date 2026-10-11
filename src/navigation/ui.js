import { encodeLink, decodeLink } from './share.js';

const lab = document.body.dataset.lab || 'space';
const parts = new Map();
const expected = lab === 'rocket' ? ['calculator', 'launch'] : [lab];
const main = document.querySelector('main');
const navigation = document.createElement('section');
navigation.className = 'lab-navigation';
navigation.innerHTML = `<div class="lab-toolbar"><div role="tablist" aria-label="Secciones del laboratorio"></div><button type="button" id="share-simulation">Copiar enlace de simulación</button></div><p id="share-status" role="status" aria-live="polite" class="helper"></p><label id="share-manual" hidden>Enlace para copiar manualmente<input id="share-url" type="text" readonly aria-describedby="share-status"></label>`;
document.querySelector('.modules').after(navigation);
const names = ['Configuración y Simulación', 'Análisis y Gráficos', 'Teoría y Modelos'];
const ids = ['simulation', 'analysis', 'theory'];
const panels = ids.map((id, index) => {
  const panel = document.createElement('div');
  panel.id = `panel-${id}`; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', `tab-${id}`); panel.tabIndex = 0;
  const tab = document.createElement('button'); tab.type = 'button'; tab.id = `tab-${id}`; tab.textContent = names[index]; tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', panel.id);
  navigation.querySelector('[role=tablist]').append(tab);
  navigation.after(panel);
  return panel;
});
// Move existing nodes, preserving listeners, IDs, form values and renderer instances.
function move(selector, index) { document.querySelectorAll(selector).forEach(node => panels[index].append(node)); }
if (lab === 'space') {
  const root = document.querySelector('#lab');
  ['#lab > .section-heading', '.study-panel', '.workspace', '#orbit-globe'].forEach(selector => move(selector, 0));
  const anchor = document.createElement('span'); anchor.id = 'lab'; panels[0].prepend(anchor);
  move('.results-panel, .sensitivity-panel, .analysis-panel, .prediction-panel', 1);
  move('#model', 2);
  root.remove();
} else if (lab === 'structure') {
  ['simulation','analysis','theory'].forEach((name,index)=>move(`[data-structure-panel="${name}"]`,index));
} else {
  move('#launch-lab, #rocket-globe, .legacy-rocket-title, .legacy-rocket-title + .helper, .engineering-layout', 0);
  move('.results-panel', 1);
  const graphs = document.createElement('section'); graphs.className = 'panel';
  const heading = document.createElement('h2'); heading.textContent = lab === 'aircraft' ? 'Fuerzas y barrido de velocidad' : 'Trayectoria y análisis por etapas'; graphs.append(heading); panels[1].prepend(graphs);
  ['.aircraft-chart-title', '#aircraft-forces', '#aircraft-balance + p', '#engineering-graph', '#graph-caption', '#launch-budget', '#launch-stage-budget', '#launch-csv'].forEach(selector => document.querySelectorAll(selector).forEach(node => graphs.append(node)));
  document.querySelectorAll('.launch-output figure').forEach(node => graphs.append(node));
  const events = document.querySelector('#launch-events');
  if (events) { graphs.append(events.previousElementSibling, events); }
  move('.launch-model, #engineering-model', 2);
}
// Panels are placed in reading order, independently of their visibility.
panels.forEach(panel => main.append(panel));
function select(index, focus = false) {
  panels.forEach((panel, i) => {
    panel.hidden = i !== index;
    const tab = document.getElementById(`tab-${ids[i]}`);
    tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1;
    if (i === index && focus) tab.focus();
  });
  document.dispatchEvent(new CustomEvent('aerolab:tabchange', { detail: { tab: ids[index] } }));
}
navigation.querySelectorAll('[role=tab]').forEach((tab, index) => {
  tab.addEventListener('click', () => select(index));
  tab.addEventListener('keydown', event => {
    const target = { ArrowRight: (index + 1) % 3, ArrowLeft: (index + 2) % 3, Home: 0, End: 2 }[event.key];
    if (target !== undefined) { event.preventDefault(); select(target, true); }
  });
});
function revealHash() {
  const target = document.getElementById(location.hash.slice(1));
  const index = panels.findIndex(panel => target && panel.contains(target));
  if (index >= 0) { select(index); if (target.tagName === 'DETAILS') target.open = true; target.scrollIntoView(); }
}
window.addEventListener('hashchange', revealHash);
document.addEventListener('click', event => {
  const anchor = event.target.closest('a[href^="#"]');
  if (!anchor) return;
  const target = document.getElementById(anchor.hash.slice(1));
  const index = panels.findIndex(panel => target && panel.contains(target));
  if (index >= 0) { select(index); if(target.tagName==='DETAILS')target.open=true; }
  if (anchor.hash === location.hash) revealHash();
});
select(0); revealHash();
const status = message => { document.getElementById('share-status').textContent = message; };
document.getElementById('share-simulation').addEventListener('click', async () => {
  document.getElementById('share-manual').hidden = true;
  try {
    if (!expected.every(key => parts.has(key))) throw new Error('El laboratorio todavía está cargando.');
    const state = Object.fromEntries(expected.map(key => { const part = parts.get(key), value = part.get(); part.validate(value); return [key, value]; }));
    const link = encodeLink(location.href, lab, state);
    history.replaceState(null, '', link);
    document.getElementById('share-url').value = link;
    try { await navigator.clipboard.writeText(link); status(lab==='structure'?'Enlace copiado. Incluye parámetros, referencia y escala del diagrama.':'Enlace copiado. Se abrirá con los parámetros actuales y la reproducción pausada.'); }
    catch { document.getElementById('share-manual').hidden = false; document.getElementById('share-url').select(); status('Enlace generado. El navegador no permitió copiarlo: selecciona el enlace y cópialo manualmente.'); }
  } catch (error) { status(`No se pudo compartir: ${error.message}`); }
});
export function registerSharePart(key, adapter) {
  parts.set(key, adapter);
  if (!expected.every(name => parts.has(name))) return;
  try {
    const state = decodeLink(location.href, lab);
    if (!state) return;
    if (Object.keys(state).length !== expected.length || !expected.every(name => Object.hasOwn(state, name))) throw new Error('Faltan configuraciones del laboratorio.');
    // Validate every independent configuration before applying any of them.
    expected.forEach(name => parts.get(name).validate(state[name]));
    expected.forEach(name => parts.get(name).apply(state[name]));
    status(lab==='structure'?'Configuración estructural recuperada del enlace. Guardados locales conservados.':'Simulación recuperada del enlace. Reproducción pausada; guardados locales conservados.');
  } catch (error) { status(`Enlace rechazado; se conservan los valores iniciales: ${error.message}`); }
}

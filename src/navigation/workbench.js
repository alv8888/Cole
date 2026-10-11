/** Rearrange existing nodes once: IDs, controls, listeners and models are preserved. */
export function arrangeWorkbench(lab, panel, analysis) {
  const find = selector => panel.querySelector(selector);
  function workbench(view, inspector) {
    if (!view || !inspector) return null;
    const root = document.createElement('div');
    root.className = 'simulation-workbench';
    view.classList.add('simulation-stage');
    inspector.classList.add('simulation-inspector');
    inspector.id ||= `${lab}-inspector`;
    const jump = document.createElement('a');
    jump.className = 'inspector-jump'; jump.href = `#${inspector.id}`;
    jump.textContent = 'Editar parámetros ↓';
    view.append(jump);
    view.before(root);
    root.append(view, inspector);
    return root;
  }
  if (lab === 'space') {
    const old = find('.workspace'), globe = find('#orbit-globe');
    const visual = old?.querySelector('.visual-panel');
    const inspector = old?.querySelector('.controls-panel');
    if (!old || !globe || !visual || !inspector) return;
    old.before(globe);
    workbench(globe, inspector);
    // One clock controls both views; keep its existing controls beside the 3D scene.
    for (const selector of ['.animation-controls', '.timeline', '.clock']) {
      const node = visual.querySelector(selector);
      if (node) globe.querySelector('.globe-controls').before(node);
    }
    old.replaceWith(visual);
    const study = find('.study-panel');
    if (study) panel.append(study);
  } else if (lab === 'rocket') {
    const globe = find('#rocket-globe'), launch = find('#launch-lab');
    if (globe && launch) {
      launch.before(globe);
      workbench(globe, launch);
      const output = launch.querySelector('.launch-output');
      if (output) {
        globe.querySelector('.globe-controls').before(output);
        // Playback and instantaneous state precede the illustrative stage diagram.
        const diagram = output.querySelector('#launch-diagram');
        if (diagram) output.append(diagram);
      }
      const grid = launch.querySelector('.launch-grid');
      if (grid) grid.classList.add('launch-inspector-grid');
    }
  }
  if (lab === 'aircraft' || lab === 'rocket') {
    const canvas = find('#engineering-canvas');
    const visual = canvas?.closest('.engineering-visual');
    if (!visual) return;
    // Keep the schematic and its real controls, but give the interactive 3D view priority.
    const stage = document.createElement('div');
    stage.className = 'vehicle-stage';
    const heading = canvas.previousElementSibling;
    const end = find('#view-note');
    let node = heading;
    while (node) {
      const next = node.nextElementSibling;
      stage.append(node);
      if (node === end) break;
      node = next;
    }
    visual.prepend(stage);
  }
  if (lab === 'structure') {
    const workspace = find('.design-workspace');
    workspace?.classList.add('simulation-workbench');
    workspace?.querySelector('.design-viewport-panel')?.classList.add('simulation-stage');
    const inspector = workspace?.querySelector('.panel:not(.design-viewport-panel)');
    inspector?.classList.add('simulation-inspector');
    const loads = analysis?.querySelector('.design-workspace');
    const loadView = loads?.querySelector('#design-load-mount')?.closest('.panel');
    if (loadView) {
      loads.prepend(loadView); loads.classList.add('simulation-workbench');
      loadView.classList.add('simulation-stage');
    }
  }
}

/** Preserve readable tick sizes on narrow screens without clipping a scientific plot. */
export function arrangeCharts(panel) {
  for (const svg of panel.querySelectorAll('#engineering-graph, #aircraft-forces, #launch-altitude, #launch-velocity, #structure-displacement, #structure-moment, #velocity-chart, #period-chart')) {
    if (svg.closest('.chart-scroll')) continue;
    const scroll = document.createElement('div');
    scroll.className = 'table-scroll chart-scroll';
    scroll.tabIndex = 0; scroll.setAttribute('role', 'region');
    scroll.setAttribute('aria-label', `${svg.getAttribute('aria-label') ?? 'Gráfico científico'} · desplazable horizontalmente en móvil`);
    svg.before(scroll); scroll.append(svg); svg.classList.add('readable-chart');
  }
}

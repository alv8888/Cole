import {spawn} from 'node:child_process';
import {access} from 'node:fs/promises';
import {fileURLToPath, pathToFileURL} from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const modulePath = process.env.PLAYWRIGHT_MODULE;
if (!modulePath) throw new Error('Define PLAYWRIGHT_MODULE con la ruta de playwright/index.mjs instalado para pruebas.');
const {chromium} = await import(pathToFileURL(modulePath).href);
let executable = process.env.CHROMIUM_PATH;
if (!executable) {
  try { await access('/usr/bin/chromium'); executable = '/usr/bin/chromium'; }
  catch { executable = chromium.executablePath(); }
}
const port = 8060;
const base = process.env.AEROLAB_URL ?? `http://127.0.0.1:${port}`;
const server = process.env.AEROLAB_URL ? null : spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {cwd: root, stdio: 'ignore'});
let serverError;
server?.on('error', e => serverError = e);
const suites = ['browser.mjs', 'engineering-browser.mjs', 'aircraft-forces-browser.mjs', 'rocket-flight-browser.mjs', 'three-browser.mjs', 'navigation-browser.mjs', 'vehicle-browser.mjs', 'structure-browser.mjs', 'structure-design-browser.mjs', 'audit-regressions-browser.mjs', 'workbench-browser.mjs'];
const requested = process.argv.slice(2);
if (requested.some(file => !suites.includes(file))) {
  server?.kill('SIGTERM');
  throw new Error('Suite de navegador desconocida.');
}
if (requested.length) suites.splice(0, suites.length, ...requested);
const environment = {...process.env, AEROLAB_URL: base, CHROMIUM_PATH: executable};
try {
  let ready = false;
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (serverError) throw serverError;
    if (server && server.exitCode !== null) throw new Error(`El servidor de pruebas terminó con código ${server.exitCode}.`);
    try {
      const response = await fetch(`${base}/index.html`, {signal: AbortSignal.timeout(1000)});
      if (response.ok && (await response.text()).includes('AEROLAB')) { ready = true; break; }
    } catch { /* Retry startup only until the fixed deadline. */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error(`El servidor de pruebas no responde en ${base}.`);
  let position = 0, failed = 0;
  async function worker() {
    while (position < suites.length) {
      const file = suites[position++];
      const child = spawn(process.execPath, [`tests/${file}`], {cwd: root, env: environment, stdio: ['ignore', 'pipe', 'pipe']});
      let output = '';
      child.stdout.on('data', chunk => output += chunk);
      child.stderr.on('data', chunk => output += chunk);
      const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('close', resolve); });
      process.stdout.write(`\n${file} · exit ${code}\n${output}`);
      if (code !== 0) failed++;
    }
  }
  await Promise.all(Array.from({length: 3}, worker));
  console.log(`Browser suites: ${suites.length - failed} passed, ${failed} failed.`);
  if (failed) process.exitCode = 1;
} finally { server?.kill('SIGTERM'); }

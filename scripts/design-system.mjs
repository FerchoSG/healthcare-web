import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(resolve(root, 'design-system/tokens.json'), 'utf8'));
const css = `/* Generated from design-system/tokens.json v${tokens.version}. Do not edit. */\n` +
  Object.entries(tokens.colors).map(([theme, colors]) => {
    const selector = theme === 'light' ? ':root, [data-light-only="true"]' : '.dark';
    const declarations = Object.entries(colors).map(([key, value]) => `  --ds-${key}: ${value};`);
    declarations.push(`  color-scheme: ${theme};`);
    return `${selector} {\n${declarations.join('\n')}\n}\n`;
  }).join('\n') + `\n:root {\n  --ds-font: ${tokens.fontFamily};\n  --ds-radius-control: ${tokens.radius.control}px;\n  --ds-radius-panel: ${tokens.radius.panel}px;\n  --ds-radius-dialog: ${tokens.radius.dialog}px;\n}\n`;
const generated = ['design-system/tokens.css', 'app/design-tokens.css'];
if (process.argv.includes('--write')) {
  for (const file of generated) writeFileSync(resolve(root, file), css);
  console.log('Generated design tokens for reference and application.');
  process.exit(0);
}
let failures = 0;
function fail(message) { console.error(message); failures++; }
for (const file of generated) {
  if (!existsSync(resolve(root, file)) || readFileSync(resolve(root, file), 'utf8') !== css) fail(`${file}: regenerate with npm run design:generate`);
}
function luminance(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error('Expected RGB hex: ' + hex);
  const [r, g, b] = hex.slice(1).match(/../g).map(n => parseInt(n, 16) / 255).map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return .2126 * r + .7152 * g + .0722 * b;
}
let pairs = 0;
for (const [theme, colors] of Object.entries(tokens.colors)) {
  for (const pair of tokens.contrastPairs) {
    const a = luminance(colors[pair.foreground]), b = luminance(colors[pair.background]);
    const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
    pairs++;
    if (ratio < pair.minimum) fail(`${theme} ${pair.foreground}/${pair.background}: ${ratio.toFixed(2)} < ${pair.minimum}`);
  }
}
const enumSource = readFileSync(resolve(root, 'types/api.ts'), 'utf8').match(/enum AppointmentStatus\s*{([^}]+)}/)?.[1];
const states = [...(enumSource ?? '').matchAll(/\w+\s*=\s*"([A-Z_]+)"/g)].map(match => match[1]);
if (!states.length || JSON.stringify([...states].sort()) !== JSON.stringify(Object.keys(tokens.appointmentStates).sort())) fail('Appointment states must match the API enum.');
const gitArgs = ['-c', `safe.directory=${root.replaceAll('\\', '/')}`, '-c', 'core.autocrlf=false'];
const git = args => execFileSync('git', [...gitArgs, ...args], { cwd: root, encoding: 'utf8', maxBuffer: 12 * 1024 * 1024 });
const baseIndex = process.argv.indexOf('--base');
const base = baseIndex >= 0 ? process.argv[baseIndex + 1] : 'HEAD';
if (!base || base.startsWith('-')) throw new Error('Pass a valid --base ref.');
const rules = [
  [/#[a-f0-9]{3,8}\b|\brgba?\(/i, 'Raw colors: use semantic tokens'],
  [/(?:radial|linear|repeating-linear)-gradient|backdrop-blur|citabox-(?:primary|coral)-gradient/, 'Decorative gradient/glass outside contract'],
  [/\bfont-(?:black|extrabold)\b/, 'Use the type scale (400/500/600)'],
  [/\brounded-\[|\brounded-(?:2xl|3xl)\b/, 'Use approved radius utilities'],
  [/\b(?:bg|text|border|ring|fill|stroke|divide)-(?:slate|gray|blue|cyan|teal|emerald|green|amber|orange|yellow|red|rose|purple|violet|indigo|sky)-\d+/, 'Color utility outside semantic palette'],
];
function inspect(path, line, number) {
  if (!/^(app|components|lib|styles)\/.*\.(tsx?|jsx?|css)$/.test(path) || path === 'app/design-tokens.css') return;
  for (const [pattern, reason] of rules) if (pattern.test(line)) fail(`${path}:${number}: ${reason}`);
}
const diff = git(['diff', '--no-ext-diff', '--unified=0', base, '--', 'app', 'components', 'lib', 'styles']);
let path = '', lineNumber = 0;
for (const line of diff.split('\n')) {
  if (line.startsWith('+++ b/')) path = line.slice(6);
  else if (line.startsWith('@@')) lineNumber = Number(line.match(/\+(\d+)/)?.[1] ?? 0);
  else if (line.startsWith('+') && !line.startsWith('+++')) inspect(path, line.slice(1), lineNumber++);
  else if (!line.startsWith('-')) lineNumber++;
}
for (const file of git(['ls-files', '--others', '--exclude-standard', '--', 'app', 'components', 'lib', 'styles']).trim().split('\n').filter(Boolean)) {
  readFileSync(resolve(root, file), 'utf8').split('\n').forEach((line, i) => inspect(file, line, i + 1));
}
if (failures) { console.error(`Design contract failed: ${failures} issues.`); process.exit(1); }
console.log(`Design contract ${tokens.version}: ${pairs} contrast pairs, states, generated tokens and UI diff passed.`);

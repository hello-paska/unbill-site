// Unbill design-system helper.
// Runs on your own computer, so it can use the Avantt and Serrif fonts installed there,
// which Figma's servers can't load. Each menu command is safe to run more than once.

const PAGE_ID = '1:8336';
const IDS = {
  typographyFrame: '40000851:3541',
  typographyBody: '40000851:3543',
};
const FONTS = {
  Heading: { family: 'Avantt-TRIAL', style: 'SemiBold' },
  Text: { family: 'Serrif-TRIAL', style: 'Light' },
  'Label/M': { family: 'Avantt-TRIAL', style: 'SemiBold' },
  'Label/S': { family: 'Serrif-TRIAL', style: 'Light' },
};
const SCALE = [
  ['Heading', '3XL'], ['Heading', '2XL'], ['Heading', 'XL'], ['Heading', 'L'], ['Heading', 'M'], ['Heading', 'S'],
  ['Text', 'XL'], ['Text', 'L'], ['Text', 'M'],
  ['Label', 'M'], ['Label', 'S'],
];
const SAMPLE = {
  Heading: 'Your AI healthcare advocate.',
  Text: 'Unbill steps in when healthcare leaves you alone with the paperwork.',
  Label: 'No success fee · Cancel anytime',
};

function fontFor(group, size) {
  return FONTS[`${group}/${size}`] || FONTS[group];
}

async function loadAll() {
  const missing = [];
  for (const f of [FONTS.Heading, FONTS.Text]) {
    try { await figma.loadFontAsync(f); } catch (e) { missing.push(`${f.family} ${f.style}`); }
  }
  for (const s of ['Regular', 'Medium', 'Bold']) await figma.loadFontAsync({ family: 'Inter', style: s });
  if (missing.length) throw new Error(`Install these fonts on this computer first: ${missing.join(', ')}`);
}

async function textStyles() {
  const vars = await figma.variables.getLocalVariablesAsync();
  const v = name => vars.find(x => x.name === name);
  const existing = await figma.getLocalTextStylesAsync();
  const out = [];
  for (const [group, size] of SCALE) {
    const font = fontFor(group, size);
    const weight = font.style === 'SemiBold' ? 'SemiBold' : 'Light';
    const name = `${group}/${size}/${weight}`;
    let st = existing.find(s => s.name === name);
    if (!st) st = figma.createTextStyle();
    st.name = name;
    st.fontName = font;
    const base = `${group}/${size}`;
    const fs = v(`${base}/Font Size`), lh = v(`${base}/Line Height`), ls = v(`${base}/Letter Spacing`);
    const fam = v(font.family.startsWith('Avantt') ? 'Family/Heading' : 'Family/Text');
    const wt = v(`Weight/${weight}`);
    st.fontSize = fs.valuesByMode[Object.keys(fs.valuesByMode)[0]];
    st.setBoundVariable('fontSize', fs);
    st.setBoundVariable('lineHeight', lh);
    st.setBoundVariable('letterSpacing', ls);
    st.setBoundVariable('fontFamily', fam);
    st.setBoundVariable('fontStyle', wt);
    out.push(st);
  }
  return out;
}

async function typographyFrame(styles) {
  const frame = await figma.getNodeByIdAsync(IDS.typographyFrame);
  const body = await figma.getNodeByIdAsync(IDS.typographyBody);
  for (const c of body.children.slice()) c.remove();
  // Fix the widths first, so every sample wraps at its final width.
  frame.layoutMode = 'VERTICAL';
  frame.counterAxisSizingMode = 'FIXED';
  frame.primaryAxisSizingMode = 'AUTO';
  frame.resize(1338, frame.height);
  body.layoutMode = 'VERTICAL';
  body.layoutSizingHorizontal = 'FILL';
  body.layoutSizingVertical = 'HUG';
  body.itemSpacing = 40;
  body.paddingTop = body.paddingBottom = 56;
  body.paddingLeft = body.paddingRight = 56;
  const ink = { r: 0.153, g: 0.149, b: 0.149 };
  const grey = { r: 0.5, g: 0.5, b: 0.5 };
  const inter = (s, style, size, color) => {
    const t = figma.createText();
    t.fontName = { family: 'Inter', style };
    t.fontSize = size;
    t.characters = s;
    t.fills = [{ type: 'SOLID', color }];
    return t;
  };
  const vars = await figma.variables.getLocalVariablesAsync();
  const val = name => { const x = vars.find(y => y.name === name); return x.valuesByMode[Object.keys(x.valuesByMode)[0]]; };
  let group = null;
  for (const st of styles) {
    const [g, size] = st.name.split('/');
    if (g !== group) {
      group = g;
      body.appendChild(inter(g, 'Bold', 20, ink));
    }
    const row = figma.createFrame();
    row.name = st.name;
    row.layoutMode = 'HORIZONTAL';
    row.itemSpacing = 40;
    row.counterAxisAlignItems = 'CENTER';
    row.fills = [];
    body.appendChild(row);
    row.layoutSizingHorizontal = 'FILL';
    row.layoutSizingVertical = 'HUG';

    const meta = figma.createFrame();
    meta.name = 'meta';
    meta.layoutMode = 'VERTICAL';
    meta.itemSpacing = 4;
    meta.fills = [];
    row.appendChild(meta);
    meta.resize(260, meta.height);
    meta.layoutSizingVertical = 'HUG';
    const base = `${g}/${size}`;
    meta.appendChild(inter(st.name, 'Bold', 16, ink));
    meta.appendChild(inter(
      `${st.fontName.family.replace('-TRIAL', '')} ${st.fontName.style} · ${val(base + '/Font Size')}/${val(base + '/Line Height')} · ${val(base + '/Letter Spacing')}px`,
      'Regular', 13, grey));

    const sample = figma.createText();
    sample.name = 'sample';
    await sample.setTextStyleIdAsync(st.id);
    sample.characters = SAMPLE[g];
    sample.fills = [{ type: 'SOLID', color: ink }];
    row.appendChild(sample);
    sample.layoutSizingHorizontal = 'FILL';
    sample.textAutoResize = 'HEIGHT';
  }
}

async function runType() {
  await loadAll();
  const page = await figma.getNodeByIdAsync(PAGE_ID);
  await figma.setCurrentPageAsync(page);
  const styles = await textStyles();
  await typographyFrame(styles);
  return `Created or updated ${styles.length} text styles and the Typography frame.`;
}

// Command 2: components were built in the cloud with Inter placeholders
// (Avantt/Serrif can't load there). Swap each placeholder for its text style.
const COMPONENTS_SECTION = '40000851:7678';
const PLACEHOLDER_MAP = {
  'SemiBold/16': 'Label/M/SemiBold',
  'Regular/16': 'Text/M/Light',
  'Regular/12': 'Label/S/Light',
  'Regular/20': 'Text/L/Light',
  'Regular/24': 'Text/XL/Light',
};

async function runComponents() {
  await loadAll();
  const page = await figma.getNodeByIdAsync(PAGE_ID);
  await figma.setCurrentPageAsync(page);
  const styles = await figma.getLocalTextStylesAsync();
  const byName = Object.fromEntries(styles.map(s => [s.name, s]));
  const section = await figma.getNodeByIdAsync(COMPONENTS_SECTION);
  if (!section) throw new Error('Components section not found');
  const inComponent = n => { for (let p = n.parent; p; p = p.parent) { if (p.type === 'INSTANCE') return false; if (p.type === 'COMPONENT') return true; } return false; };
  const texts = section.findAll(n => n.type === 'TEXT' && typeof n.fontName === 'object' && n.fontName.family === 'Inter' && inComponent(n));
  let done = 0; const skipped = [];
  for (const t of texts) {
    const key = t.fontName.style.replace(/\s+/g, '') + '/' + t.fontSize;
    const style = byName[PLACEHOLDER_MAP[key]];
    if (!style) { skipped.push(key); continue; }
    const deco = t.textDecoration;
    await t.setTextStyleIdAsync(style.id);
    if (deco !== 'NONE') t.textDecoration = deco;
    done++;
  }
  return `Applied text styles to ${done} component texts` + (skipped.length ? ` (skipped: ${[...new Set(skipped)].join(', ')})` : '') + '.';
}


// Command 3: finish the systematized homepage copy. Swaps elements whose
// instances carry Avantt/Serrif text (the cloud can't load those fonts) and
// applies the text styles to every remaining text layer.
const SYS_PAGE_ID = '40000909:38';
const NEW = {
  button: '40000898:1371', navbar: '40000900:1355', billingSwitch: '40000901:1363',
  tabs: '40000901:1383', badge: '40000901:1413', input: '40000902:1402', faq: '40000903:1530',
};
const propKey = (set, prefix) => Object.keys(set.componentPropertyDefinitions).find(k => k.startsWith(prefix));
const variant = (set, name) => set.children.find(c => c.name === name);
function swapNode(old, inst) {
  const p = old.parent, i = p.children.indexOf(old);
  const abs = 'layoutPositioning' in old && old.layoutPositioning === 'ABSOLUTE';
  const x = old.x, y = old.y, grow = old.layoutGrow, align = old.layoutAlign;
  p.insertChild(i, inst);
  if (abs || !p.layoutMode || p.layoutMode === 'NONE') { if (abs) inst.layoutPositioning = 'ABSOLUTE'; inst.x = x; inst.y = y; }
  else { inst.layoutGrow = grow; if (align === 'STRETCH') inst.layoutAlign = 'STRETCH'; }
  old.remove();
  return inst;
}
const insideInstance = n => { for (let p = n.parent; p; p = p.parent) if (p.type === 'INSTANCE') return true; return false; };
const texts = n => n.findAll(k => k.type === 'TEXT');
function lum(node) {
  const p = (Array.isArray(node.fills) ? node.fills : []).find(f => f.type === 'SOLID' && f.visible !== false);
  if (!p) return 1;
  let c = p.color;
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}
const HEADING = { 90: '3XL', 88: '3XL', 72: '2XL', 64: '2XL', 48: 'XL', 36: 'L', 32: 'L', 28: 'M', 24: 'S' };
function styleNameFor(t) {
  const f = t.fontName === figma.mixed ? t.getRangeFontName(0, 1) : t.fontName;
  const sz = t.fontSize === figma.mixed ? t.getRangeFontSize(0, 1) : t.fontSize;
  const display = /Avantt|Kreol/i.test(f.family);
  if (display && sz >= 24) return 'Heading/' + (HEADING[sz] || (sz >= 80 ? '3XL' : sz >= 60 ? '2XL' : sz >= 44 ? 'XL' : sz >= 32 ? 'L' : sz >= 26 ? 'M' : 'S')) + '/SemiBold';
  if (display || /Bd|Bold|SemiBold/i.test(f.style)) return 'Label/M/SemiBold';
  if (sz >= 24) return 'Text/XL/Light';
  if (sz >= 20) return 'Text/L/Light';
  if (sz >= 14) return 'Text/M/Light';
  return 'Label/S/Light';
}

async function runPage() {
  await loadAll();
  const page = await figma.getNodeByIdAsync(SYS_PAGE_ID);
  if (!page) throw new Error('Systematized page not found');
  await figma.setCurrentPageAsync(page);
  const root = page.children.find(n => n.name === 'homepage (systematized)');
  if (!root) throw new Error('Section "homepage (systematized)" not found');
  const C = {};
  for (const [k, id] of Object.entries(NEW)) { C[k] = await figma.getNodeByIdAsync(id); if (!C[k]) throw new Error('Component missing: ' + k); }
  const log = {};
  const bump = k => { log[k] = (log[k] || 0) + 1; };

  // Navbar
  const home = root.children.find(n => n.name === 'Homepage');
  const navSec = home && home.children.find(n => n.name === 'Navbar');
  if (navSec && !navSec.findOne(n => n.type === 'INSTANCE' && n.name === 'navbar')) {
    for (const c of [...navSec.children]) c.remove();
    navSec.layoutMode = 'VERTICAL';
    for (const f of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'itemSpacing']) { navSec.setBoundVariable(f, null); navSec[f] = 0; }
    navSec.fills = [];
    navSec.appendChild(C.navbar.createInstance()); bump('navbar');
  }
  // Billing switch, tabs, input
  for (const n of root.findAll(n => n.type === 'FRAME' && n.name === 'Payment Mode')) { swapNode(n, variant(C.billingSwitch, 'Value=Monthly').createInstance()); bump('billing-switch'); }
  for (const n of root.findAll(n => n.type === 'FRAME' && n.name.startsWith('Row – Household'))) {
    const inst = swapNode(n, C.tabs.createInstance());
    inst.paddingTop = inst.paddingBottom = inst.paddingLeft = inst.paddingRight = 0; inst.fills = []; bump('tabs');
  }
  for (const n of root.findAll(n => n.type === 'FRAME' && n.name.startsWith('Stack – Email'))) {
    const w = n.width; const inst = swapNode(n, variant(C.input, 'State=Active').createInstance()); inst.resize(w, inst.height); bump('input');
  }
  // Old buttons and FAQ items
  const bLabel = propKey(C.button, 'Label'), bArrow = propKey(C.button, 'Show arrow');
  const qKey = propKey(C.faq, 'Question'), aKey = propKey(C.faq, 'Answer');
  for (const old of root.findAll(n => n.type === 'INSTANCE' && !insideInstance(n))) {
    const main = await old.getMainComponentAsync();
    const setName = main && main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent.name : '';
    if (setName === 'button' && /^type=/.test(main.name)) {
      const type = main.name === 'type=primary' ? 'Primary' : 'Secondary';
      const label = (texts(old)[0] || {}).characters || 'Button';
      const arrow = old.children.some(c => c.type !== 'TEXT' && c.visible);
      const inst = variant(C.button, `Type=${type}, Size=M, State=Default`).createInstance();
      inst.setProperties({ [bLabel]: label, [bArrow]: arrow });
      swapNode(old, inst); bump('button');
    } else if (setName === 'faq-accordion') {
      const open = /opened/.test(main.name);
      const t = texts(old);
      const w = old.width;
      const inst = variant(C.faq, `Open=${open}, State=Default`).createInstance();
      const props = { [qKey]: (t[0] && t[0].characters) || '' };
      if (t[1]) props[aKey] = t[1].characters;
      inst.setProperties(props);
      swapNode(old, inst); inst.resize(w, inst.height); bump('faq-item');
    }
  }
  // Badges
  const vKey = propKey(C.badge, 'Label');
  for (const n of root.findAll(n => n.type === 'FRAME' && /^Badge – /.test(n.name) && !insideInstance(n))) {
    const t = texts(n); if (t.length !== 1) continue;
    const L = lum(n);
    const v = L < 0.25 ? 'Dark' : L > 0.97 ? 'Light' : 'Muted';
    const size = n.height <= 32 ? 'S' : 'M';
    const inst = variant(C.badge, `Variant=${v}, Size=${size}`).createInstance();
    inst.setProperties({ [vKey]: t[0].characters });
    swapNode(n, inst); bump('badge');
  }
  // Text styles on everything else
  const styles = await figma.getLocalTextStylesAsync();
  const byName = Object.fromEntries(styles.map(s => [s.name, s]));
  const failed = {};
  for (const t of root.findAll(n => n.type === 'TEXT' && !insideInstance(n))) {
    const name = styleNameFor(t); const st = byName[name];
    if (!st) { failed['no style ' + name] = (failed['no style ' + name] || 0) + 1; continue; }
    if (t.textStyleId === st.id) continue;
    try {
      const deco = t.textDecoration;
      await t.setTextStyleIdAsync(st.id);
      if (deco !== figma.mixed && deco !== 'NONE') t.textDecoration = deco;
      bump('text styled');
    } catch (e) {
      const f = t.fontName === figma.mixed ? 'mixed' : t.fontName.family;
      failed[f] = (failed[f] || 0) + 1;
    }
  }
  const parts = Object.entries(log).map(([k, v]) => `${v} ${k}`);
  const fails = Object.entries(failed).map(([k, v]) => `${v} ${k}`);
  return 'Page done: ' + parts.join(', ') + (fails.length ? ' | not styled: ' + fails.join(', ') : '') + '.';
}

const commands = { type: runType, components: runComponents, page: runPage };
(commands[figma.command] || runType)()
  .then(msg => figma.closePlugin(msg))
  .catch(err => figma.closePlugin('Unbill DS helper: ' + err.message));

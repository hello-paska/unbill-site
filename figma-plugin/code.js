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

const commands = { type: runType, components: runComponents };
(commands[figma.command] || runType)()
  .then(msg => figma.closePlugin(msg))
  .catch(err => figma.closePlugin('Unbill DS helper: ' + err.message));

// Hover Inspector: hold the chosen key (Ctrl by default) and move the mouse
// over any element to see a DevTools-style box with its tag, size, colors,
// font, contrast, image details and link details.
(() => {
  const DEFAULTS = { enabled: true, modifier: 'Control' };
  const MODIFIER_PROP = { Control: 'ctrlKey', Alt: 'altKey', Shift: 'shiftKey', Meta: 'metaKey' };
  const KEY_DELAY_MS = 120;

  let settings = { ...DEFAULTS };
  let lastTarget = null;
  let lastX = -1;
  let lastY = -1;
  let current = null;
  let frame = 0;
  let keyTimer = 0;

  chrome.storage.local.get(DEFAULTS).then((stored) => {
    settings = stored;
  }).catch(() => {});

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    for (const [key, { newValue }] of Object.entries(changes)) settings[key] = newValue;
    if (!settings.enabled) hide();
  });

  // ---------- Color helpers ----------

  const colorCache = new Map();
  let colorCtx = null;

  // Turns any CSS color (rgb, hsl, oklch, named…) into {r, g, b, a}.
  function parseColor(value) {
    if (!value) return null;
    if (colorCache.has(value)) return colorCache.get(value);
    let result = null;
    const m = value.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
    if (m) {
      let a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      result = { r: +m[1], g: +m[2], b: +m[3], a };
    } else {
      // Let the browser convert other formats by painting one pixel.
      try {
        if (!colorCtx) colorCtx = new OffscreenCanvas(1, 1).getContext('2d', { willReadFrequently: true });
        colorCtx.clearRect(0, 0, 1, 1);
        colorCtx.fillStyle = value;
        colorCtx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = colorCtx.getImageData(0, 0, 1, 1).data;
        result = { r, g, b, a: a / 255 };
      } catch {
        result = null;
      }
    }
    colorCache.set(value, result);
    return result;
  }

  const hex2 = (n) => Math.round(n).toString(16).padStart(2, '0');
  const toHex = (c) => `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}${c.a < 1 ? hex2(c.a * 255) : ''}`;

  // Paints color `top` over opaque color `bottom`.
  const blend = (top, bottom) => ({
    r: top.r * top.a + bottom.r * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a),
    a: 1
  });

  function luminance({ r, g, b }) {
    const ch = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
  }

  const parentOf = (node) => node.parentElement || (node.getRootNode() instanceof ShadowRoot ? node.getRootNode().host : null);

  // The color actually behind the element: stacks semi-transparent
  // backgrounds of the element and its ancestors over white.
  // `approximate` is true when a background image may change the result.
  function effectiveBackground(el) {
    const layers = [];
    let approximate = false;
    for (let node = el; node; node = parentOf(node)) {
      const style = getComputedStyle(node);
      if (style.backgroundImage && style.backgroundImage !== 'none') approximate = true;
      const color = parseColor(style.backgroundColor);
      if (color && color.a > 0) {
        layers.push(color);
        if (color.a >= 1) break;
      }
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) base = blend(layers[i], base);
    return { color: base, approximate };
  }

  // ---------- Reading the element ----------

  const TEXT_CONTROLS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON']);

  const hasOwnText = (el) => TEXT_CONTROLS.has(el.tagName) ||
    [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim() !== '');

  function selectorOf(el) {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const classes = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean);
    const shown = classes.slice(0, 3).map((c) => `.${c}`).join('');
    return { tag, rest: `${id}${shown}${classes.length > 3 ? '…' : ''}` };
  }

  function firstUrl(backgroundImage) {
    const m = backgroundImage && backgroundImage.match(/url\(["']?(.*?)["']?\)/);
    return m ? m[1] : null;
  }

  function describe(el) {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const info = { el, rect, selector: selectorOf(el), rows: [], sections: [] };
    const size = `${+rect.width.toFixed(2)} × ${+rect.height.toFixed(2)}`;
    info.size = size;

    const color = parseColor(style.color);
    const bgOwn = parseColor(style.backgroundColor);

    if (hasOwnText(el)) {
      if (color) info.rows.push({ label: 'Color', swatch: color, value: toHex(color) });
      info.rows.push({ label: 'Font', value: `${style.fontSize} ${style.fontFamily}`, truncate: true });
      info.rows.push({ label: 'Weight', value: `${style.fontWeight}${style.lineHeight !== 'normal' ? ` · line-height ${style.lineHeight}` : ''}` });
    }
    if (bgOwn && bgOwn.a > 0) info.rows.push({ label: 'Background', swatch: bgOwn, value: toHex(bgOwn) });

    const bgImage = firstUrl(style.backgroundImage);
    if (bgImage) info.rows.push({ label: 'Bg image', value: bgImage, long: true });

    // Contrast, only for elements with their own text.
    if (hasOwnText(el) && color) {
      const bg = effectiveBackground(el);
      const fg = color.a < 1 ? blend(color, bg.color) : color;
      const l1 = luminance(fg);
      const l2 = luminance(bg.color);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const px = parseFloat(style.fontSize);
      const large = px >= 24 || (px >= 18.66 && parseInt(style.fontWeight, 10) >= 700);
      const needed = large ? 3 : 4.5;
      info.contrast = { ratio, pass: ratio >= needed, needed, approximate: bg.approximate };
    }

    // Image details.
    const img = el.tagName === 'IMG' ? el
      : el.tagName === 'PICTURE' ? el.querySelector('img')
      : (el.tagName === 'INPUT' && el.type === 'image') ? el
      : null;
    if (img) {
      const rows = [];
      if (!img.hasAttribute('alt')) rows.push({ label: 'Alt', value: 'Missing', state: 'bad' });
      else if (img.getAttribute('alt').trim() === '') rows.push({ label: 'Alt', value: 'Empty (decorative)', state: 'warn' });
      else rows.push({ label: 'Alt', value: img.getAttribute('alt'), long: true });
      rows.push({ label: 'Source', value: img.currentSrc || img.src || '(none)', long: true });
      if (img.naturalWidth) rows.push({ label: 'Natural size', value: `${img.naturalWidth} × ${img.naturalHeight}` });
      info.sections.push({ title: 'Image', rows });
    }

    // Link details, also when hovering text inside a link.
    const link = el.closest('a[href], area[href]');
    if (link) {
      const href = typeof link.href === 'string' ? link.href : link.getAttribute('href');
      const target = link.getAttribute('target');
      const rows = [
        { label: 'Href', value: href, long: true },
        { label: 'Target', value: target || 'None (same tab)', state: target ? '' : 'muted' }
      ];
      const rel = link.getAttribute('rel');
      if (rel) rows.push({ label: 'Rel', value: rel });
      info.sections.push({ title: link === el ? 'Link' : 'Link (parent <a>)', rows });
    }

    return info;
  }

  // ---------- Drawing ----------

  let host = null;
  let overlay = null;
  let tip = null;

  const CSS = `
    :host { all: initial; }
    .overlay {
      position: fixed; pointer-events: none; box-sizing: border-box;
      background: rgba(111, 168, 220, 0.45); outline: 1px solid rgba(26, 115, 232, 0.9);
    }
    .tip {
      position: fixed; pointer-events: none; box-sizing: border-box;
      min-width: 260px; max-width: 400px; padding: 10px 12px;
      background: #fff; color: #303942; border-radius: 6px;
      box-shadow: 0 1px 4px rgba(0,0,0,.25), 0 6px 20px rgba(0,0,0,.18);
      font: 13px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    }
    .head { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 6px; }
    .sel { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
    .tag { color: #881280; }
    .rest { color: #1a1aa6; font-weight: 400; }
    .size { color: #303942; white-space: nowrap; }
    .row { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; padding: 1px 0; }
    .label { color: #5f6368; white-space: nowrap; flex: none; }
    .value { text-align: right; min-width: 0; color: #303942; }
    .value.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .value.long {
      word-break: break-all; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
      font-family: ui-monospace, Consolas, monospace; font-size: 12px;
    }
    .value.bad { color: #d93025; font-weight: 600; }
    .value.warn { color: #b06000; }
    .value.muted { color: #80868b; }
    .swatch {
      display: inline-block; width: 11px; height: 11px; margin-right: 5px; vertical-align: -1px;
      border: 1px solid rgba(0,0,0,.25); box-sizing: border-box;
    }
    .section {
      display: flex; align-items: center; gap: 8px; margin: 8px 0 4px;
      color: #303942; font-size: 11px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase;
    }
    .section::after { content: ""; flex: 1; border-top: 1px solid #dadce0; }
    .aa { display: inline-block; padding: 0 3px; margin-right: 6px; border: 1px solid #dadce0; border-radius: 2px; font-size: 12px; }
    .pass { color: #1e8e3e; font-weight: 700; }
    .fail { color: #d93025; font-weight: 700; }
  `;

  function ensureUi() {
    if (host && host.isConnected) return;
    host = document.createElement('hover-inspector-ui');
    host.style.cssText = 'all:initial;position:fixed;inset:0;width:0;height:0;margin:0;padding:0;border:0;background:transparent;overflow:visible;pointer-events:none;z-index:2147483647;';
    const root = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = CSS;
    overlay = document.createElement('div');
    overlay.className = 'overlay';
    tip = document.createElement('div');
    tip.className = 'tip';
    root.append(style, overlay, tip);
    document.documentElement.append(host);
    // The top layer keeps the box above modal dialogs and popovers.
    try {
      host.setAttribute('popover', 'manual');
      host.showPopover();
    } catch {
      // Older Chrome: z-index is enough on most pages.
    }
  }

  function node(tag, className, text) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function rowNode(row) {
    const r = node('div', 'row');
    r.append(node('span', 'label', row.label));
    const classes = ['value'];
    if (row.truncate) classes.push('truncate');
    if (row.long) classes.push('long');
    if (row.state) classes.push(row.state);
    const v = node('span', classes.join(' '));
    if (row.swatch) {
      const sw = node('span', 'swatch');
      sw.style.background = `rgba(${row.swatch.r}, ${row.swatch.g}, ${row.swatch.b}, ${row.swatch.a})`;
      v.append(sw);
    }
    v.append(document.createTextNode(row.value));
    r.append(v);
    return r;
  }

  function render(info) {
    ensureUi();
    const { rect } = info;

    Object.assign(overlay.style, {
      display: 'block',
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`
    });

    // Every value from the page is inserted as text, never as HTML.
    tip.replaceChildren();
    const head = node('div', 'head');
    const sel = node('span', 'sel');
    sel.append(node('span', 'tag', info.selector.tag), node('span', 'rest', info.selector.rest));
    head.append(sel, node('span', 'size', info.size));
    tip.append(head);

    for (const row of info.rows) tip.append(rowNode(row));

    if (info.contrast) {
      tip.append(node('div', 'section', 'Accessibility'));
      const r = node('div', 'row');
      r.append(node('span', 'label', 'Contrast'));
      const v = node('span', 'value');
      v.append(
        node('span', 'aa', 'Aa'),
        document.createTextNode(`${info.contrast.approximate ? '≈ ' : ''}${info.contrast.ratio.toFixed(2)} `),
        node('span', info.contrast.pass ? 'pass' : 'fail', info.contrast.pass ? '✓' : `✗ needs ${info.contrast.needed}`)
      );
      r.append(v);
      tip.append(r);
    }

    for (const section of info.sections) {
      tip.append(node('div', 'section', section.title));
      for (const row of section.rows) tip.append(rowNode(row));
    }

    // Place the box above the element, or below it, or inside the viewport.
    tip.style.display = 'block';
    tip.style.left = '0px';
    tip.style.top = '0px';
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const { width: tw, height: th } = tip.getBoundingClientRect();
    const gap = 8;
    let top = rect.top - th - gap;
    if (top < gap) top = rect.bottom + gap;
    if (top + th > vh - gap) top = Math.max(gap, Math.min(lastY + 16, vh - th - gap));
    const left = Math.min(Math.max(gap, rect.left), Math.max(gap, vw - tw - gap));
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  }

  function show(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE || el === host) return;
    current = el;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (current === el && el.isConnected) render(describe(el));
    });
  }

  function hide() {
    clearTimeout(keyTimer);
    cancelAnimationFrame(frame);
    current = null;
    if (overlay) overlay.style.display = 'none';
    if (tip) tip.style.display = 'none';
  }

  // Finds the deepest element under the pointer, including inside open shadow roots.
  function deepElementAt(x, y) {
    let el = document.elementFromPoint(x, y);
    while (el && el.shadowRoot) {
      const inner = el.shadowRoot.elementFromPoint(x, y);
      if (!inner || inner === el) break;
      el = inner;
    }
    return el;
  }

  const modifierHeld = (event) => !!event[MODIFIER_PROP[settings.modifier]];

  // ---------- Events ----------

  window.addEventListener('mousemove', (event) => {
    lastX = event.clientX;
    lastY = event.clientY;
    const path = event.composedPath();
    lastTarget = path.length && path[0].nodeType === Node.ELEMENT_NODE ? path[0] : event.target;
    if (!settings.enabled) return;
    if (modifierHeld(event)) {
      if (lastTarget !== current) show(lastTarget);
    } else if (current) {
      hide();
    }
  }, { capture: true, passive: true });

  window.addEventListener('keydown', (event) => {
    if (!settings.enabled) return;
    if (event.key === settings.modifier) {
      if (event.repeat || current) return;
      // Wait a moment so quick shortcuts like Ctrl+C don't flash the box.
      clearTimeout(keyTimer);
      keyTimer = setTimeout(() => {
        if (lastX >= 0) show(deepElementAt(lastX, lastY) || lastTarget);
      }, KEY_DELAY_MS);
    } else {
      clearTimeout(keyTimer);
    }
  }, true);

  window.addEventListener('keyup', (event) => {
    if (event.key !== settings.modifier) return;
    // Stops a lone Alt press from moving focus to Chrome's menu on Windows.
    if (event.key === 'Alt' && current) event.preventDefault();
    hide();
  }, true);

  window.addEventListener('scroll', () => {
    if (current && lastX >= 0) {
      const el = deepElementAt(lastX, lastY);
      if (el) {
        current = null;
        show(el);
      }
    }
  }, { capture: true, passive: true });

  window.addEventListener('blur', hide);
  document.addEventListener('visibilitychange', hide);
  document.documentElement.addEventListener('mouseleave', hide);
})();

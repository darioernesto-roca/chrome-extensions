// Shared defaults, loaded by the service worker and the options page.
// (content.js keeps its own copy because content scripts can't import modules.)
const HOVER_INSPECTOR_DEFAULTS = { enabled: true, modifier: 'Control' };
const HOVER_INSPECTOR_KEY_NAMES = { Control: 'Ctrl', Alt: 'Alt', Shift: 'Shift', Meta: 'Cmd/Win' };

export function createControls(keyboard, definitions) {
  const controls = {};

  for (const [action, definition] of Object.entries(definitions)) {
    const codes = Array.isArray(definition) ? definition : [definition];
    const keys = codes.map((code) => keyboard.addKey(code, false, false));

    controls[action] = {
      codes,
      keys,
      get isDown() {
        return keys.some((key) => key.isDown);
      }
    };
  }

  return controls;
}

export function isTouchPrimary() {
  if (typeof window === 'undefined') {
    return false;
  }

  if (new URLSearchParams(window.location.search).get('touch') === '1') {
    return true;
  }

  return typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
}
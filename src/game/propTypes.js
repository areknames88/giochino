const DEFAULT_TEXTURE = {
  'drum-kit': 'prop-drum-kit',
  amp: 'prop-amp-guitar',
  door: 'prop-door',
  mixer: 'prop-mixer',
  'power-outlet': 'prop-power-outlet',
  speaker: 'prop-speaker-pa',
  'mic-stand': 'prop-mic-stand',
  cables: 'prop-cables-bundle',
  guitar: 'prop-guitar-red',
  bass: 'prop-bass-precision'
};

const DEFAULT_FOOTPRINT = {
  'drum-kit': { w: 140, h: 52 },
  amp: { w: 52, h: 34 },
  door: null,
  mixer: { w: 44, h: 28 },
  'power-outlet': null,
  speaker: { w: 32, h: 24 },
  'mic-stand': { w: 22, h: 18 },
  cables: null,
  guitar: { w: 22, h: 18 },
  bass: { w: 22, h: 18 }
};

const VARIANT_OVERRIDES = {
  amp: {
    bass: { texture: 'prop-amp-bass', footprint: { w: 62, h: 44 } },
    guitar: { texture: 'prop-amp-guitar', footprint: { w: 52, h: 34 } }
  },
  guitar: {
    red: { texture: 'prop-guitar-red', footprint: { w: 22, h: 18 } }
  },
  bass: {
    precision: { texture: 'prop-bass-precision', footprint: { w: 22, h: 18 } }
  },
  door: {
    closed: { texture: 'prop-door', footprint: null }
  },
  speaker: {
    pa: { texture: 'prop-speaker-pa', footprint: { w: 32, h: 24 } },
    monitor: { texture: 'prop-speaker-monitor', footprint: { w: 40, h: 26 } }
  },
  'mic-stand': {
    boom: { texture: 'prop-mic-stand', footprint: { w: 22, h: 18 } }
  },
  cables: {
    bundle: { texture: 'prop-cables-bundle', footprint: null, shadow: false },
    coil: { texture: 'prop-cables-coil', footprint: null, shadow: false }
  },
  'power-outlet': {
    wall: { texture: 'prop-power-outlet', footprint: null, shadow: false }
  }
};

const SHADOW_OVERRIDES = {
  'power-outlet': false,
  cables: false
};

export function propTexture(type, variant) {
  return VARIANT_OVERRIDES[type]?.[variant]?.texture
    ?? VARIANT_OVERRIDES[type]?.default?.texture
    ?? DEFAULT_TEXTURE[type];
}

export function propFootprint(type, variant) {
  return VARIANT_OVERRIDES[type]?.[variant]?.footprint
    ?? VARIANT_OVERRIDES[type]?.default?.footprint
    ?? DEFAULT_FOOTPRINT[type]
    ?? null;
}

export function propHasShadow(type, variant) {
  if (VARIANT_OVERRIDES[type]?.[variant]?.shadow !== undefined) {
    return VARIANT_OVERRIDES[type][variant].shadow;
  }
  if (SHADOW_OVERRIDES[type] !== undefined) {
    return SHADOW_OVERRIDES[type];
  }
  return true;
}
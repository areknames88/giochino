const DEFAULT_TEXTURE = {
  'drum-kit': 'prop-drum-kit',
  amp: 'prop-amp-guitar',
  door: 'prop-door'
};

const DEFAULT_FOOTPRINT = {
  'drum-kit': { w: 140, h: 52 },
  amp: { w: 52, h: 34 },
  door: null
};

const VARIANT_OVERRIDES = {
  amp: {
    bass: { texture: 'prop-amp-bass', footprint: { w: 62, h: 44 } },
    guitar: { texture: 'prop-amp-guitar', footprint: { w: 52, h: 34 } }
  },
  door: {
    closed: { texture: 'prop-door', footprint: null }
  }
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
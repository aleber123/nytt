import React from 'react';

interface CountryFlagProps {
  code: string; // ISO 3166-1 alpha-2 or 'other'/'custom'
  size?: number; // width in px, height will be 3/4 of width (e.g., 24 -> 18)
  className?: string;
  title?: string;
}

// Supported FlagCDN sizes (width x height)
const FLAGCDN_SIZES: [number, number][] = [
  [16, 12], [20, 15], [24, 18], [28, 21], [32, 24], [40, 30],
  [48, 36], [56, 42], [60, 45], [64, 48], [80, 60], [96, 72],
  [120, 90], [160, 120], [192, 144], [256, 192],
];

function getClosestFlagSize(desired: number): [number, number] {
  for (const [w, h] of FLAGCDN_SIZES) {
    if (w >= desired) return [w, h];
  }
  return FLAGCDN_SIZES[FLAGCDN_SIZES.length - 1];
}

// Uses FlagCDN for reliable SVG/PNG flags. Defaults to 24x18.
// Falls back to a globe emoji for 'other'/'custom' or invalid codes.
const CountryFlag: React.FC<CountryFlagProps> = ({ code, size = 24, className = '', title }) => {
  const lower = (code || '').toLowerCase();
  const isFallback = !lower || lower === 'other' || lower === 'custom';

  if (isFallback) {
    return (
      <span className={className} aria-label={title || 'Globe'} role="img">
        🌍
      </span>
    );
  }

  const [width, height] = getClosestFlagSize(size);
  const src = `https://flagcdn.com/${width}x${height}/${lower}.png`;
  const alt = title || lower.toUpperCase();

  return (
    <img
      src={src}
      width={width}
      height={height}
      alt={alt}
      title={alt}
      loading="lazy"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2 }}
    />
  );
};

export default CountryFlag;

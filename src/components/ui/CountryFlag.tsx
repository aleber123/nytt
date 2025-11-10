import React from 'react';

interface CountryFlagProps {
  code: string; // ISO 3166-1 alpha-2 or 'other'/'custom'
  size?: number; // width in px, height will be 3/4 of width (e.g., 24 -> 18)
  className?: string;
  title?: string;
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

  // FlagCDN expects width x height with approx 4:3 ratio
  const width = Math.max(12, Math.floor(size));
  const height = Math.max(9, Math.floor((width * 3) / 4));
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

import { useMemo, useState, type ImgHTMLAttributes } from 'react';

interface ResponsiveImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackLabel: string;
}

function buildFallbackImage(label: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 675" role="img" aria-label="${label}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="50%" stop-color="#111827" />
          <stop offset="100%" stop-color="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect width="900" height="675" fill="url(#bg)" />
      <circle cx="760" cy="120" r="120" fill="rgba(103, 232, 249, 0.18)" />
      <circle cx="180" cy="560" r="140" fill="rgba(168, 85, 247, 0.18)" />
      <text x="50%" y="48%" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="40" text-anchor="middle">
        MechaShop
      </text>
      <text x="50%" y="56%" fill="#67e8f9" font-family="Arial, sans-serif" font-size="22" text-anchor="middle">
        ${label}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function ResponsiveImage({
  fallbackLabel,
  src,
  srcSet,
  alt,
  ...props
}: ResponsiveImageProps) {
  const fallbackSrc = useMemo(() => buildFallbackImage(fallbackLabel), [fallbackLabel]);
  const [hasError, setHasError] = useState(false);

  return (
    <img
      {...props}
      src={hasError ? fallbackSrc : src}
      srcSet={hasError ? undefined : srcSet}
      alt={alt}
      onError={() => setHasError(true)}
    />
  );
}

export default ResponsiveImage;

'use client';

import { useState, type ReactNode } from 'react';
import { resolveAssetUrl } from '@/lib/format';

interface SmartAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  style?: React.CSSProperties;
  fallbackIcon?: ReactNode;
}

/**
 * Deep avatar/logo display module: resolves storage keys or external URLs,
 * resets error state whenever `src` changes, and falls back to initial letter or icon on load failure.
 */
export default function SmartAvatar({
  src,
  name,
  className = '',
  style,
  fallbackIcon,
}: SmartAvatarProps) {
  const resolved = resolveAssetUrl(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(resolved && failedSrc !== resolved);

  const label = (name || '').trim();
  const initial = (label || 'U').charAt(0).toUpperCase();

  return (
    <div className={className} style={style}>
      {showImage ? (
        <img
          src={resolved}
          alt={label || 'Avatar'}
          onError={() => setFailedSrc(resolved)}
        />
      ) : (
        fallbackIcon || <span>{initial}</span>
      )}
    </div>
  );
}

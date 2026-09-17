import React, { useState, useEffect } from 'react';
import { Building2, Image as ImageIcon } from 'lucide-react';
import { getImageUrl } from '../utils/formatters';

/**
 * ImageWithFallback
 * Gracefully handles broken images, network failures, or missing URLs.
 * Replaces broken browser placeholders with clean Lucide React icon components.
 */
export default function ImageWithFallback({
  src,
  alt = 'Foto Properti',
  className = 'w-full h-full object-cover',
  containerClassName = '',
  icon: CustomIcon,
  fallbackText = '',
  showText = false,
  onClick,
  ...props
}) {
  const resolvedSrc = getImageUrl(src);
  const [hasError, setHasError] = useState(!resolvedSrc);
  const [isLoading, setIsLoading] = useState(Boolean(resolvedSrc));

  // Reset state when src changes
  useEffect(() => {
    const currentResolved = getImageUrl(src);
    setHasError(!currentResolved);
    setIsLoading(Boolean(currentResolved));
  }, [src]);

  const IconComponent = CustomIcon || Building2;

  if (hasError || !resolvedSrc) {
    return (
      <div
        onClick={onClick}
        className={`w-full h-full min-h-[36px] bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200/90 flex flex-col items-center justify-center text-gray-400 select-none overflow-hidden relative border border-gray-200/40 ${containerClassName || ''}`}
        title={alt || 'Foto tidak dapat dimuat'}
      >
        <div className="flex flex-col items-center justify-center p-1.5 text-center animate-in fade-in duration-200">
          <div className="p-1.5 rounded-lg bg-white/80 shadow-2xs border border-gray-200/60 flex items-center justify-center">
            <IconComponent className="w-5 h-5 text-gray-400 shrink-0 stroke-[1.75]" />
          </div>
          {showText && fallbackText && (
            <span className="text-[10px] font-medium text-gray-400 line-clamp-1 mt-1 px-2">
              {fallbackText}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full max-h-full overflow-hidden ${containerClassName || ''}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center z-1">
          <ImageIcon className="w-5 h-5 text-gray-300 animate-bounce" />
        </div>
      )}
      <img
        src={resolvedSrc}
        alt={alt}
        className={`w-full h-full max-h-full object-cover ${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        onClick={onClick}
        {...props}
      />
    </div>
  );
}

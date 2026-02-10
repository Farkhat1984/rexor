"use client";

import { useState } from "react";

interface WatchImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function WatchImage({ src, alt, className = "" }: WatchImageProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-brand-50 text-brand-300 ${className}`}>
        <svg className="w-16 h-16 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="6" x2="12" y2="12" />
          <line x1="12" y1="12" x2="15" y2="15" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}

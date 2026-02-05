'use client';

import { useState } from 'react';
import Image from 'next/image';

interface LogoImageProps {
  src: string;
  width?: number;
  height?: number;
}

export default function LogoImage({ src, width = 192, height = 192 }: LogoImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <span className="text-8xl md:text-9xl drop-shadow-2xl">🐼</span>
    );
  }

  return (
    <Image
      src={src}
      alt="Logo"
      width={width}
      height={height}
      className="object-contain w-full h-full drop-shadow-2xl"
      unoptimized={src.startsWith('/')}
      onError={() => setHasError(true)}
    />
  );
}

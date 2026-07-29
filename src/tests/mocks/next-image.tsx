import React, { forwardRef } from "react";

/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-img-element, jsx-a11y/alt-text */
// This file is a Vitest-only mock for next/image. It renders a plain <img>
// and intentionally discards next/image-specific props (fill, quality,
// preload, etc.) that are irrelevant in the test environment.

// Minimal subset of next/image props used by Renyqo components.
// Vitest tests don't need image optimization — they render a plain <img>.

interface StaticImageData {
  src: string;
  height: number;
  width: number;
  blurDataURL?: string;
}

interface StaticRequire {
  default: StaticImageData;
}

type StaticImport = StaticRequire | StaticImageData;

type LoadingValue = "lazy" | "eager";

interface MockImageProps extends Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "width" | "height" | "loading" | "alt"
> {
  src: string | StaticImport;
  alt: string;
  width?: number | `${number}`;
  height?: number | `${number}`;
  fill?: boolean;
  quality?: number | `${number}`;
  preload?: boolean;
  priority?: boolean;
  loading?: LoadingValue;
  placeholder?: "empty" | "blur" | `data:image/${string}`;
  blurDataURL?: string;
  loader?: unknown;
  unoptimized?: boolean;
  overrideSrc?: string;
  onLoadingComplete?: (img: HTMLImageElement) => void;
}

function resolveSrc(src: string | StaticImport): string {
  if (typeof src === "string") return src;
  if ("default" in src) return src.default.src;
  return src.src;
}

const MockImage = forwardRef<HTMLImageElement, MockImageProps>(
  function MockImage(props, ref) {
    const {
      src,
      alt,
      width,
      height,
      fill: _fill,
      quality: _quality,
      preload: _preload,
      priority: _priority,
      placeholder: _placeholder,
      blurDataURL: _blurDataURL,
      loader: _loader,
      unoptimized: _unoptimized,
      overrideSrc: _overrideSrc,
      onLoadingComplete: _onLoadingComplete,
      loading,
      fetchPriority,
      decoding,
      sizes,
      style,
      className,
      ...rest
    } = props;

    const resolvedSrc = resolveSrc(src);

    const imgProps: React.ImgHTMLAttributes<HTMLImageElement> = {
      src: resolvedSrc,
      alt,
      className,
      style,
      ...rest,
    };

    if (loading !== undefined) imgProps.loading = loading;
    if (fetchPriority !== undefined) imgProps.fetchPriority = fetchPriority;
    if (decoding !== undefined) imgProps.decoding = decoding;
    if (sizes !== undefined) imgProps.sizes = sizes;
    if (width !== undefined) imgProps.width = width;
    if (height !== undefined) imgProps.height = height;

    return <img ref={ref} {...imgProps} />;
  },
);

MockImage.displayName = "MockImage";

export default MockImage;

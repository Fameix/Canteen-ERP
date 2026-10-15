"use client"

import Image from "next/image"
import { useState } from "react"

const FALLBACK_IMAGE = "/images/menu/fallback.svg"

export function ProductImage({ src, alt }: { src?: string; alt: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const imageSource = !src || failedSource === src ? FALLBACK_IMAGE : src

  return (
    <Image
      src={imageSource}
      alt={alt}
      width={400}
      height={400}
      unoptimized
      loading="lazy"
      className="size-full object-cover"
      onError={imageSource === FALLBACK_IMAGE ? undefined : () => setFailedSource(src ?? null)}
    />
  )
}

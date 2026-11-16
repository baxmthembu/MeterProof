"use client";

import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { getStore } from "@/lib/store";

/** A meter photo from the store. Loads lazily and frees its object URL on unmount. */
export function Photo({ path, alt, className = "" }: { path: string | null; alt: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!path) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    getStore().photoBlob(path).then((blob) => {
      if (cancelled) return;
      if (!blob) return setFailed(true);
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    }).catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  const box = `overflow-hidden rounded-(--radius-input) bg-paper-3 ${className}`;
  if (!path || failed) {
    return (
      <div className={`${box} grid place-items-center text-muted`} role="img" aria-label={path ? "Photo could not be loaded" : "No photo"}>
        <ImageOff aria-hidden="true" size={20} />
      </div>
    );
  }
  return (
    <div className={box}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a local blob URL, nothing for next/image to optimise */}
      {url && <img src={url} alt={alt} width={160} height={160} loading="lazy" decoding="async" className="h-full w-full object-cover" />}
    </div>
  );
}

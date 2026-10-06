import { useEffect, useRef, useState } from "react";

// Shows a stored image by object URL. A node's blob never changes, so the first one is
// enough; later reloads hand over equal copies that would only make the image flicker.
export function BlobImage({ blob, className }: { blob: Blob; className?: string }) {
  const [initial] = useState(blob);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(initial);
    if (ref.current) ref.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [initial]);
  return <img ref={ref} alt="" draggable={false} className={className} />;
}

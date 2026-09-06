import Image from "next/image";
import type { ContextualImage } from "../content/contextual-images.js";

/** Design-owned contextual photography; generation provenance is recorded in the asset manifest. */
export function ContextualPhoto({
  image,
  priority = false,
}: {
  image: ContextualImage;
  priority?: boolean;
}) {
  return (
    <figure className="context-photo">
      <Image
        src={image.src}
        alt={image.alt}
        width={1536}
        height={1024}
        sizes="(max-width: 900px) 100vw, 50vw"
        priority={priority}
      />
    </figure>
  );
}

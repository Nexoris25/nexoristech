import Image from "next/image";
import type { ContextualImage } from "../content/contextual-images.js";

/** Visible provenance separates illustrative scenarios from actual people and project evidence. */
export function ContextualPhoto({ image, priority = false }: { image: ContextualImage; priority?: boolean }) {
  return <figure className="context-photo">
    <Image src={image.src} alt={image.alt} width={1536} height={1024}
      sizes="(max-width: 900px) 100vw, 50vw" priority={priority} />
    <figcaption>Illustrative scenario · AI-generated image</figcaption>
  </figure>;
}

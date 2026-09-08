/**
 * Where uploaded media lives on disk.
 *
 * It used to live in `apps/admin/public/uploads`, which is inside the application directory. That
 * works until the first deployment: a deploy that replaces or re-clones the app directory takes every
 * uploaded file with it, and nothing warns anyone, because the `cms_media` rows and the
 * `featured_image` columns all survive. The database still describes a full media library and every
 * one of the files behind it is gone. That is exactly what happened on the first VPS deploy.
 *
 * `MEDIA_STORAGE_PATH` moves the files somewhere a deploy does not touch — `/media/nexoris` on the
 * VPS. Uploads are user data; they belong outside the thing that gets replaced, alongside the
 * database rather than alongside the code.
 *
 * Everything that reads, writes, deletes or reports on media resolves its path through this module,
 * so there is one answer to "where is it" rather than four copies of `join(cwd, "public", "uploads")`
 * that can drift apart.
 *
 * The public URL is unchanged. Files are still addressed as `/uploads/<name>`; only the directory
 * behind that address moved. Nothing stored in the database needs rewriting.
 */
import { existsSync } from "node:fs";
import { join, basename } from "node:path";

/**
 * The directory holding uploaded media.
 *
 * With MEDIA_STORAGE_PATH set, that is the answer and no guessing happens. Without it the legacy
 * location is used, so a developer machine and any deployment that has not been reconfigured keep
 * working exactly as before — this change adds a better option, it does not require one.
 */
export function mediaDir(): string {
  const configured = process.env.MEDIA_STORAGE_PATH?.trim();
  if (configured) return configured.replace(/[/\\]+$/, "");

  const cwd = process.cwd();
  const base = existsSync(join(cwd, "public")) ? join(cwd, "public") : join(cwd, "apps", "admin", "public");
  return join(base, "uploads");
}

/** True when media is kept outside the application directory, and so survives a deployment. */
export function mediaIsExternal(): boolean {
  return Boolean(process.env.MEDIA_STORAGE_PATH?.trim());
}

/**
 * The absolute path of one stored file, or null if the name is not a plain file name.
 *
 * Every caller reaches the filesystem through this. The guard matters more now than it did: the
 * directory is no longer under `public`, so a name that escaped it would be reading somewhere on the
 * server rather than somewhere already published. `basename` collapses any path, and the pattern
 * then accepts only what this application writes — a UUID and an extension.
 */
export function mediaFilePath(name: string): string | null {
  const clean = basename(name);
  if (clean !== name) return null;
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(clean)) return null;
  if (clean.includes("..")) return null;
  return join(mediaDir(), clean);
}

/** The public URL for a stored file. The address is stable regardless of where the directory is. */
export function mediaUrlFor(fileName: string): string {
  return `/uploads/${fileName}`;
}

/** The file name inside a `/uploads/...` URL, or null when the URL is not one of ours. */
export function fileNameFromMediaUrl(url: string): string | null {
  if (!url.startsWith("/uploads/")) return null;
  const name = url.slice("/uploads/".length);
  return name && !name.includes("/") ? name : null;
}

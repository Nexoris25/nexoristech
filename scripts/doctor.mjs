/**
 * Checks that a deployment can actually reach everything it needs, before anyone tries to use it.
 *
 * Written because two failures on the VPS looked like application bugs and were both configuration:
 * a database port that was off by three, and a media origin that had never been reachable. Neither
 * says anything useful in the browser — the sign-in button appears to do nothing, and the images are
 * simply absent — so this asks every question directly and prints the answer.
 *
 * Run it on the server, from the repository root:  node scripts/doctor.mjs
 *
 * It never prints a password, a key or a token. Connection strings are shown with the credentials
 * replaced, because the host and port are the part worth reading.
 */
import { readFileSync, existsSync, writeFileSync, unlinkSync, readdirSync } from "node:fs";
import { createConnection } from "node:net";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const GREEN = "[32m", RED = "[31m", YELLOW = "[33m", DIM = "[2m", OFF = "[0m";
let failures = 0;
let warnings = 0;

const ok = (m, d = "") => console.log(`  ${GREEN}PASS${OFF}  ${m}${d ? `  ${DIM}${d}${OFF}` : ""}`);
const bad = (m, d = "") => { failures++; console.log(`  ${RED}FAIL${OFF}  ${m}${d ? `\n        ${d}` : ""}`); };
const warn = (m, d = "") => { warnings++; console.log(`  ${YELLOW}WARN${OFF}  ${m}${d ? `\n        ${d}` : ""}`); };
const head = (m) => console.log(`\n${m}\n${"-".repeat(m.length)}`);

/** Reads a KEY=VALUE file without adding a dependency, and without expanding anything. */
function readEnvFile(path) {
  if (!existsSync(path)) return null;
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

/** A connection string with the credentials taken out, so it can be shown in a terminal. */
function safeUrl(value) {
  try {
    const u = new URL(value);
    return `${u.protocol}//${u.username ? "***:***@" : ""}${u.hostname}:${u.port || "(default)"}${u.pathname}`;
  } catch {
    return "(unparseable)";
  }
}

/** Can anything at all be reached on this host and port? Answered before asking Postgres anything. */
function canConnect(host, port, timeout = 4000) {
  return new Promise((done) => {
    const socket = createConnection({ host, port });
    const finish = (result) => { socket.destroy(); done(result); };
    socket.setTimeout(timeout);
    socket.on("connect", () => finish(true));
    socket.on("timeout", () => finish(false));
    socket.on("error", () => finish(false));
  });
}

async function checkDatabase(label, value) {
  if (!value) { bad(`${label} is not set`); return; }
  let u;
  try { u = new URL(value); } catch { bad(`${label} is not a valid URL`, safeUrl(value)); return; }

  const host = u.hostname;
  const port = Number(u.port || 5432);
  const reachable = await canConnect(host, port);
  if (!reachable) {
    bad(
      `${label}: nothing is listening on ${host}:${port}`,
      `${safeUrl(value)}\n        This database has been served on port 5435. Check with:  ss -lntp | grep -E '543[0-9]'`,
    );
    return;
  }

  // The port answers; now find out whether it is Postgres and whether these credentials work.
  // pg is CommonJS, so an ESM import puts its exports on `default` rather than naming them.
  let Pool;
  try {
    const pg = await import(`file://${ROOT}/apps/admin/node_modules/pg/lib/index.js`);
    Pool = pg.Pool ?? pg.default?.Pool;
  } catch {
    Pool = undefined;
  }
  if (typeof Pool !== "function") {
    warn(`${label}: reachable on ${host}:${port}, but pg is not available here to verify the login`);
    return;
  }
  const pool = new Pool({ connectionString: value, connectionTimeoutMillis: 5000 });
  try {
    const { rows } = await pool.query("SELECT current_database() AS db, current_user AS usr");
    ok(`${label}`, `${safeUrl(value)} -> ${rows[0].db} as ${rows[0].usr}`);
  } catch (e) {
    bad(`${label}: ${host}:${port} answered, but the connection failed`, `${safeUrl(value)}\n        ${e.message}`);
  } finally {
    await pool.end().catch(() => {});
  }
}

async function checkHttp(label, base, path = "/", { expect = null, hint = "" } = {}) {
  if (!base) { bad(`${label} is not set`, hint); return; }
  let target;
  try { target = new URL(path, base).toString(); } catch { bad(`${label} is not a valid URL`, base); return; }
  try {
    const res = await fetch(target, { signal: AbortSignal.timeout(8000), redirect: "manual" });
    const good = expect ? expect.includes(res.status) : res.status < 500;
    (good ? ok : bad)(`${label}`, `${target} -> ${res.status}`);
    if (!good && hint) console.log(`        ${hint}`);
  } catch (e) {
    bad(`${label}: could not reach ${target}`, `${e.message}${hint ? `\n        ${hint}` : ""}`);
  }
}

const rootEnv = readEnvFile(resolve(ROOT, ".env")) ?? {};
const webEnv = readEnvFile(resolve(ROOT, "apps/web/.env.local"));
const adminEnv = readEnvFile(resolve(ROOT, "apps/admin/.env.local"));

console.log("\nNexoris platform: deployment check");
console.log("=================================");

head("Environment files");
for (const [label, path, env] of [
  ["repo root .env (Oge gateway)", ".env", rootEnv],
  ["apps/web/.env.local", "apps/web/.env.local", webEnv],
  ["apps/admin/.env.local", "apps/admin/.env.local", adminEnv],
]) {
  if (env) ok(label, `${Object.keys(env).length} values`);
  else bad(`${label} is missing`, `expected at ${path}`);
}

head("Admin platform (port 3102)");
if (adminEnv) {
  await checkDatabase("DATABASE_URL_ADMIN", adminEnv.DATABASE_URL_ADMIN);
  await checkDatabase("DATABASE_URL_CMS  ", adminEnv.DATABASE_URL_CMS);
  for (const key of ["ADMIN_SESSION_SECRET", "ADMIN_SETTINGS_KEY"]) {
    if (adminEnv[key]) ok(key, "set");
    else bad(`${key} is not set`, key === "ADMIN_SESSION_SECRET"
      ? "Sign-in throws without it: the session cannot be signed, so the login button appears to do nothing."
      : "Required before any credential can be sealed in the database.");
  }
  /*
   * Where uploads land, and whether that place survives a deployment.
   *
   * Checked because the alternative is finding out afterwards: media inside the application folder
   * was erased by the first deploy, and nothing reported it — the cms_media rows survived, so the
   * library went on listing files that were gone.
   */
  const store = adminEnv.MEDIA_STORAGE_PATH?.trim();
  if (!store) {
    warn(
      "MEDIA_STORAGE_PATH is not set",
      "Uploads go to apps/admin/public/uploads, inside the app. A deploy that replaces the app\n        directory erases every uploaded file while the database rows survive. Set it to /media/nexoris.",
    );
  } else if (!existsSync(store)) {
    bad(`MEDIA_STORAGE_PATH points at ${store}, which does not exist`,
        `sudo mkdir -p ${store} && sudo chown -R $USER:$USER ${store}`);
  } else {
    try {
      const probe = join(store, `.write-probe-${process.pid}`);
      writeFileSync(probe, "x");
      unlinkSync(probe);
      const count = readdirSync(store).filter((f) => !f.startsWith(".")).length;
      ok("MEDIA_STORAGE_PATH", `${store} · writable · ${count} file(s)`);
    } catch (e) {
      bad(`MEDIA_STORAGE_PATH ${store} is not writable by this user`, e.message);
    }
  }

  if (adminEnv.APP_URL && /^https?:\/\/(localhost|127\.)/i.test(adminEnv.APP_URL)) {
    warn("APP_URL is a loopback address", "Ignored in production, so invitation links use the request host. Set it to https://app.nexoristech.com or leave it unset.");
  }
  for (const key of ["ADMIN_SEED_EMAIL", "ADMIN_SEED_PASSWORD", "ADMIN_SEED_NAME"]) {
    if (adminEnv[key]) warn(`${key} is still set`, "Remove it: the seed script is idempotent and can recreate a retired administrator.");
  }
}

head("Public website (port 3000)");
if (webEnv) {
  await checkDatabase("DATABASE_URL_CMS  ", webEnv.DATABASE_URL_CMS);
  await checkHttp("CMS_MEDIA_BASE (images)", webEnv.CMS_MEDIA_BASE, "/uploads/", {
    expect: [200, 301, 302, 307, 308, 404],
    hint: "Every article image is fetched from here by the web server. If the admin is not running on this address, the site shows no pictures.",
  });
  await checkHttp("OGE_GATEWAY_URL", webEnv.OGE_GATEWAY_URL, "/health", {
    expect: [200],
    hint: "The chat widget, the solution finder and contact scoring all go through here.",
  });
}

head("Oge gateway (port 4000)");
await checkDatabase("DATABASE_URL_OGE  ", rootEnv.DATABASE_URL_OGE);
if (!rootEnv.GEMINI_API_KEY_PROJECT_A && !rootEnv.MISTRAL_API_KEY && !rootEnv.GROQ_API_KEY) {
  warn("No AI provider key is set", "The gateway answers, but every generated reply falls back to a template.");
}

console.log(`\n${failures === 0 ? `${GREEN}All checks passed${OFF}` : `${RED}${failures} check(s) failed${OFF}`}${warnings ? `, ${YELLOW}${warnings} warning(s)${OFF}` : ""}.\n`);
process.exit(failures === 0 ? 0 : 1);

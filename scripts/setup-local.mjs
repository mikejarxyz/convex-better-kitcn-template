import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { parseEnv } from "node:util";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function log(message) {
  console.log(`\n[setup] ${message}`);
}

export function createRunner(cwd, spawn = spawnSync) {
  const require = createRequire(join(cwd, "package.json"));
  return (tool, args, capture = false) => {
    const packagePath = require.resolve(`${tool}/package.json`);
    const metadata = JSON.parse(readFileSync(packagePath, "utf8"));
    const cli = join(dirname(packagePath), metadata.bin[tool]);
    log(`${tool} ${args.join(" ")}`);
    // Node entry points work on Windows without executing a .cmd through a shell.
    const result = spawn(process.execPath, [cli, ...args], {
      cwd,
      shell: false,
      encoding: "utf8",
      // KitCN can include returned private key material in a child-process
      // failure message, so buffer its output as well as explicit env reads.
      stdio: capture || tool === "kitcn" ? ["ignore", "pipe", "pipe"] : "inherit",
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
      // Captured output can contain auth secrets. Never include it in an error.
      throw new Error(`${tool} ${args.join(" ")} failed (exit ${result.status}).`);
    }
    return result.stdout?.trim() ?? "";
  };
}

export function assertDevTarget(env, requireDeployment = true) {
  if (env.CONVEX_DEPLOY_KEY || env.CONVEX_DEPLOYMENT_TOKEN ||
      env.CONVEX_SELF_HOSTED_URL || env.CONVEX_SELF_HOSTED_ADMIN_KEY) {
    throw new Error("Local setup requires a local or dev deployment, without deployment keys or self-hosted overrides.");
  }
  const deployment = env.CONVEX_DEPLOYMENT;
  if ((!deployment && requireDeployment) ||
      (deployment && !/^(anonymous|local|dev):[^\s]+$/.test(deployment))) {
    throw new Error("Local setup requires an anonymous, local, or dev CONVEX_DEPLOYMENT in .env.local.");
  }
}

export function serializeAuthValue(value) {
  // dotenv does not unescape JSON-style \" escapes inside double quotes.
  // Single/backtick quoting preserves the JSON key-set payload verbatim.
  const quote = ["'", "`"].find((candidate) => !value.includes(candidate));
  if (!quote) throw new Error("Managed auth value cannot be safely quoted in convex/.env.");
  return `${quote}${value}${quote}`;
}

export function bootstrap({ run, localAuth, saveAuth, target, siteUrl }) {
  const command = (tool, args, capture = false) => run(tool, [...args, ...target], capture);
  const read = (name) => command("convex", ["env", "get", name], true);
  // Convex 1.44 returns success with empty stdout for a missing env variable;
  // transport/auth failures are nonzero and must abort before any writes.
  const remote = Object.fromEntries(["BETTER_AUTH_SECRET", "JWKS"].map((name) => [name, read(name)]));
  for (const name of Object.keys(remote)) {
    if (localAuth[name] && remote[name] && localAuth[name] !== remote[name]) {
      if (name === "JWKS" && (remote[name] === "[]" || localAuth[name] === "[]")) continue;
      throw new Error(`${name} differs between convex/.env and this deployment. Reconcile the values before rerunning setup.`);
    }
  }
  // KitCN force-syncs convex/.env. Retain remote managed values when this
  // checkout has no local copy, especially BETTER_AUTH_SECRET.
  saveAuth(Object.fromEntries(Object.entries(remote).filter(([name, value]) =>
    value && (!localAuth[name] || (name === "JWKS" && localAuth[name] === "[]" && value !== "[]")))));
  command("convex", ["env", "set", "DEPLOY_ENV", "development"]);
  command("convex", ["env", "set", "SITE_URL", siteUrl]);
  if (!remote.JWKS) command("convex", ["env", "set", "JWKS", "[]"]);
  // Retain [] on failure: deleting it reintroduces the missing-env error.
  // Rerunning setup resumes this state without rotating real keys.
  command("kitcn", ["dev", "--bootstrap"]);
  const verifyKeys = () => {
    const raw = read("JWKS");
    let jwks;
    try { jwks = JSON.parse(raw); } catch { /* Do not echo private key material. */ }
    if (!Array.isArray(jwks) || jwks.length === 0 ||
        jwks.some((key) => !key?.publicKey || !key.privateKey || !key.id)) {
      throw new Error("Auth bootstrap is incomplete: JWKS has no usable signing keys. Rerun setup before starting the frontend.");
    }
    return raw;
  };
  // Replace any local placeholder before KitCN's next prepare phase syncs it.
  saveAuth({ JWKS: verifyKeys() });
  // A second bootstrap regenerates against real keys and deploys that result.
  // Standalone kitcn codegen cannot forward --env-file to Convex codegen.
  command("kitcn", ["dev", "--bootstrap"]);
  verifyKeys();
}

export function main(cwd = root) {
  const appEnvPath = join(cwd, ".env.local");
  const authEnvPath = join(cwd, "convex", ".env");
  const readEnv = (path) => existsSync(path) ? parseEnv(readFileSync(path, "utf8")) : {};
  assertDevTarget(process.env, false);
  assertDevTarget(readEnv(appEnvPath), false);
  for (const [source, destination] of [[".env.example", appEnvPath], ["convex/.env.example", authEnvPath]]) {
    if (!existsSync(destination)) {
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, readFileSync(join(cwd, source), "utf8"));
    }
  }
  const run = createRunner(cwd);
  run("convex", ["init"]);
  const appEnv = readEnv(appEnvPath);
  assertDevTarget(appEnv);
  log(`target: ${appEnv.CONVEX_DEPLOYMENT}`);
  const siteUrl = appEnv.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  new URL(siteUrl);
  bootstrap({
    run,
    localAuth: readEnv(authEnvPath),
    target: ["--env-file", appEnvPath],
    siteUrl,
    saveAuth(values) {
      const entries = Object.entries(values);
      if (!entries.length) return;
      const content = readFileSync(authEnvPath, "utf8").trimEnd();
      const current = parseEnv(content);
      const changed = entries.filter(([key, value]) => current[key] !== value);
      if (changed.length) {
        writeFileSync(authEnvPath, `${content}\n${changed.map(([key, value]) => `${key}=${serializeAuthValue(value)}`).join("\n")}\n`);
      }
    },
  });
  log("local setup complete");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    main();
  } catch (error) {
    console.error(`[setup] ${error.message}`);
    process.exitCode = 1;
  }
}

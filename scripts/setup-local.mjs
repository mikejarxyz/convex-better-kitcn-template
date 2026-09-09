import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function log(message) {
  console.log(`\n[setup] ${message}`);
}

function copyIfMissing(source, target) {
  if (existsSync(target)) {
    log(`${target.replace(`${root}\\`, "").replace(`${root}/`, "")} already exists`);
    return;
  }

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, readFileSync(source, "utf8"));
  log(`created ${target.replace(`${root}\\`, "").replace(`${root}/`, "")}`);
}

function run(command, args) {
  log(`${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: root,
    shell: false,
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

copyIfMissing(join(root, ".env.example"), join(root, ".env.local"));
copyIfMissing(join(root, "convex", ".env.example"), join(root, "convex", ".env"));

// Configure the deployment without pushing functions first. auth.config.ts uses
// static JWKS when available, so the first push needs a valid, fail-closed
// placeholder until KitCN can generate the real key set from the deployed auth
// runtime. No frontend is started during this bootstrap window.
run(pnpm, ["exec", "convex", "init"]);
run(pnpm, ["exec", "convex", "env", "set", "DEPLOY_ENV", "development"]);
run(pnpm, ["exec", "convex", "env", "set", "SITE_URL", "http://localhost:3000"]);
run(pnpm, ["exec", "convex", "env", "set", "JWKS", "[]"]);
run(pnpm, ["exec", "kitcn", "codegen"]);
run(pnpm, ["exec", "convex", "dev", "--once"]);
run(pnpm, ["exec", "kitcn", "env", "push", "--force"]);
run(pnpm, ["exec", "kitcn", "codegen"]);
run(pnpm, ["exec", "convex", "dev", "--once"]);

log("local setup complete");

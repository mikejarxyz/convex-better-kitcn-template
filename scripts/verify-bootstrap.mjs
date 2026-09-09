import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const setup = readFileSync(join(root, "scripts", "setup-local.mjs"), "utf8");
const authConfig = readFileSync(join(root, "app-auth.config.ts"), "utf8");
const signUpPage = readFileSync(
  join(root, "src", "app", "sign-up", "page.tsx"),
  "utf8",
);
const convexEnvExample = readFileSync(
  join(root, "convex", ".env.example"),
  "utf8",
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const init = setup.indexOf('["exec", "convex", "init"]');
const placeholder = setup.indexOf(
  '["exec", "convex", "env", "set", "JWKS", "[]"]',
);
const firstDeploy = setup.indexOf(
  '["exec", "convex", "dev", "--once"]',
);
const authPush = setup.indexOf(
  '["exec", "kitcn", "env", "push", "--force"]',
);
const finalDeploy = setup.lastIndexOf(
  '["exec", "convex", "dev", "--once"]',
);

assert(init >= 0, "setup must initialize Convex without deploying functions");
assert(
  init < placeholder && placeholder < firstDeploy,
  "fail-closed JWKS placeholder must be set after init and before first deploy",
);
assert(
  firstDeploy < authPush && authPush < finalDeploy,
  "KitCN must replace bootstrap auth values between the two deploys",
);
assert(
  !/^\s*(?:BETTER_AUTH_SECRET|JWKS)\s*=/m.test(convexEnvExample),
  "managed auth values must be absent, not blank, in convex/.env.example",
);
assert(
  /providers:\s*{[\s\S]*?credentials:\s*true,[\s\S]*?google:\s*false,/.test(
    authConfig,
  ),
  "credential auth must stay enabled and Google OAuth disabled by default",
);
assert(
  /AUTH_FEATURES\.google\s*&&\s*\(\s*<OAuthButtons/.test(signUpPage),
  "sign-up must hide Google OAuth when the provider is disabled",
);

console.log("bootstrap invariants verified");
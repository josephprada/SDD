import { spawnSync } from "node:child_process";
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const keys = await generateKeyPair("RS256", { extractable: true });
const privateKey = await exportPKCS8(keys.privateKey);
const publicKey = await exportJWK(keys.publicKey);
const jwtPrivateKey = privateKey.trimEnd().replace(/\n/g, " ");
const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

function setEnv(name, value) {
  const result = spawnSync("bunx", ["convex", "env", "set", name], {
    input: value,
    encoding: "utf8",
    stdio: ["pipe", "inherit", "inherit"],
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("Setting JWT_PRIVATE_KEY and JWKS on Convex deployment...");
setEnv("JWT_PRIVATE_KEY", jwtPrivateKey);
setEnv("JWKS", jwks);
console.log("Done. Restart `bunx convex dev` if it is already running.");

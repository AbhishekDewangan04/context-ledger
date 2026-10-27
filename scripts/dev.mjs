import { spawn } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const frontendPort = process.env.FRONTEND_PORT ?? "3000";
const backendPort = process.env.BACKEND_PORT ?? "4000";
const baseEnv = { ...process.env };
const spawnOptions = { stdio: "inherit" };
const run = (workspace, env) => {
  const args = ["run", "dev", "--workspace", workspace];
  if (process.platform === "win32") {
    return spawn(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", `npm ${args.join(" ")}`], {
      ...spawnOptions,
      env,
    });
  }
  return spawn(npm, args, { ...spawnOptions, env });
};
const children = [
  run("context-ledger-frontend", {
      ...baseEnv,
      PORT: frontendPort,
      NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL ?? `http://localhost:${backendPort}`,
  }),
  run("context-ledger-backend", {
      ...baseEnv,
      PORT: backendPort,
      FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN ?? `http://localhost:${frontendPort}`,
  }),
];

const stop = () => {
  for (const child of children) child.kill("SIGTERM");
};

process.on("SIGINT", stop);
process.on("SIGTERM", stop);

for (const child of children) {
  child.on("exit", (code) => {
    if (code && code !== 0) process.exitCode = code;
  });
}

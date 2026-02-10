#!/usr/bin/env node

const http = require("http");
const { spawn } = require("child_process");

const PORT = process.env.PORT || "3000";
const INTERVAL_SECONDS = Number(
  process.env.SERVER_WATCH_INTERVAL_SECONDS ||
    process.env.WATCH_INTERVAL_SECONDS ||
    "10",
);
const HEALTHCHECK_URL =
  process.env.DEV_SERVER_HEALTHCHECK_URL || `http://localhost:${PORT}/ebc`;
const START_COMMAND =
  process.env.DEV_SERVER_START_COMMAND || "bun run start";

if (!Number.isFinite(INTERVAL_SECONDS) || INTERVAL_SECONDS <= 0) {
  console.error(
    `Invalid SERVER_WATCH_INTERVAL_SECONDS: ${process.env.SERVER_WATCH_INTERVAL_SECONDS}`,
  );
  process.exit(1);
}

let child = null;
let isStarting = false;

const log = (message) => {
  const stamp = new Date().toISOString();
  console.log(`[watch-dev-server] ${stamp} ${message}`);
};

const spawnServer = () => {
  if (child || isStarting) return;
  isStarting = true;
  log(`Starting dev server: ${START_COMMAND}`);

  child = spawn(START_COMMAND, {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  child.on("exit", (code, signal) => {
    log(`Dev server exited (code ${code}, signal ${signal || "none"}).`);
    child = null;
    isStarting = false;
  });

  child.on("error", (err) => {
    log(`Failed to start dev server: ${err.message}`);
    child = null;
    isStarting = false;
  });

  setTimeout(() => {
    isStarting = false;
  }, 3000);
};

const checkServer = () => {
  const req = http.get(HEALTHCHECK_URL, (res) => {
    const healthy = res.statusCode && res.statusCode >= 200 && res.statusCode < 500;
    if (!healthy) {
      log(`Healthcheck status ${res.statusCode}, attempting restart.`);
      spawnServer();
    }
    res.resume();
  });

  req.setTimeout(3000, () => {
    req.destroy(new Error("Healthcheck timeout"));
  });

  req.on("error", () => {
    spawnServer();
  });
};

log(
  `Watching ${HEALTHCHECK_URL} every ${INTERVAL_SECONDS}s. Start command: ${START_COMMAND}`,
);
checkServer();
setInterval(checkServer, INTERVAL_SECONDS * 1000);

process.on("SIGINT", () => {
  log("Shutting down watch process.");
  if (child) child.kill("SIGINT");
  process.exit(0);
});
process.on("SIGTERM", () => {
  log("Shutting down watch process.");
  if (child) child.kill("SIGTERM");
  process.exit(0);
});

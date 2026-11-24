const { io: Client } = require("socket.io-client");
const { createAppContainer } = require("../../src/interfaces/container");

const TEST_ADMIN_KEY = "test-admin-secret";
const TEST_DEBUG_KEY = "test-debug-secret";

const silentLogger = {
  info: () => {},
  error: () => {},
};

const noopHistoryLogger = {
  append: () => {},
  updatePseudo: () => {},
  flushSync: () => {},
};

/**
 * Crée et démarre une instance complète du serveur via le container Clean Architecture
 * sur un port aléatoire (port 0) pour l'isolation totale entre suites de tests.
 */
async function createTestServer(opts = {}) {
  const container = createAppContainer({
    port: 0,
    adminKey: opts.adminKey !== undefined ? opts.adminKey : TEST_ADMIN_KEY,
    debugKey: opts.debugKey !== undefined ? opts.debugKey : TEST_DEBUG_KEY,
    enforceOriginPolicy: opts.enforceOriginPolicy ?? false,
    maxConnections: opts.maxConnections ?? 100,
    rateLimitCleanupMs: 0,
    historyLogger: noopHistoryLogger,
    logger: opts.logger || silentLogger,
  });

  const { port } = await container.start();
  const url = `http://localhost:${port}`;

  return {
    container,
    io: container.io,
    httpServer: container.httpServer,
    sessionRepository: container.sessionRepository,
    lotStateRepository: container.lotStateRepository,
    url,
    stop: () => container.stop(),
  };
}

function connectClient(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const socket = Client(url, {
      transports: ["websocket"],
      forceNew: true,
      ...opts,
    });
    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", reject);
  });
}

function disconnectClient(socket) {
  return new Promise((resolve) => {
    if (!socket.connected) return resolve();
    socket.once("disconnect", resolve);
    socket.disconnect();
  });
}

function waitFor(socket, event, timeout = 2000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout waiting for "${event}"`)),
      timeout
    );
    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

module.exports = {
  TEST_ADMIN_KEY,
  TEST_DEBUG_KEY,
  createTestServer,
  connectClient,
  disconnectClient,
  waitFor,
};

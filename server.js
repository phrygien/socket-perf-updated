/**
 * Point d'entrée principal — Auctav Live Sales Socket.IO Server
 * Architecture Clean Architecture : délègue l'assemblage au container DI.
 */
const { createAppContainer } = require("./src/interfaces/container");

const container = createAppContainer();
const { logger } = container;

container.start().catch((err) => {
  logger.error(`[FATAL] Échec démarrage serveur : ${err.message}`);
  process.exit(1);
});

async function shutdown(signal) {
  logger.info(`${signal} reçu — arrêt propre`);
  try {
    await container.stop();
  } catch (err) {
    logger.error(`[SHUTDOWN] Erreur arrêt : ${err.message}`);
  }
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("uncaughtException", (err) => {
  logger.error(`[FATAL] uncaughtException: ${err.message}`);
  logger.error(err.stack || "");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error(`[FATAL] unhandledRejection: ${reason}`);
  process.exit(1);
});
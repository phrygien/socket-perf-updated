/**
 * Service applicatif de gestion des timers de fin de vente.
 */
class SaleEndTimerService {
  constructor({ realtimeGateway, logger }) {
    this.realtimeGateway = realtimeGateway;
    this.logger = logger;
    this.roomEndTimers = new Map();
  }

  updateTimer(room, time) {
    if (!time || time <= 0) return;

    const existing = this.roomEndTimers.get(room);
    const currentRemaining = existing
      ? existing.maxTime - Math.floor((Date.now() - existing.updatedAt) / 1000)
      : 0;

    if (!existing || time > currentRemaining) {
      this.logger.info(`[SALE-END] Nouveau max room=${room} : ${time}s`);

      if (existing?.intervalId) {
        clearInterval(existing.intervalId);
      }

      const entry = {
        maxTime: time,
        updatedAt: Date.now(),
        intervalId: null,
      };

      entry.intervalId = setInterval(() => {
        const elapsed = Math.floor((Date.now() - entry.updatedAt) / 1000);
        const remaining = entry.maxTime - elapsed;

        if (remaining <= 0) {
          clearInterval(entry.intervalId);
          this.roomEndTimers.delete(room);
          this.logger.info(`[SALE-END] Vente terminée : room=${room}`);
          this.realtimeGateway.emitToRoom(room, "saleEndTimer", {
            room,
            remainingSeconds: 0,
            ended: true,
          });
          return;
        }

        this.realtimeGateway.emitToRoom(room, "saleEndTimer", {
          room,
          remainingSeconds: remaining,
          ended: false,
        });
      }, 30000);

      this.roomEndTimers.set(room, entry);

      this.realtimeGateway.emitToRoom(room, "saleEndTimer", {
        room,
        remainingSeconds: time,
        ended: false,
      });
    }
  }

  clearTimer(room) {
    const entry = this.roomEndTimers.get(room);
    if (!entry) return;
    clearInterval(entry.intervalId);
    this.roomEndTimers.delete(room);
    this.logger.info(`[SALE-END] Timer supprimé : room=${room}`);
  }

  clearAll() {
    for (const entry of this.roomEndTimers.values()) {
      clearInterval(entry.intervalId);
    }
    this.roomEndTimers.clear();
  }

  getRemaining(room) {
    const entry = this.roomEndTimers.get(room);
    if (!entry) return null;
    const elapsed = Math.floor((Date.now() - entry.updatedAt) / 1000);
    return Math.max(0, entry.maxTime - elapsed);
  }

  getActiveTimers() {
    const result = {};
    for (const [room, entry] of this.roomEndTimers.entries()) {
      const elapsed = Math.floor((Date.now() - entry.updatedAt) / 1000);
      result[room] = {
        maxTime: entry.maxTime,
        remainingSeconds: Math.max(0, entry.maxTime - elapsed),
      };
    }
    return result;
  }
}

module.exports = SaleEndTimerService;

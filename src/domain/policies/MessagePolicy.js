const ALLOWED_ROOM_MESSAGE_TYPES = new Set([
  "listLot",
  "numLot",
  "previousLot",
  "message",
  "users",
  "closeEnchere",
  "updateLot",
]);

const ADMIN_ONLY_ROOM_MESSAGE_TYPES = new Set([
  "listLot",
  "numLot",
  "previousLot",
  "closeEnchere",
  "updateLot",
]);

/**
 * Règles métier pures de validation et d'autorisation des messages de salle.
 */
class MessagePolicy {
  static isValidRoomName(room) {
    return typeof room === "string" && room.trim().length > 0;
  }

  static isValidMessageType(type) {
    return typeof type === "string" && type.trim().length > 0;
  }

  static isAllowedType(type) {
    return ALLOWED_ROOM_MESSAGE_TYPES.has(type);
  }

  static requiresAdmin(type) {
    return ADMIN_ONLY_ROOM_MESSAGE_TYPES.has(type);
  }

  /**
   * Normalise un message confirmEnchere pour compatibilité ascendante :
   * si price est absent mais myEnchere est présent, copie myEnchere vers price.
   */
  static normalizeConfirmEncherePayload(type, msg) {
    if (type !== "confirmEnchere" || !msg || typeof msg !== "object") {
      return { normalizedMsg: msg || {}, mappedPrice: false };
    }

    if (msg.price === undefined && msg.myEnchere !== undefined) {
      return {
        normalizedMsg: { ...msg, price: msg.myEnchere },
        mappedPrice: true,
      };
    }

    return { normalizedMsg: msg, mappedPrice: false };
  }
}

module.exports = {
  MessagePolicy,
  ALLOWED_ROOM_MESSAGE_TYPES,
  ADMIN_ONLY_ROOM_MESSAGE_TYPES,
};

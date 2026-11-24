/**
 * Entité métier représentant la session d'un socket connecté.
 */
class SocketSession {
  constructor({
    socketId,
    pseudo = "unknown",
    room = null,
    email = "",
    isAdmin = false,
  }) {
    this.socketId = socketId;
    this.pseudo = pseudo;
    this.room = room;
    this.email = email;
    this.isAdmin = Boolean(isAdmin);
  }

  static createDefault(socketId) {
    return new SocketSession({ socketId });
  }

  static fromJSON(data) {
    if (!data) return null;
    return new SocketSession(data);
  }

  promoteToAdmin(pseudo) {
    const cleanPseudo =
      typeof pseudo === "string" && pseudo.trim()
        ? pseudo.trim().slice(0, 50)
        : "Admin";
    this.pseudo = cleanPseudo;
    this.isAdmin = true;
    return cleanPseudo;
  }

  updatePseudo(pseudo) {
    if (typeof pseudo !== "string" || !pseudo.trim()) return null;
    this.pseudo = pseudo.trim();
    return this.pseudo;
  }

  joinRoom(room) {
    const previousRoom = this.room;
    this.room = room;
    return previousRoom;
  }

  updateBidderProfile({ name, email, room } = {}) {
    if (name) this.pseudo = name;
    if (email !== undefined) this.email = email || "";
    if (room) this.room = room;
  }

  isFollower() {
    return Boolean(this.pseudo && this.pseudo.startsWith("Follow_"));
  }

  isScreen() {
    return Boolean(this.pseudo && this.pseudo.startsWith("Screen_"));
  }

  toJSON() {
    return {
      socketId: this.socketId,
      pseudo: this.pseudo,
      room: this.room,
      email: this.email,
      isAdmin: this.isAdmin,
    };
  }
}

module.exports = SocketSession;

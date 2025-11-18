export class TelegramClient {
  constructor(bot) {
    this.bot = bot;
    this.messageIds = []; // { chatId, messageId }
  }

  async sendMessage(chatId, text, options = {}) {
    const msg = await this.bot.sendMessage(chatId, text, options);
    this.messageIds.push({ chatId, messageId: msg.message_id });
    return msg;
  }

  async sendPersistentMessage(chatId, text, options = {}) {
    // Same as sendMessage but no tracking
    return this.bot.sendMessage(chatId, text, options);
  }

  async clearMessages() {
    const deletes = this.messageIds.map(({ chatId, messageId }) =>
        this.bot.deleteMessage(chatId, messageId).catch(() => {})
    );
  await Promise.allSettled(deletes);
  this.messageIds = [];
}
}

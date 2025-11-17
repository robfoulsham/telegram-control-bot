require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const { startInstance, stopInstance, getInstanceStatus } = require('./aws');

const app = express();
app.use(express.json());

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
const ALLOWED_CHAT_ID = parseInt(process.env.ALLOWED_CHAT_ID);
const FAILOVER_INSTANCE_ID = process.env.FAILOVER_EC2_INSTANCE_ID;

// Helpers to wrap AWS calls and send messages
async function checkFailover(chatId, instanceId) {
  const status = await getInstanceStatus(instanceId);
  bot.sendMessage(chatId, `EC2 instance ${instanceId} is currently: ${status}`);
}

async function startFailover(chatId, instanceId) {
  const result = await startInstance(instanceId);
  if (result.success) {
    bot.sendMessage(chatId, `EC2 instance ${instanceId} is starting...`);
  } else {
    bot.sendMessage(chatId, `Error starting instance: ${result.error.message}`);
  }
}

async function stopFailover(chatId, instanceId) {
  const result = await stopInstance(instanceId);
  if (result.success) {
    bot.sendMessage(chatId, `EC2 instance ${instanceId} is stopping...`);
  } else {
    bot.sendMessage(chatId, `Error stopping instance: ${result.error.message}`);
  }
}

// Telegram webhook endpoint
app.post(`/webhook/xyz123`, async (req, res) => {
  const update = req.body;

  if (update.message && update.message.chat.id === ALLOWED_CHAT_ID) {
    const chatId = update.message.chat.id;

    if (update.message.text === '/start') {
      const mainMenu = {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Start Home Failover", callback_data: 'start_failover' }],
            [{ text: "Stop Home Failover", callback_data: 'stop_failover' }],
            [{ text: "Check Home Failover Status", callback_data: 'check_failover' }],
          ]
        }
      };
      bot.sendMessage(chatId, "Welcome! Choose a command:", mainMenu);
    }
  }

  if (update.callback_query && update.callback_query.from.id === ALLOWED_CHAT_ID) {
    const msg = update.callback_query.message;
    switch (update.callback_query.data) {
      case 'start_failover':
        await startFailover(msg.chat.id, RODING_INSTANCE_ID);
        break;
      case 'stop_failover':
        await stopFailover(msg.chat.id, RODING_INSTANCE_ID);
        break;
      case 'check_failover':
        await checkFailover(msg.chat.id, RODING_INSTANCE_ID);
        break;
    }
  }

  res.sendStatus(200);
});

// Health endpoint
app.get('/health', async (req, res) => {
  const status = await getInstanceStatus(FAILOVER_INSTANCE_ID);
  res.status(200).json({ status: 'ok', ec2: status });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot server running on port ${PORT}`));

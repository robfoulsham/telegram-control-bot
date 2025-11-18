import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { startInstance, stopInstance, getInstanceStatus } from "./aws.js";

import {
  getRuleState,
  enableRule,
  disableRule
} from "./eventBridgeClient.js";

import TelegramBot from 'node-telegram-bot-api';
import { TelegramClient } from './telegram-client.js';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
const tg = new TelegramClient(bot);

const app = express();
app.use(express.json());

const ALLOWED_CHAT_ID = parseInt(process.env.ALLOWED_CHAT_ID);
const FAILOVER_INSTANCE_ID = process.env.FAILOVER_EC2_INSTANCE_ID;
const FAILOVER_EVENTBRIDGE_NAME = 'server-failover-every-minute';

// Helpers to wrap AWS calls and send messages
async function checkFailover(chatId, instanceId) {
  console.log('Checking failover')
  const status = await getInstanceStatus(instanceId);
  const ruleState = await getRuleState(FAILOVER_EVENTBRIDGE_NAME);
  await tg.clearMessages();
  await tg.sendMessage(chatId, `EC2 instance ${instanceId} is currently: ${status}.`);
  await tg.sendMessage(chatId, `Event Bridge rule is ${ruleState}`);
}

export async function startFailover(chatId, instanceId) {
  console.log('Starting failover');
  const result = await startInstance(instanceId);

  await tg.clearMessages();
  await tg.sendMessage('Starting failover...');

  if (result.success) {
    await tg.sendMessage(chatId, `EC2 instance ${instanceId} is ${result.currentState} (was: ${result.previousState})`
    );
  } else {
    await tg.sendMessage(chatId, `Error starting instance: ${result.error?.message || 'unknown error'}`
    );
  }
}

export async function stopFailover(chatId, instanceId) {
  console.log('Stopping failover');
  const result = await stopInstance(instanceId);

  await tg.clearMessages();
  await tg.sendMessage('Stopping failover...');

  if (result.success) {
    await tg.sendMessage(chatId, `EC2 instance ${instanceId} is ${result.currentState} (was: ${result.previousState})`);
  } else {
    await tg.sendMessage(chatId, `Error stopping instance: ${result.error?.message || 'unknown error'}`);
  }
}

async function enableAutoFailover(chatId) {
  console.log('Enabling auto failover');
  const result = await enableRule(FAILOVER_EVENTBRIDGE_NAME);
  if (result) {
    await tg.clearMessages();
    await tg.sendMessage(chatId, 'Successfully enabled Event Bridge rule');
  } else {
    console.log('issue: ', result)
    await tg.clearMessages();
    await tg.sendMessage(chatId, 'Issue while enabling Event Bridge Rule');
  }
}

async function disableAutoFailover(chatId) {
  console.log('Disabling auto failover');
  const result = await disableRule(FAILOVER_EVENTBRIDGE_NAME);
  if (result) {
    await tg.clearMessages();
    await tg.sendMessage(chatId, 'Successfully disabled Event Bridge rule');
  } else {
    console.log('issue: ', result)
    await tg.clearMessages();
    await tg.sendMessage(chatId, 'Issue while disabling Event Bridge Rule');
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
            [{ text: "Enable auto failover", callback_data: 'enable_auto' }],
            [{ text: "Disable auto failover", callback_data: 'disable_auto' }],
          ]
        }
      };
      await tg.clearMessages();
      await tg.sendPersistentMessage(chatId, "Welcome! Choose a command:", mainMenu);
    }
  }

  if (update.callback_query && update.callback_query.from.id === ALLOWED_CHAT_ID) {
    const msg = update.callback_query.message;
    switch (update.callback_query.data) {
      case 'start_failover':
        await startFailover(msg.chat.id, FAILOVER_INSTANCE_ID);
        break;
      case 'stop_failover':
        await stopFailover(msg.chat.id, FAILOVER_INSTANCE_ID);
        break;
      case 'check_failover':
        await checkFailover(msg.chat.id, FAILOVER_INSTANCE_ID);
        break;
      case 'enable_auto':
        await enableAutoFailover(msg.chat.id);
        break;
      case 'disable_auto':
        await disableAutoFailover(msg.chat.id);
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

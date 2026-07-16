require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const botController = require('./controllers/botController');

const app = express();
const port = process.env.PORT || 3100;

app.use(express.json());

// Inisialisasi Bot dengan telegraf
const bot = new Telegraf(process.env.BOT_TOKEN);

// Kirim instance bot ke controller
botController.setBot(bot);

// Endpoint webhook
app.post(`/webhook/${process.env.WEBHOOK_SECRET}`, (req, res) => {
    botController.handleUpdate(req, res);
});

app.listen(port, () => {
    console.log(`🚀 Bot Ismuba berjalan di port ${port}`);
});
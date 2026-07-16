require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const botController = require('./controllers/botController');

const app = express();
const port = process.env.PORT || 3100;

// Middleware untuk parsing raw JSON dari Telegram (wajib!)
app.use(express.json());

// Inisialisasi Bot dengan token
const bot = new TelegramBot(process.env.BOT_TOKEN);

// Kirim instance bot ke controller agar bisa dipakai di semua handler
botController.setBot(bot);

// Endpoint webhook yang akan dipanggil Telegram
app.post(`/webhook/${process.env.WEBHOOK_SECRET}`, (req, res) => {
    botController.handleUpdate(req, res);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', bot: 'Ismuba Bot', timestamp: new Date().toISOString() });
});

// Jalankan server
app.listen(port, () => {
    console.log(`🚀 Bot Ismuba berjalan di port ${port}`);
});
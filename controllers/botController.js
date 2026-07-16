let bot;

const setBot = (instance) => {
    bot = instance;
};

const handleUpdate = (req, res) => {
    // Telegraf handle update via middleware, tapi kita manual proses
    // Karena kita pakai webhook, kita perlu proses update secara manual
    bot.handleUpdate(req.body)
        .then(() => {
            res.sendStatus(200);
        })
        .catch((err) => {
            console.error('Error handling update:', err);
            res.sendStatus(500);
        });
};

// Fungsi kirim pesan sambutan + tombol salam
const sendWelcomeMessage = (chatId) => {
    const message = `Assalamu'alaikum, selamat datang! 🌟\n\nKlik tombol di bawah untuk menjawab salam atau memulai interaksi.`;
    
    bot.telegram.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🕌 Assalamu\'alaikum', callback_data: 'salam' }]
            ]
        }
    });
};

// Fungsi kirim hanya tombol salam
const sendSalamButton = (chatId) => {
    bot.telegram.sendMessage(chatId, 'Klik tombol di bawah untuk menjawab salam lagi:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🕌 Assalamu\'alaikum', callback_data: 'salam' }]
            ]
        }
    });
};

// Handler untuk start command
bot.start((ctx) => {
    sendWelcomeMessage(ctx.chat.id);
});

// Handler untuk callback query
bot.action('salam', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('Wa\'alaikumussalam warahmatullahi wabarakatuh.');
    sendSalamButton(ctx.chat.id);
});

module.exports = { setBot, handleUpdate };
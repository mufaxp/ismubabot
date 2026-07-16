let bot;

const setBot = (instance) => {
    bot = instance;
};

// Handler utama untuk semua update dari Telegram
const handleUpdate = (req, res) => {
    const update = req.body;

    // Kirim respon 200 OK ke Telegram agar tidak diulang (wajib)
    res.sendStatus(200);

    // Jika ada pesan (termasuk klik tombol /start atau teks)
    if (update.message) {
        const chatId = update.message.chat.id;
        const text = update.message.text;

        // Handler untuk perintah /start (termasuk saat user klik tombol START bawaan Telegram)
        if (text === '/start') {
            sendWelcomeMessage(chatId);
        }
        // (Nanti kita tambahkan handler teks bebas di sini)
    }

    // Jika ada callback_query (klik Inline Keyboard)
    if (update.callback_query) {
        const chatId = update.callback_query.message.chat.id;
        const data = update.callback_query.data;
        const messageId = update.callback_query.message.message_id;

        // Jawab callback agar tombol tidak berputar-putar (loading)
        bot.answerCallbackQuery(update.callback_query.id);

        if (data === 'salam') {
            bot.sendMessage(chatId, 'Wa\'alaikumussalam warahmatullahi wabarakatuh.');
            // Optional: kita kirim ulang tombol salamnya agar tetap muncul
            sendRoleMenu(chatId);
        }

            // Handler untuk tombol Guru
        if (data === 'role_guru') {
            bot.answerCallbackQuery(update.callback_query.id);
            bot.sendMessage(chatId, 'Fitur untuk Guru sedang dalam pengembangan.\n\n(Menu Guru akan segera hadir!)');
            // Kirim ulang menu agar user bisa pilih lagi
            sendRoleMenu(chatId);
        }

        // Handler untuk tombol Siswa
        if (data === 'role_siswa') {
            bot.answerCallbackQuery(update.callback_query.id);
            bot.sendMessage(chatId, 'Fitur untuk Siswa sedang dalam pengembangan.\n\n(Menu Siswa akan segera hadir!)');
            // Kirim ulang menu agar user bisa pilih lagi
            sendRoleMenu(chatId);
        }
    }
};

// Fungsi kirim pesan sambutan + tombol salam
const sendWelcomeMessage = (chatId) => {
    const message = `Assalamu'alaikum, selamat datang!`;
    
    const options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Wa\'alaikumussalam', callback_data: 'salam' }]
            ]
        }
    };

    bot.sendMessage(chatId, message, options);
};

// Fungsi kirim pilihan role
const sendRoleMenu = (chatId) => {
    const options = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Guru', callback_data: 'role_guru' },
                    { text: 'Siswa', callback_data: 'role_siswa' }
                ]
            ]
        }
    };
    bot.sendMessage(chatId, 'Silakan pilih menu berikut:', options);
};

module.exports = { setBot, handleUpdate };
const db = require('../config/db');

let bot;

const setBot = (instance) => {
    bot = instance;
};

// method user state
const getSession = async (telegramId) => {
    const [rows] = await db.query('SELECT * FROM sessions WHERE telegram_id = ?', [telegramId]);
    return rows[0] || null;
};

const upsertSession = async (telegramId, step, jenjang = null, kelasId = null, siswaId = null) => {
    await db.query(
        `INSERT INTO sessions (telegram_id, current_step, selected_jenjang, selected_kelas_id, selected_siswa_id)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         current_step = VALUES(current_step),
         selected_jenjang = VALUES(selected_jenjang),
         selected_kelas_id = VALUES(selected_kelas_id),
         selected_siswa_id = VALUES(selected_siswa_id)`,
        [telegramId, step, jenjang, kelasId, siswaId]
    );
};

const deleteSession = async (telegramId) => {
    await db.query('DELETE FROM sessions WHERE telegram_id = ?', [telegramId]);
};

// method kirim menu
// Menu utama untuk Siswa (tampilkan jenjang)
const sendJenjangMenu = async (chatId) => {
    const [rows] = await db.query('SELECT * FROM jenjang ORDER BY id');
    const buttons = rows.map(j => [{ text: j.nama, callback_data: `jenjang|${j.nama}` }]);
    
    // Tambahkan tombol Kembali
    buttons.push([{ text: '🔙 Kembali', callback_data: 'main_menu' }]);

    await bot.sendMessage(chatId, '📚 Pilih jenjang Anda:', {
        reply_markup: { inline_keyboard: buttons }
    });
};

// Menu Kelas berdasarkan jenjang
const sendKelasMenu = async (chatId, jenjang) => {
    const [rows] = await db.query(
        `SELECT k.* FROM kelas k
         JOIN jenjang j ON k.jenjang_id = j.id
         WHERE j.nama = ?`,
        [jenjang]
    );
    
    if (rows.length === 0) {
        await bot.sendMessage(chatId, '⚠️ Belum ada kelas untuk jenjang ini.');
        return sendJenjangMenu(chatId);
    }

    const buttons = rows.map(k => [{ text: k.nama_kelas, callback_data: `kelas|${k.id}` }]);
    buttons.push([{ text: '🔙 Kembali', callback_data: 'menu_siswa' }]);

    await bot.sendMessage(chatId, `🏫 Pilih kelas (${jenjang}):`, {
        reply_markup: { inline_keyboard: buttons }
    });
};

// Menu Siswa berdasarkan kelas
const sendSiswaMenu = async (chatId, kelasId) => {
    const [rows] = await db.query(
        'SELECT * FROM siswa WHERE kelas_id = ? ORDER BY nama_lengkap',
        [kelasId]
    );

    if (rows.length === 0) {
        await bot.sendMessage(chatId, '⚠️ Belum ada siswa di kelas ini.');
        // Ambil jenjang dari session untuk kembali
        const session = await getSession(chatId);
        if (session) {
            await sendKelasMenu(chatId, session.selected_jenjang);
        } else {
            await sendJenjangMenu(chatId);
        }
        return;
    }

    const buttons = rows.map(s => [{ text: s.nama_lengkap, callback_data: `siswa|${s.id}` }]);
    // Tambahkan tombol kembali ke menu kelas
    buttons.push([{ text: '🔙 Kembali ke Kelas', callback_data: 'back_to_kelas' }]);

    await bot.sendMessage(chatId, '👤 Pilih nama Anda:', {
        reply_markup: { inline_keyboard: buttons }
    });
};

// Konfirmasi pilih siswa & minta upload
const askUpload = async (chatId, siswaId) => {
    const [siswa] = await db.query('SELECT nama_lengkap FROM siswa WHERE id = ?', [siswaId]);
    if (siswa.length === 0) {
        await bot.sendMessage(chatId, '⚠️ Data siswa tidak ditemukan.');
        return sendJenjangMenu(chatId);
    }

    await upsertSession(chatId, 'waiting_upload', null, null, siswaId);
    await bot.sendMessage(
        chatId,
        `📸 *${siswa[0].nama_lengkap}*, silakan kirim **foto** (bisa langsung jepret) atau **voice note** sebagai bukti Maghrib Mengaji hari ini.\n\n` +
        `⏰ Ingat, laporan hanya bisa 1 kali sehari!`,
        { parse_mode: 'Markdown' }
    );
};

// handler utama
const handleUpdate = (req, res) => {
    const update = req.body;
    res.sendStatus(200);

    // Handler pesan teks (termasuk /start)
    if (update.message) {
        const chatId = update.message.chat.id;
        const text = update.message.text;

        if (text === '/start') {
            sendWelcomeMessage(chatId);
        }
        // TODO: nanti handle upload foto/voice di sini (Tahap 2)
    }

    // Handler callback_query (klik tombol)
    if (update.callback_query) {
        const chatId = update.callback_query.message.chat.id;
        const data = update.callback_query.data;
        const queryId = update.callback_query.id;

        bot.answerCallbackQuery(queryId);

        // tombol salam
        if (data === 'salam') {
            bot.sendMessage(chatId, 'Wa\'alaikumussalam warahmatullahi wabarakatuh.');
            sendRoleMenu(chatId);
        }

        // main menu
        if (data === 'main_menu') {
            deleteSession(chatId);
            sendRoleMenu(chatId);
        }

        // menu jenjang
        if (data === 'menu_siswa' || data === 'role_siswa') {
            upsertSession(chatId, 'menu_siswa');
            sendJenjangMenu(chatId);
        }

        // pilih jenjang
        if (data.startsWith('jenjang|')) {
            const jenjang = data.split('|')[1];
            upsertSession(chatId, 'pilih_kelas', jenjang);
            sendKelasMenu(chatId, jenjang);
        }

        // pilih kelas
        if (data.startsWith('kelas|')) {
            const kelasId = parseInt(data.split('|')[1]);
            upsertSession(chatId, 'pilih_siswa', null, kelasId);
            sendSiswaMenu(chatId, kelasId);
        }

        // back to kelas
        if (data === 'back_to_kelas') {
            const session = awaitSession(chatId);
        }

        // pilih role siswa
        if (data.startsWith('siswa|')) {
            const siswaId = parseInt(data.split('|')[1]);
            askUpload(chatId, siswaId);
        }

        // role guru (coming soon)
        if (data === 'role_guru') {
            bot.sendMessage(chatId, 'Fitur Guru sedang dalam pengembangan.');
            sendRoleMenu(chatId);
        }
    }
};

// method awal (salam dan pilih role)
const sendWelcomeMessage = async (chatId) => {
    await deleteSession(chatId);
    const message = `Assalamu'alaikum, selamat datang!`;
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: `Wa'alaikumussalam`, callback_data: 'salam' }]
            ]
        }
    });
};

const sendRoleMenu = async (chatId) => {
    await bot.sendMessage(chatId, 'Silakan pilih menu berikut:', {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Guru', callback_data: 'role_guru' },
                    { text: 'Siswa', callback_data: 'role_siswa' }
                ]
            ]
        }
    });
};

module.exports = { setBot, handleUpdate };
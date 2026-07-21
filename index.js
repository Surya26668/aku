const express = require('express');
const axios = require('axios');
const { google } = require('googleapis');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.TELEGRAM_TOKEN;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// Inisialisasi Google Sheets API menggunakan Service Account
const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json', // File JSON dari Google Cloud Console
  scopes: ['https://googleapis.com'],
});

app.post('/webhook', async (req, res) => {
  try {
    const update = req.body;
    if (!update.message) return res.sendStatus(200);

    const msg = update.message;
    const chatId = msg.chat.id;
    const username = msg.from.first_name + (msg.from.last_name ? " " + msg.from.last_name : "");
    const date = new Date(msg.date * 1000).toISOString();
    
    let dataType = "Teks";
    let dataContent = "";

    if (msg.text) {
      dataType = "Teks";
      dataContent = msg.text;
    } else if (msg.photo) {
      dataType = "Foto";
      const fileId = msg.photo[msg.photo.length - 1].file_id;
      dataContent = await getTelegramFileLink(fileId);
    } else if (msg.document) {
      dataType = "Dokumen";
      const fileId = msg.document.file_id;
      dataContent = await getTelegramFileLink(fileId);
    } else {
      dataType = "Lainnya";
      dataContent = "Jenis data tidak didukung.";
    }

    // Simpan ke Google Sheets via REST API
    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:E', // Sesuaikan nama sheet Anda
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[date, chatId, username, dataType, dataContent]],
      },
    });

    // Kirim balasan ke Telegram
    await sendTelegramMessage(chatId, `✅ Data berjenis [${dataType}] berhasil diterima dan disimpan!`);

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

async function getTelegramFileLink(fileId) {
  const url = `https://telegram.org{TOKEN}/getFile?file_id=${fileId}`;
  const response = await axios.get(url);
  if (response.data.ok) {
    return `https://telegram.org{TOKEN}/${response.data.result.file_path}`;
  }
  return "Gagal mengambil link file";
}

async function sendTelegramMessage(chatId, text) {
  const url = `https://telegram.org{TOKEN}/sendMessage`;
  await axios.post(url, { chat_id: chatId, text: text });
}

app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));

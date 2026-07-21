// Token Bot Telegram Anda
var TOKEN = "7995283596:AAG9jfaG5vTTyUBMokaDVaNpXTG6-NZWOU4";

// ID Spreadsheet asli Anda yang sudah diverifikasi
var SPREADSHEET_ID = "19BJ7FDUtKEaP8Y_jGsPBqhA5LVGmmINKxzQR3sat-2I";

function doPost(e) {
  try {
    // 1. Membaca data masuk dari webhook Telegram
    var update = JSON.parse(e.postData.contents);
    if (!update.message) return HtmlService.createHtmlOutput("No Message");

    var msg = update.message;
    var chatId = msg.chat.id;
    
    // Menggabungkan nama depan dan nama belakang user jika ada
    var username = msg.from.first_name + (msg.from.last_name ? " " + msg.from.last_name : "");
    
    // Konversi waktu dari Telegram timestamp ke format waktu lokal
    var date = new Date(msg.date * 1000);
    
    var dataType = "Lainnya";
    var dataContent = "";

    // 2. Logika Deteksi Multi-Media (Teks, Foto, Video, File, Audio, Voice, Stiker)
    if (msg.text) {
      dataType = "Teks";
      dataContent = msg.text;
    } 
    else if (msg.photo) {
      dataType = "Foto";
      var fileId = msg.photo[msg.photo.length - 1].file_id; // Mengambil resolusi tertinggi
      dataContent = getTelegramFileLink(fileId);
    } 
    else if (msg.video) {
      dataType = "Video";
      var fileId = msg.video.file_id;
      dataContent = getTelegramFileLink(fileId);
    }
    else if (msg.document) {
      dataType = "Dokumen";
      var fileId = msg.document.file_id;
      dataContent = getTelegramFileLink(fileId);
    } 
    else if (msg.audio) {
      dataType = "Audio";
      var fileId = msg.audio.file_id;
      dataContent = getTelegramFileLink(fileId);
    }
    else if (msg.voice) {
      dataType = "Voice Note";
      var fileId = msg.voice.file_id;
      dataContent = getTelegramFileLink(fileId);
    }
    else if (msg.sticker) {
      dataType = "Stiker";
      var fileId = msg.sticker.file_id;
      dataContent = getTelegramFileLink(fileId);
    }
    else {
      dataType = "Tidak Diketahui";
      dataContent = "Jenis media belum didukung oleh sistem.";
    }

    // 3. Memasukkan data ke dalam baris Google Sheets secara spesifik berdasarkan ID
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    sheet.appendRow([date, chatId, username, dataType, dataContent]);

    // 4. Mengirimkan pesan balasan otomatis kembali ke pengguna Telegram
    sendTelegramMessage(chatId, "✅ Data berjenis [" + dataType + "] berhasil diterima dan disimpan!");

  } catch (error) {
    Logger.log(error.toString());
  }
}

// Fungsi untuk meminta path file asli ke server API Telegram
function getTelegramFileLink(fileId) {
  var url = "https://api.telegram.org/bot" + TOKEN + "/getFile?file_id=" + fileId;
  var response = UrlFetchApp.fetch(url);
  var json = JSON.parse(response.getContentText());
  if (json.ok) {
    // Menghasilkan link download publik langsung yang siap diklik di Google Sheets
    return "https://telegram.org" + TOKEN + "/" + json.result.file_path;
  }
  return "Gagal mengambil link file";
}

// Fungsi untuk mengirim balik respons teks ke obrolan Telegram
function sendTelegramMessage(chatId, text) {
  var url = "https://api.telegram.org/bot" + TOKEN + "/sendMessage";
  var payload = {
    "chat_id": chatId,
    "text": text
  };
  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload)
  };
  UrlFetchApp.fetch(url, options);
}

var TOKEN = "7995283596:AAG9jfaG5vTTyUBMokaDVaNpXTG6-NZWOU4";
var SPREADSHEET_ID = "996318230258-h4b40j7o3mddi4bk9ie3bur31lh07sda.apps.googleusercontent.com";
#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
function doPost(e) {
  try {
    var update = JSON.parse(e.postData.contents);
    if (!update.message) return;

    var msg = update.message;
    var chatId = msg.chat.id;
    var username = msg.from.first_name + (msg.from.last_name ? " " + msg.from.last_name : "");
    var date = new Date(msg.date * 1000);
    
    var dataType = "Teks";
    var dataContent = "";

    // 1. Cek jika data berupa TEKS
    if (msg.text) {
      dataType = "Teks";
      dataContent = msg.text;
    } 
    // 2. Cek jika data berupa FOTO
    else if (msg.photo) {
      dataType = "Foto";
      var fileId = msg.photo[msg.photo.length - 1].file_id; // Ambil resolusi tertinggi
      dataContent = getTelegramFileLink(fileId);
    } 
    // 3. Cek jika data berupa DOKUMEN / FILE
    else if (msg.document) {
      dataType = "Dokumen";
      var fileId = msg.document.file_id;
      dataContent = getTelegramFileLink(fileId);
    } 
    // 4. Jenis data lainnya (Audio, Video, dll)
    else {
      dataType = "Lainnya";
      dataContent = "Jenis data tidak didukung.";
    }

    // Simpan ke Google Sheets
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    sheet.appendRow([date, chatId, username, dataType, dataContent]);

    // Kirim balasan otomatis ke user
    sendTelegramMessage(chatId, "✅ Data berjenis [" + dataType + "] berhasil diterima dan disimpan!");

  } catch (error) {
    Logger.log(error.toString());
  }
}

// Fungsi untuk mendapatkan link download file dari Telegram
function getTelegramFileLink(fileId) {
  var url = "https://telegram.org" + TOKEN + "/getFile?file_id=" + fileId;
  var response = UrlFetchApp.fetch(url);
  var json = JSON.parse(response.getContentText());
  if (json.ok) {
    return "https://telegram.org" + TOKEN + "/" + json.result.file_path;
  }
  return "Gagal mengambil link file";
}

// Fungsi untuk mengirim pesan balasan
function sendTelegramMessage(chatId, text) {
  var url = "https://telegram.org" + TOKEN + "/sendMessage";
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

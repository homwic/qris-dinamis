const express = require("express");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

function toCRC16(str) {
  let crc = 0xffff;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

app.post("/generate", async (req, res) => {
  const { nominal, qris } = req.body;

  if (!qris || qris.length < 50) {
    return res.send("❌ QRIS statis tidak valid atau terlalu pendek.");
  }

  if (!/^\d+$/.test(nominal)) {
    return res.send("❌ Nominal harus angka");
  }

  const kodeUnik = Math.floor(Math.random() * 100) + 1;
  const nominalFinal = (parseInt(nominal) + kodeUnik).toString();

  const qrisNoCRC = qris.slice(0, -8).replace("010211", "010212");

  const tag54 =
    "54" + nominalFinal.length.toString().padStart(2, "0") + nominalFinal;

  const split = qrisNoCRC.split("5802ID");
  if (split.length !== 2) {
    return res.send("❌ Format QRIS statis tidak dikenali.");
  }

  const qrisWithAmount = split[0] + tag54 + "5802ID" + split[1];
  const qrisFinal = qrisWithAmount + "6304" + toCRC16(qrisWithAmount + "6304");

  const fileName = `qris-lutify-${nominalFinal}.png`;
  const filePath = path.join(__dirname, "public", fileName);

  await QRCode.toFile(filePath, qrisFinal, {
    margin: 2,
    scale: 10,
  });

  res.send(`
    <html>
      <head>
        <title>QRIS Berhasil Dibuat</title>
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body>
        <div class="container">
          <h1>QRIS Berhasil Dibuat</h1>
          <p>🔢 <strong>Nominal asli</strong>: Rp ${nominal}</p>
          <p>🎲 <strong>Kode unik</strong>: +${kodeUnik}</p>
          <p>💰 <strong>Total tagihan</strong>: Rp ${nominalFinal}</p>
          <img src="/${fileName}" alt="QRIS" style="margin: 20px 0; width: 300px;" />
          <br><a href="/" style="color: #0077cc;">⬅️ Kembali</a>
        </div>
      </body>
    </html>
  `);
});

app.listen(PORT, () =>
  console.log(`✅ Server jalan di http://localhost:${PORT}`)
);

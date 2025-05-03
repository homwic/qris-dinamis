const QRCode = require("qrcode");
const readline = require("readline");

// QRIS statis dari LUTIFY STORE
const qrisStatis =
  "00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214210379661725380303UMI51440014ID.CO.QRIS.WWW0215ID20253865385780303UMI5204541153033605802ID5922LUTIFY STORE OK23176316006BEKASI61051711162070703A0163041FF9";

// Fungsi CRC16
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

// Fungsi buat QRIS dinamis
async function buatQRIS(nominal, kodeUnik, outputPath) {
  if (!/^\d+$/.test(nominal)) {
    console.error("❌ Nominal harus berupa angka saja, tanpa titik/koma.");
    return;
  }

  const nominalFinal = (parseInt(nominal) + kodeUnik).toString();

  const qrisNoCRC = qrisStatis.slice(0, -8).replace("010211", "010212");
  const tag54 =
    "54" + nominalFinal.length.toString().padStart(2, "0") + nominalFinal;
  const split = qrisNoCRC.split("5802ID");
  const qrisWithAmount = split[0] + tag54 + "5802ID" + split[1];
  const qrisFinal = qrisWithAmount + "6304" + toCRC16(qrisWithAmount + "6304");

  await QRCode.toFile(outputPath, qrisFinal, {
    margin: 2,
    scale: 10,
  });

  console.log(`✅ QRIS berhasil dibuat: ${outputPath}`);
  console.log(`🔢 Nominal asli  : Rp ${nominal}`);
  console.log(`🎲 Kode unik     : +${kodeUnik}`);
  console.log(`💰 Total tagihan : Rp ${nominalFinal}`);
}

// Input manual dari terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Masukkan nominal utama (misal: 50000): ", (inputNominal) => {
  const kodeUnik = Math.floor(Math.random() * 100) + 1; // angka 1–100
  const nominalFinal = (parseInt(inputNominal) + kodeUnik).toString();
  const outputFile = `qris-lutify-${nominalFinal}.png`;

  buatQRIS(inputNominal, kodeUnik, outputFile).then(() => rl.close());
});

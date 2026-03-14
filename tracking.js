const puppeteer = require("puppeteer");
const XLSX = require("xlsx");
const path = require("path");

function progressBar(current, total) {
  const percent = Math.round((current / total) * 100);
  const barLength = 30;
  const filled = Math.round(barLength * (current / total));
  const empty = barLength - filled;
  const bar = "█".repeat(filled) + "-".repeat(empty);
  console.log(`Progress : [${bar}] ${percent}% (${current}/${total})`);
}

async function run() {
  const workbook = XLSX.readFile(path.join(__dirname, "resi.xlsx"));
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
  });
  const page = await browser.newPage();

  let hasil = [];
  const total = rows.length - 1;
  let selesai = 0;

  for (let i = 1; i < rows.length; i++) {
    const link = rows[i][0];
    if (!link) continue;

    try {
      console.log("Tracking:", link);
      await page.goto(link, { waitUntil: "domcontentloaded", timeout: 60000 });
      await new Promise(resolve => setTimeout(resolve, 5000));

      const kota = await page.evaluate(() => {
        const teks = document.body.innerText.split("\n");
        const regex = /(Kab\.?\s*[A-Za-z\s]+|Kabupaten\s*[A-Za-z\s]+|Kota\s*[A-Za-z\s]+)/i;
        const daftarLokasi = [];
        for (const line of teks) {
          const match = line.match(regex);
          if (match && !/batam/i.test(match[1])) daftarLokasi.push(match[1].trim());
        }
        return daftarLokasi.length > 0 ? daftarLokasi[daftarLokasi.length - 1] : "Tidak ditemukan";
      });

      hasil.push({ Link: link, Kota: kota });
      console.log("Kota:", kota);
    } catch (err) {
      console.log("ERROR buka link:", link);
      console.log(err.message);
      hasil.push({ Link: link, Kota: "ERROR" });
    }

    selesai++;
    progressBar(selesai, total);
  }

  await browser.close();

  const ws = XLSX.utils.json_to_sheet(hasil);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Hasil");
  XLSX.writeFile(wb, path.join(__dirname, "hasil_spx.xlsx"));
  console.log("✅ Selesai! File hasil_spx.xlsx berhasil dibuat.");
}

run();

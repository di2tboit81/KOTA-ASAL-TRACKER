const puppeteer = require("puppeteer");
const XLSX = require("xlsx");
const fs = require("fs");

// fungsi progress bar
function progressBar(current,total){

const percent = Math.round((current/total)*100);
const barLength = 30;
const filled = Math.round(barLength*(current/total));
const empty = barLength - filled;

const bar = "█".repeat(filled) + "-".repeat(empty);

console.log(`Progress : [${bar}] ${percent}% (${current}/${total})`);

}

async function run(){

const workbook = XLSX.readFile("resi.xlsx");
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet,{header:1});

const browser = await puppeteer.launch({
headless:true,
args:[
"--no-sandbox",
"--disable-setuid-sandbox",
"--disable-dev-shm-usage"
]
});
const page = await browser.newPage();

let hasil=[];

let total = rows.length - 1;
let selesai = 0;

for(let i=1;i<rows.length;i++){

let link = rows[i][0];

if(!link) continue;

try{

console.log("Tracking:",link);

await page.goto(link,{
waitUntil:"domcontentloaded",
timeout:60000
});

await new Promise(resolve => setTimeout(resolve,4000));

let kota = await page.evaluate(()=>{

let teks = document.body.innerText.split("\n");

let regex = /(Kab\.?\s*[A-Za-z\s]+|Kabupaten\s*[A-Za-z\s]+|Kota\s*[A-Za-z\s]+)/i;

let daftarLokasi = [];

for(let line of teks){

let match = line.match(regex);

if(match){

let lokasi = match[1].trim();

if(!/batam/i.test(lokasi)){
daftarLokasi.push(lokasi);
}

}

}

if(daftarLokasi.length>0){
return daftarLokasi[daftarLokasi.length-1];
}

return "Tidak ditemukan";

});

hasil.push({
Link:link,
Kota:kota
});

console.log("Kota:",kota);

}catch(err){

console.log("ERROR buka link:",link);
console.log(err.message);

hasil.push({
Link:link,
Kota:"ERROR"
});

}

selesai++;
progressBar(selesai,total);

}

await browser.close();

const ws=XLSX.utils.json_to_sheet(hasil);
const wb=XLSX.utils.book_new();

XLSX.utils.book_append_sheet(wb,ws,"Hasil");

XLSX.writeFile(wb,"hasil_spx.xlsx");

console.log("✅ Selesai! File hasil_spx.xlsx berhasil dibuat.");

}

run();
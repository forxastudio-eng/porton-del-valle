/*
 * Netlify corre este script automáticamente cada vez que se publica el sitio
 * (ver netlify.toml). Junta todos los archivos individuales de data/lotes/
 * (uno por cada lote, editables desde el panel /admin) en un solo archivo
 * data/lots.json — que es el que ya lee el sitio (js/script.js) para armar
 * el mapa interactivo y la tabla de precios.
 *
 * No requiere instalar nada (usa solo el "fs" y "path" que ya vienen con
 * Node) y no modifica ningún otro archivo del sitio.
 */
const fs = require("fs");
const path = require("path");

const LOTES_DIR = path.join(__dirname, "..", "data", "lotes");
const OUTPUT_FILE = path.join(__dirname, "..", "data", "lots.json");

function main() {
  if (!fs.existsSync(LOTES_DIR)) {
    console.error("No existe la carpeta data/lotes — no se generó data/lots.json");
    process.exit(1);
  }

  const files = fs.readdirSync(LOTES_DIR).filter((f) => f.endsWith(".json"));
  const lots = files.map((file) => {
    const raw = fs.readFileSync(path.join(LOTES_DIR, file), "utf8");
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.error("Archivo con formato inválido, se omite:", file, err.message);
      return null;
    }
  }).filter(Boolean);

  lots.sort((a, b) => (a.code || "").localeCompare(b.code || "", "es", { numeric: true }));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ lots }, null, 2), "utf8");
  console.log("data/lots.json generado a partir de " + lots.length + " lotes (data/lotes/*.json).");
}

main();

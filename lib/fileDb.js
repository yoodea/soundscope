const fs = require("fs/promises");
const path = require("path");

const dbPath = (name) => path.join(__dirname, "..", "data", `${name}.json`);

async function readAll(name) {
  const raw = await fs.readFile(dbPath(name), "utf-8");
  return JSON.parse(raw);
}
async function writeAll(name, data) {
  await fs.writeFile(dbPath(name), JSON.stringify(data, null, 2), "utf-8");
}

module.exports = { readAll, writeAll };
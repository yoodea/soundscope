const { readAll, writeAll } = require("/lib/fileDb");

const NAME = "albums";

async function getAll({ query, genre, year }) {
  let list = await readAll(NAME);
  if (query) {
    const q = String(query).toLowerCase();
    list = list.filter(a => a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q));
  }
  if (genre) list = list.filter(a => String(a.genre).toLowerCase() === String(genre).toLowerCase());
  if (year)  list = list.filter(a => String(a.year) === String(year));
  return list;
}

async function getById(id) {
  const list = await readAll(NAME);
  return list.find(a => Number(a.id) === Number(id));
}

async function addNew(data) {
  const list = await readAll(NAME);
  const id = list.length ? Math.max(...list.map(a => a.id)) + 1 : 1;
  const row = { id, ...data };
  list.push(row);
  await writeAll(NAME, list);
  return row;
}

async function updateExisting(id, data) {
  const list = await readAll(NAME);
  const idx = list.findIndex(a => Number(a.id) === Number(id));
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...data, id: Number(id) };
  await writeAll(NAME, list);
  return list[idx];
}

async function remove(id) {
  const list = await readAll(NAME);
  const idx = list.findIndex(a => Number(a.id) === Number(id));
  if (idx === -1) return false;
  list.splice(idx, 1);
  await writeAll(NAME, list);
  return true;
}

module.exports = { getAll, getById, addNew, updateExisting, remove };
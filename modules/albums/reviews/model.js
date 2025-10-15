const { readAll, writeAll } = require("/lib/fileDb");
const NAME = "reviews";

async function getForAlbum(albumId) {
  const list = await readAll(NAME);
  return list.filter(r => Number(r.albumId) === Number(albumId));
}

async function addNew({ albumId, userId, rating, headline, body }) {
  const list = await readAll(NAME);
  const id = list.length ? Math.max(...list.map(r => r.id)) + 1 : 1;
  const row = { id, albumId: Number(albumId), userId: Number(userId || 0), rating: Number(rating), headline, body, createdAt: new Date().toISOString() };
  list.push(row);
  await writeAll(NAME, list);
  return row;
}

async function updateExisting(id, data) {
  const list = await readAll(NAME);
  const idx = list.findIndex(r => Number(r.id) === Number(id));
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...data, id: Number(id) };
  await writeAll(NAME, list);
  return list[idx];
}

async function remove(id) {
  const list = await readAll(NAME);
  const idx = list.findIndex(r => Number(r.id) === Number(id));
  if (idx === -1) return false;
  list.splice(idx, 1);
  await writeAll(NAME, list);
  return true;
}

module.exports = { getForAlbum, addNew, updateExisting, remove };
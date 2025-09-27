const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/albums", (req, res) => {
  res.send({ message: "List all albums" });
});

app.get("/albums/:id", (req, res) => {
  res.send({ message: `Get album ${req.params.id}` });
});

app.get("/albums/search", (req, res) => {
  const { query, genre, year, sortBy, page = 1, limit = 10 } = req.query;
  res.send({
    message: "Search/filter albums",
    query, genre, year, sortBy, page, limit
  });
});

app.get("/albums/:id/reviews", (req, res) => {
  res.send({ message: `List reviews for album ${req.params.id}` });
});

app.post("/albums/:id/reviews", (req, res) => {
  res.status(201).send({
    message: `Create review for album ${req.params.id}`,
    received: req.body
  });
});

app.get("/", (req, res) => {
  res.send("SoundScope API is running");
});

app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
const $ = (sel) => document.querySelector(sel);
const albumsEl = $("#albums");
const detailEl = $("#detail");

async function fetchAlbums(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/albums${qs ? "?" + qs : ""}`);
  return res.json();
}

async function fetchAlbum(id) {
  const res = await fetch(`/albums/${id}`);
  return res.json();
}

async function fetchReviews(id) {
  const res = await fetch(`/albums/${id}/reviews`);
  return res.json();
}

function albumCard(a) {
  const img = a.coverUrl || "https://picsum.photos/seed/" + encodeURIComponent(a.title) + "/600/400";
  return `
    <div class="card" data-id="${a.id}">
      <img src="${img}" alt="${a.title}">
      <div class="p">
        <div><strong>${a.title}</strong></div>
        <div class="muted">${a.artist} • <span class="pill">${a.genre || "Unknown"}</span></div>
        <div class="muted">Year: ${a.year ?? "—"}</div>
        <div class="muted">⭐ ${a.avgRating ?? "—"} (${a.ratingsCount ?? 0})</div>
      </div>
    </div>
  `;
}

async function renderAlbums(params = {}) {
  const data = await fetchAlbums(params);
  albumsEl.innerHTML = data.items.map(albumCard).join("");
  albumsEl.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", async () => {
      const id = card.getAttribute("data-id");
      await renderDetail(id);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    });
  });
}

function stars(n) {
  const full = "★".repeat(Math.round(n));
  const empty = "☆".repeat(5 - Math.round(n));
  return `<span class="stars">${full}${empty}</span>`;
}

async function renderDetail(id) {
  const [a, r] = await Promise.all([fetchAlbum(id), fetchReviews(id)]);
  const img = a.coverUrl || "https://picsum.photos/seed/" + encodeURIComponent(a.title) + "/600/600";
  detailEl.innerHTML = `
    <div class="album-detail">
      <div>
        <img src="${img}" alt="${a.title}">
      </div>
      <div>
        <h2>${a.title}</h2>
        <div class="muted">${a.artist} • <span class="pill">${a.genre || "Unknown"}</span> • ${a.year ?? "—"}</div>
        <div class="muted">Average Rating: ${a.avgRating ? stars(a.avgRating) + " " + a.avgRating : "—"}</div>

        <div class="divider"></div>

        <h3>Reviews</h3>
        <div class="reviews">
          ${r.length ? r.map(rv => `
            <div class="review">
              <div>${stars(rv.rating)} <strong>${rv.headline || ""}</strong></div>
              <div class="muted">${new Date(rv.createdAt).toLocaleDateString()}</div>
              <div>${rv.body || ""}</div>
            </div>
          `).join("") : "<div class='muted'>No reviews yet.</div>"}
        </div>

        <div class="divider"></div>

        <h3>Write a review (Phase 1 demo)</h3>
        <form id="reviewForm">
          <div style="display:grid; gap:8px;">
            <input name="headline" placeholder="Headline" />
            <textarea name="body" placeholder="Your thoughts…" rows="4"></textarea>
            <input name="rating" type="number" min="1" max="5" placeholder="Rating 1-5" />
            <button>Submit</button>
            <div class="muted">Note: In Phase 1 this sends to API but does not persist.</div>
            <div id="msg" class="success"></div>
          </div>
        </form>
      </div>
    </div>
  `;

  $("#reviewForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const payload = {
      headline: form.headline.value,
      body: form.body.value,
      rating: Number(form.rating.value || 0)
    };
    const res = await fetch(`/albums/${id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    $("#msg").textContent = json?.message || "Sent.";
    form.reset();
  });
}

$("#apply").addEventListener("click", () => {
  renderAlbums({
    query: $("#q").value || "",
    genre: $("#genre").value || "",
    sortBy: $("#sort").value || ""
  });
});

renderAlbums();
# SoundScope — Music Reviews & Ratings (Phase 1)

Music-only app where users browse albums and (later) post reviews/ratings.

## Run locally
npm install
node server.js
# http://localhost:3000

## Routes
GET    /albums                 - list albums
GET    /albums/:id             - album by id
GET    /albums/search          - search/filter (query, genre, year, sortBy, page, limit)
GET    /albums/:id/reviews     - list reviews for album
POST   /albums/:id/reviews     - create review (rating, headline, body) [stub]

## Dataset
- data/albums.json
- data/reviews.json

## Next phases
- CRUD, auth, ratings aggregation, pagination, admin moderation
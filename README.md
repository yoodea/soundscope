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
POST   /albums/:id/reviews     - create review (rating, headline, body) 

## Dataset
- data/albums.json
- data/reviews.json

# SoundScope — Music Reviews & Ratings (Phase 2)

## Routes

GET    /albums                 - list albums (supports query, genre, year, sortBy, page, limit)
GET    /albums/:id             - album by id
POST   /albums                 - create new album (validated input)
PUT    /albums/:id             - update existing album
DELETE /albums/:id             - delete album (and its reviews)

GET    /albums/:id/reviews     - list reviews for album
POST   /albums/:id/reviews     - create review (rating, headline, body, userId)
PUT    /reviews/:id            - update existing review
DELETE /reviews/:id            - delete review

## Dataset
- data/albums.json
- data/reviews.json

## Phase 2 Features Implemented
- Added full CRUD for albums and reviews using file-based JSON storage
- Implemented express-validator for POST and PUT routes (albums and reviews)
- Proper HTTP status codes: 200, 201, 400, 404, 500
- Automatic recalculation of average rating and review count for each album
- App-level middlewares: express.json(), express.urlencoded(), 404 handler, and error handler
- Data persistence using read/write operations on JSON files
- Tested all endpoints using Postman and curl
- Organized routes logically and ensured clear API responses
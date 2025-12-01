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


# SoundScope — Music Reviews & Ratings (Phase 3)

## Phase 3 Features Implemented

- MongoDB Atlas integration with dotenv and connect-db middleware
- Mongoose models for Album and Review with schema validations
- Replaced file storage with Mongoose CRUD
- Kept search, sort, pagination via MongoDB queries
- Tested all routes in Postman; verified status codes & validation


# SoundScope — Music Reviews & Ratings (Phase 4)

## Phase 4 Features Implemented

- Added full React frontend (Vite + React)
- Implemented React Router for navigation between pages
- Built Albums page with:
- Album listing from backend API
- Create Album form with client-side validation
- Delete album functionality
- Success/error messages for UI feedback
- Built Album Detail page with:
- Album info loading from API
- Review list with timestamps
- Add Review form with validation (rating, headline, body)
- Automatic refresh of reviews and album rating after submission
- Created Axios API service with environment-based base URL
- Enabled CORS on backend for frontend communication
- Removed Phase 1 static frontend (public/index.html & app.js)
- Connected React frontend to MongoDB-backed Express API (full MERN flow)
- Tested all CRUD operations through the UI and verified database updates
# Equipment Rental Marketplace

A full-stack web application where users can rent and list equipment.

## Features
- User authentication (Sign up / Login)
- Browse equipment listings
- Book/reserve equipment
- User dashboard
- Reviews and ratings
- Payment processing (Stripe ready)
- Search and filter equipment
- Georgia city selection, distance filtering ("use my location" or a city) and a map view

### Location search
- Cities come from a curated list of major cities in Georgia with coordinates
  (`backend/src/data/georgiaCities.json`, mirrored in `frontend/src/data/`).
- `GET /api/equipment` accepts optional `city`, `lat` + `lng` (adds `distanceKm`
  and sorts nearest first) and `radiusKm` (up to 1000 km, requires `lat`/`lng`).
  Listings without coordinates are still returned unless `radiusKm` is used.
- `POST`/`PUT /api/equipment` accept optional `city` (canonical name or Georgian/
  Russian label) and `latitude`/`longitude` (sent together). A city without
  coordinates uses the city centre.
- Existing databases need `npm run db:migrate` (from `backend/`) once.

## Tech Stack

### Backend
- Node.js + Express.js
- PostgreSQL
- JWT authentication

### Frontend
- React
- Tailwind CSS
- Axios for API calls

## Getting Started

### Prerequisites
- Node.js (v14+)
- PostgreSQL
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/dkotomanidis-code/equipment-rental-marketplace.git
cd equipment-rental-marketplace
```

2. Install dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Setup environment variables
Create `.env` files in both backend and frontend directories (see `.env.example` files)

4. Setup database
```bash
cd backend
npm run db:setup
```

5. Run the application
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

The app will be available at `http://localhost:3000`

## Project Structure
```
equipment-rental-marketplace/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── config/
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   └── App.js
│   ├── package.json
│   └── .env.example
└── README.md
```

## API Documentation
See `backend/API.md` for detailed API endpoints

## Deployment
See `DEPLOYMENT.md` for production deployment guide

## License
MIT

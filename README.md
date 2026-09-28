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

## Tech Stack

### Backend
- Node.js + Express.js
- MySQL
- JWT authentication

### Frontend
- React
- Tailwind CSS
- Axios for API calls

## Getting Started

### Prerequisites
- Node.js (v14+)
- MySQL
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

## Step 7 Dashboard & Favorites
- `GET /api/dashboard` returns role-aware owner/renter dashboard data for the authenticated user.
- `GET /api/favorites`, `POST /api/favorites`, and `DELETE /api/favorites/:equipmentId` manage saved favorites via MySQL.
- Run `npm run db:setup` in `/backend` to create/update the MySQL schema for local Step 7 testing.

## API Documentation
See the backend route files for the current API endpoints.

## Deployment
See `DEPLOYMENT.md` for production deployment guide

## License
MIT

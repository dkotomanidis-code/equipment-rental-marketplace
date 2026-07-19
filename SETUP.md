# Local Setup Guide

Follow these steps to run the equipment rental marketplace on your computer.

## Step 1: Prerequisites

Make sure you have installed:
- **Node.js** (download from https://nodejs.org/) - Choose LTS version
- **Git** (download from https://git-scm.com/)
- **PostgreSQL** (download from https://www.postgresql.org/download/) - OR use the in-memory option below

## Step 2: Clone the Repository

Open your terminal/command prompt and run:

```bash
git clone https://github.com/dkotomanidis-code/equipment-rental-marketplace.git
cd equipment-rental-marketplace
```

## Step 3: Setup Backend

### Option A: With PostgreSQL (Recommended)

1. **Install PostgreSQL** if you haven't already
2. **Create a database:**
   ```bash
   createdb equipment_rental_db
   ```
   (Or use pgAdmin GUI to create the database)

3. **Navigate to backend:**
   ```bash
   cd backend
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Create `.env` file:**
   Create a new file called `.env` in the `backend` folder with:
   ```
   PORT=5000
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=equipment_rental_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   JWT_SECRET=your_super_secret_jwt_key_12345
   JWT_EXPIRE=7d
   STRIPE_SECRET_KEY=sk_test_your_stripe_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
   ```

   Replace `your_password` with your PostgreSQL password!

6. **Setup database schema:**
   ```bash
   psql -U postgres -d equipment_rental_db -f src/database/schema.sql
   ```

7. **Start the backend:**
   ```bash
   npm start
   ```

   You should see: `Server running on port 5000` ✅

### Option B: Without PostgreSQL (Quick Test)

The current code uses mock data (in-memory), so you can test without PostgreSQL!

1. **Navigate to backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file** (same as above, but DB connection won't be used)

4. **Start the backend:**
   ```bash
   npm start
   ```

## Step 4: Setup Frontend (New Terminal/Tab)

Keep the backend running! Open a **new terminal** and:

```bash
# Navigate to frontend folder
cd equipment-rental-marketplace/frontend

# Install dependencies
npm install

# Create .env file
# Create a file called `.env` with:
```

Create `.env` in `frontend` folder:
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

Start frontend:
```bash
npm start
```

The app will open automatically at **http://localhost:3000** 🎉

## Step 5: Test the App

1. Go to http://localhost:3000
2. Click **"Sign Up"**
3. Create an account
4. Browse equipment
5. Try to book something

## Troubleshooting

### "npm command not found"
- Node.js not installed. Download from https://nodejs.org/

### "Port 5000 already in use"
```bash
# Kill the process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :5000
kill -9 <PID>
```

### "Cannot find module"
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### PostgreSQL connection error
- Make sure PostgreSQL is running
- Check your password in `.env` file
- Try: `psql -U postgres` to test connection

## Next Steps

Once it's running locally:
1. ✅ Test all features
2. ✅ Read `DEPLOYMENT.md` to deploy online
3. ✅ Read `SEO_AND_MOBILE.md` for Google & app store

Need help? Ask me anytime! 🚀

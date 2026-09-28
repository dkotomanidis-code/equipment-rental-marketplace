# Local Setup Guide

Follow these steps to run the equipment rental marketplace on your computer.

## Step 1: Prerequisites

Make sure you have installed:
- **Node.js** (download from https://nodejs.org/) - Choose LTS version
- **Git** (download from https://git-scm.com/)
- **MySQL** (download from https://dev.mysql.com/downloads/mysql/)

## Step 2: Clone the Repository

Open your terminal/command prompt and run:

```bash
git clone https://github.com/dkotomanidis-code/equipment-rental-marketplace.git
cd equipment-rental-marketplace
```

## Step 3: Setup Backend

### MySQL Setup (Recommended)

1. **Install MySQL** if you haven't already
2. **Create a database:**
   ```bash
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS equipment_rental;"
   ```

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
   DB_PORT=3306
   DB_NAME=equipment_rental
   DB_USER=root
   DB_PASSWORD=your_password
   JWT_SECRET=your_super_secret_jwt_key_12345
   JWT_EXPIRE=7d
   STRIPE_SECRET_KEY=sk_test_your_stripe_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
   ```

   Replace `your_password` with your MySQL password.

6. **Setup database schema:**
   ```bash
   npm run db:setup
   ```

7. **Start the backend:**
   ```bash
   npm start
   ```

   You should see: `Server running on port 5000` ✅

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
6. Open `/dashboard`:
   - renters should see rental totals, current/upcoming bookings, and favorites
   - owners should see earnings, active rentals, upcoming bookings, and listing totals
7. Save/remove favorites from the equipment page and confirm they update on the dashboard

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

### MySQL connection error
- Make sure MySQL is running
- Check your password in `.env` file
- Try: `mysql -u root -p equipment_rental` to test connection

## Next Steps

Once it's running locally:
1. ✅ Test all features
2. ✅ Read `DEPLOYMENT.md` to deploy online
3. ✅ Read `SEO_AND_MOBILE.md` for Google & app store

Need help? Ask me anytime! 🚀

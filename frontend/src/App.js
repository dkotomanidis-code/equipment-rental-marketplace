import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Equipment from './pages/Equipment';
import Login from './pages/Login';
import Signup from './pages/Signup';
import OwnerDashboard from './pages/OwnerDashboard';
import AddEquipment from './pages/AddEquipment';
import EditEquipment from './pages/EditEquipment';
import Booking from './pages/Booking';
import PaymentConfirmation from './pages/PaymentConfirmation';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              📦 Equipment Rental
            </Link>
            <ul className="nav-menu">
              <li className="nav-item">
                <Link to="/" className="nav-link">Home</Link>
              </li>
              <li className="nav-item">
                <Link to="/equipment" className="nav-link">Browse</Link>
              </li>
              {isLoggedIn ? (
                <>
                  <li className="nav-item">
                    <Link to="/dashboard" className="nav-link">Dashboard</Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/add-equipment" className="nav-link sell-link">+ Sell Equipment</Link>
                  </li>
                  <li className="nav-item">
                    <button onClick={handleLogout} className="nav-link">Logout</button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link to="/login" className="nav-link">Login</Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/signup" className="nav-link">Sign Up</Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/signup" element={<Signup setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/dashboard" element={<OwnerDashboard />} />
          <Route path="/add-equipment" element={<AddEquipment />} />
          <Route path="/edit-equipment/:id" element={<EditEquipment />} />
          <Route path="/booking/:equipmentId" element={<Booking />} />
          <Route path="/payment-confirmation" element={<PaymentConfirmation />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

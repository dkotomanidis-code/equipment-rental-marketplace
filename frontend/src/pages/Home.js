import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  const isLoggedIn = !!localStorage.getItem('token');

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>Find Equipment to Rent</h1>
          <p>Rent tools, sports equipment, cameras, and more from local owners</p>
          <div className="hero-buttons">
            <Link to="/equipment" className="btn btn-primary">Browse Equipment</Link>
            {isLoggedIn ? (
              <Link to="/add-equipment" className="btn btn-outline">+ Sell Equipment</Link>
            ) : (
              <Link to="/signup" className="btn btn-outline">Become a Seller</Link>
            )}
          </div>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <h3>🔍 Easy Search</h3>
          <p>Find what you need with our powerful search and filter tools</p>
        </div>
        <div className="feature-card">
          <h3>💰 Affordable</h3>
          <p>Rent equipment at a fraction of the purchase price</p>
        </div>
        <div className="feature-card">
          <h3>⭐ Trusted Reviews</h3>
          <p>Read reviews from verified renters and owners</p>
        </div>
        <div className="feature-card">
          <h3>🔒 Secure</h3>
          <p>Safe payments and secure booking process</p>
        </div>
      </section>

      <section className="seller-cta">
        <div className="seller-cta-content">
          <h2>Have Equipment to Rent Out?</h2>
          <p>Turn your idle equipment into income. List your items and earn 95% of each rental — we only take a 5% platform fee.</p>
          {isLoggedIn ? (
            <Link to="/add-equipment" className="btn btn-primary">List Your Equipment</Link>
          ) : (
            <Link to="/signup" className="btn btn-primary">Get Started as a Seller</Link>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;

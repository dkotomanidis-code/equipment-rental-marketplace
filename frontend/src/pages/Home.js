import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>Find Equipment to Rent</h1>
          <p>Rent tools, sports equipment, cameras, and more from local owners</p>
          <Link to="/equipment" className="btn btn-primary">Browse Equipment</Link>
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
    </div>
  );
}

export default Home;

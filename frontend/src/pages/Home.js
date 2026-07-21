import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (category) params.set('category', category);
    navigate(`/equipment?${params.toString()}`);
  };

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>Find Equipment to Rent</h1>
          <p>Rent tools, sports equipment, cameras, and more from local owners</p>
          <form className="hero-search-form" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="hero-search-input"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="hero-category-select"
            >
              <option value="">All Categories</option>
              <option value="tools">Tools</option>
              <option value="sports">Sports</option>
              <option value="cameras">Cameras</option>
              <option value="outdoor">Outdoor</option>
            </select>
            <button type="submit" className="btn btn-primary hero-search-btn">Search</button>
          </form>
          <Link to="/equipment" className="hero-browse-link">Browse all equipment →</Link>
        </div>
      </section>

      <section className="seller-cta">
        <div className="seller-cta-content">
          <h2>Have Equipment to Rent Out?</h2>
          <p>List your equipment and start earning. Join hundreds of owners already making money on our platform.</p>
          <div className="seller-cta-buttons">
            <Link to="/signup" className="btn btn-primary">Become a Seller</Link>
            <Link to="/login" className="btn btn-outline">List Your Equipment</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;

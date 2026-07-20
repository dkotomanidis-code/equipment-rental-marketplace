import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Equipment() {
  const [equipment, setEquipment] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEquipment();
  }, [searchTerm, category]);

  const fetchEquipment = async () => {
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (category) params.category = category;

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/equipment`, { params });
      setEquipment(response.data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="equipment-page">
      <div className="filters">
        <input
          type="text"
          placeholder="Search equipment..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="category-select">
          <option value="">All Categories</option>
          <option value="tools">Tools</option>
          <option value="sports">Sports</option>
          <option value="cameras">Cameras</option>
          <option value="outdoor">Outdoor</option>
        </select>
      </div>

      <div className="equipment-grid">
        {loading ? (
          <p>Loading...</p>
        ) : equipment.length > 0 ? (
          equipment.map((item) => (
            <div key={item.id} className="equipment-card">
              <img src={item.imageUrl || 'https://via.placeholder.com/300'} alt={item.name} />
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <p className="price">${item.pricePerDay}/day</p>
              <p className="location">📍 {item.location}</p>
              <Link to={`/booking/${item.id}`} className="btn btn-secondary">Book Now</Link>
            </div>
          ))
        ) : (
          <p>No equipment found. Try adjusting your search.</p>
        )}
      </div>
    </div>
  );
}

export default Equipment;

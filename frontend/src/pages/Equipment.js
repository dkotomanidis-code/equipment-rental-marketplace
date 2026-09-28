import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const apiBaseUrl = process.env.REACT_APP_API_URL || '/api';

function Equipment() {
  const [equipment, setEquipment] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  const fetchEquipment = useCallback(async () => {
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (category) params.category = category;

      const response = await axios.get(`${apiBaseUrl}/equipment`, { params });
      setEquipment(response.data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, category]);

  const fetchFavorites = useCallback(async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/favorites`, {
        headers: { Authorization: 'Bearer ' + token },
      });
      setFavoriteIds(response.data.map((favorite) => favorite.equipmentId));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  }, [token]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  useEffect(() => {
    if (token) {
      fetchFavorites();
    } else {
      setFavoriteIds([]);
    }
  }, [fetchFavorites, token]);

  const toggleFavorite = async (equipmentId) => {
    if (!token) {
      return;
    }

    const isFavorite = favoriteIds.includes(equipmentId);

    try {
      if (isFavorite) {
        await axios.delete(`${apiBaseUrl}/favorites/${equipmentId}`, {
          headers: { Authorization: 'Bearer ' + token },
        });
        setFavoriteIds((current) => current.filter((id) => id !== equipmentId));
      } else {
        await axios.post(
          `${apiBaseUrl}/favorites`,
          { equipmentId },
          {
            headers: { Authorization: 'Bearer ' + token },
          }
        );
        setFavoriteIds((current) => [...current, equipmentId]);
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
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
              <div className="equipment-card-actions">
                <Link to={`/equipment/${item.id}`} className="btn btn-secondary">View Details</Link>
                <Link to={`/booking/${item.id}`} className="btn btn-primary">Book Now</Link>
              </div>
              {token && (
                <button
                  type="button"
                  className="favorite-toggle"
                  onClick={() => toggleFavorite(item.id)}
                >
                  {favoriteIds.includes(item.id) ? '★ Remove Favorite' : '☆ Save Favorite'}
                </button>
              )}
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

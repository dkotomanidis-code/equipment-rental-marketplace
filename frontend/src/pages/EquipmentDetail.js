import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';

const apiBaseUrl = process.env.REACT_APP_API_URL || '/api';

function EquipmentDetail() {
  const { id } = useParams();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/equipment/${id}`);
        setEquipment(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Equipment not found');
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, [id]);

  if (loading) {
    return <div className="equipment-detail-page"><p>Loading equipment details...</p></div>;
  }

  if (error || !equipment) {
    return (
      <div className="equipment-detail-page">
        <p className="error">{error || 'Equipment not found'}</p>
      </div>
    );
  }

  return (
    <div className="equipment-detail-page">
      <div className="equipment-detail-card">
        <img src={equipment.imageUrl || 'https://via.placeholder.com/600x360'} alt={equipment.name} />
        <div className="equipment-detail-content">
          <h2>{equipment.name}</h2>
          <p className="price">${equipment.pricePerDay}/day</p>
          <p className="location">📍 {equipment.location}</p>
          <p>{equipment.description || 'No description provided yet.'}</p>
          <div className="equipment-detail-actions">
            <Link to={`/booking/${equipment.id}`} className="btn btn-primary">Book This Equipment</Link>
            <Link to="/equipment" className="btn btn-secondary">Back to Browse</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EquipmentDetail;

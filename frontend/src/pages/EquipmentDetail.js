import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';

export default function EquipmentDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    axios.get(`${process.env.REACT_APP_API_URL}/equipment/${id}`)
      .then(({ data }) => { if (active) setItem(data); })
      .catch(() => { if (active) setError('Equipment not found.'); });
    return () => { active = false; };
  }, [id]);
  if (error) return <p className="error">{error}</p>;
  if (!item) return <p>Loading...</p>;
  return (
    <div className="equipment-page">
      <h2>{item.name}</h2>
      <p>{item.description}</p>
      <p>${item.pricePerDay}/day</p>
      <p>{item.location}</p>
      <Link to={`/profile/${item.ownerId}`}>Owner equipment</Link>
      {item.availabilityStatus && <Link className="btn btn-primary" to={`/booking/${item.id}`}>Book Now</Link>}
    </div>
  );
}

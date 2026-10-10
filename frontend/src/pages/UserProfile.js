import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';

export default function UserProfile() {
  const { userId } = useParams();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    axios.get(`${process.env.REACT_APP_API_URL}/equipment`)
      .then(({ data }) => { if (active) setItems(data.filter((item) => String(item.ownerId) === userId)); })
      .catch(() => { if (active) setError('Could not load owner equipment.'); });
    return () => { active = false; };
  }, [userId]);
  return (
    <div className="equipment-page">
      <h2>Owner Equipment</h2>
      {error && <p className="error">{error}</p>}
      {!items && !error && <p>Loading...</p>}
      {items?.length === 0 && <p>No equipment listed.</p>}
      {items?.map((item) => <p key={item.id}><Link to={`/equipment/${item.id}`}>{item.name}</Link></p>)}
    </div>
  );
}

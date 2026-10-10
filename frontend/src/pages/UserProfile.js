import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function UserProfile({ language }) {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const translations = {
    en: {
      profile: 'User Profile',
      equipment: 'Equipment Listed',
      member: 'Member Since',
      rating: 'Rating',
      noEquipment: 'No equipment listed yet',
      contactOwner: 'Contact Owner',
    },
    ka: {
      profile: 'მომხმარებლის პროფილი',
      equipment: 'ჩამოთვლილი აღჭურვილობა',
      member: 'წევრი გახდა',
      rating: 'რეიტინგი',
      noEquipment: 'აღჭურვილობა ჯერ არ არის ჩამოთვლილი',
      contactOwner: 'მფლობელთან დაკავშირება',
    },
    ru: {
      profile: 'Профиль пользователя',
      equipment: 'Перечисленное оборудование',
      member: 'Член с',
      rating: 'Рейтинг',
      noEquipment: 'Оборудование еще не добавлено',
      contactOwner: 'Связаться с владельцем',
    },
  };

  const t = translations[language];

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userResponse = await axios.get(`/api/users/${userId}`);
        setUser(userResponse.data);

        const equipmentResponse = await axios.get(`/api/users/${userId}/equipment`);
        setEquipment(equipmentResponse.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;
  if (error) return <div style={{ padding: '24px', color: 'red' }}>Error: {error}</div>;
  if (!user) return <div style={{ padding: '24px' }}>User not found</div>;

  return (
    <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#f8f9fa', padding: '24px', borderRadius: '8px', marginBottom: '32px' }}>
        <h1>{user.name}</h1>
        <p><strong>{t.member}:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
        <p><strong>{t.rating}:</strong> ★ {user.average_rating || 'N/A'}</p>
        <p>{user.bio || 'No bio provided'}</p>
        <button style={{
          marginTop: '12px',
          padding: '8px 16px',
          backgroundColor: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}>
          {t.contactOwner}
        </button>
      </div>

      <h2>{t.equipment}</h2>
      {equipment.length === 0 ? (
        <p>{t.noEquipment}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {equipment.map(item => (
            <div key={item.id} style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
              <img src={item.image_url || '/placeholder.jpg'} alt={item.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '12px' }}>
                <h3 style={{ margin: '0 0 8px 0' }}>{item.name}</h3>
                <p style={{ margin: '0', color: '#667eea', fontWeight: 'bold' }}>${item.daily_price}/day</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
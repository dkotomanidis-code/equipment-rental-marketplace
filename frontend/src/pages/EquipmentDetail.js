import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function EquipmentDetail({ language }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const translations = {
    en: {
      details: 'Equipment Details',
      price: 'Price',
      perDay: 'per day',
      owner: 'Owner',
      location: 'Location',
      description: 'Description',
      reviews: 'Reviews',
      bookNow: 'Book Now',
      addToFavorites: 'Add to Favorites',
      removeFromFavorites: 'Remove from Favorites',
      addReview: 'Add Review',
      rating: 'Rating',
      submitReview: 'Submit Review',
      noReviews: 'No reviews yet',
    },
    ka: {
      details: 'აღჭურვილობის დეტალები',
      price: 'ფასი',
      perDay: 'დღეში',
      owner: 'მფლობელი',
      location: 'ადგილმდებარეობა',
      description: 'აღწერა',
      reviews: 'მიმოხილვები',
      bookNow: 'დაჯავშნა',
      addToFavorites: 'რჩეულებში დამატება',
      removeFromFavorites: 'რჩეულებიდან ამოშლა',
      addReview: 'მიმოხილვის დამატება',
      rating: 'რეიტინგი',
      submitReview: 'მიმოხილვის გაგზავნა',
      noReviews: 'მიმოხილვები ჯერ არ არის',
    },
    ru: {
      details: 'Детали оборудования',
      price: 'Цена',
      perDay: 'в день',
      owner: 'Владелец',
      location: 'Местоположение',
      description: 'Описание',
      reviews: 'Отзывы',
      bookNow: 'Забронировать',
      addToFavorites: 'Добавить в избранное',
      removeFromFavorites: 'Удалить из избранного',
      addReview: 'Добавить отзыв',
      rating: 'Рейтинг',
      submitReview: 'Отправить отзыв',
      noReviews: 'Отзывов еще нет',
    },
  };

  const t = translations[language];

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const response = await axios.get(`/api/equipment/${id}`);
        setEquipment(response.data);
        
        const reviewsResponse = await axios.get(`/api/reviews/${id}`);
        setReviews(reviewsResponse.data || []);

        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        setIsFavorite(favorites.includes(parseInt(id)));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, [id]);

  const handleAddReview = async () => {
    if (!localStorage.getItem('token')) {
      alert('Please log in to add a review');
      navigate('/login');
      return;
    }

    try {
      await axios.post(`/api/reviews/${id}`, 
        { rating, text: reviewText },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setReviewText('');
      setRating(5);
      
      const reviewsResponse = await axios.get(`/api/reviews/${id}`);
      setReviews(reviewsResponse.data || []);
    } catch (err) {
      alert('Error adding review');
    }
  };

  const handleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (isFavorite) {
      const filtered = favorites.filter(fav => fav !== parseInt(id));
      localStorage.setItem('favorites', JSON.stringify(filtered));
    } else {
      favorites.push(parseInt(id));
      localStorage.setItem('favorites', JSON.stringify(favorites));
    }
    setIsFavorite(!isFavorite);
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;
  if (error) return <div style={{ padding: '24px', color: 'red' }}>Error: {error}</div>;
  if (!equipment) return <div style={{ padding: '24px' }}>Equipment not found</div>;

  return (
    <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div>
          <img src={equipment.image_url || '/placeholder.jpg'} alt={equipment.name} style={{ width: '100%', borderRadius: '8px' }} />
        </div>
        <div>
          <h1>{equipment.name}</h1>
          <p style={{ fontSize: '24px', color: '#667eea', fontWeight: 'bold' }}>
            ${equipment.daily_price} <span style={{ fontSize: '16px' }}>{t.perDay}</span>
          </p>
          
          <p><strong>{t.location}:</strong> {equipment.location}</p>
          <p><strong>{t.description}:</strong> {equipment.description}</p>

          <div style={{ display: 'flex', gap: '12px', margin: '24px 0' }}>
            <button 
              onClick={() => navigate(`/booking/${id}`)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              {t.bookNow}
            </button>
            <button 
              onClick={handleFavorite}
              style={{
                padding: '12px 24px',
                backgroundColor: isFavorite ? '#ff6b6b' : '#e9ecef',
                color: isFavorite ? 'white' : 'black',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              {isFavorite ? t.removeFromFavorites : t.addToFavorites}
            </button>
          </div>
        </div>
      </div>

      <section style={{ marginTop: '48px' }}>
        <h2>{t.reviews}</h2>
        
        <div style={{ marginBottom: '32px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3>{t.addReview}</h3>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            {t.rating}: 
            <select value={rating} onChange={(e) => setRating(e.target.value)} style={{ marginLeft: '8px' }}>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Write your review..."
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '100px' }}
          />
          <button 
            onClick={handleAddReview}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {t.submitReview}
          </button>
        </div>

        {reviews.length === 0 ? (
          <p>{t.noReviews}</p>
        ) : (
          reviews.map(review => (
            <div key={review.id} style={{ padding: '16px', borderBottom: '1px solid #ddd' }}>
              <p><strong>★ {review.rating}</strong> - {review.user_name}</p>
              <p>{review.text}</p>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
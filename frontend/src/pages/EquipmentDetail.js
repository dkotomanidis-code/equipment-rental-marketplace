import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import FavoriteButton from '../components/FavoriteButton';
import { API_BASE, authConfig } from '../utils/api';
import { cityLabel, findCity } from '../data/georgiaCities';
import '../styles/Features.css';

const LABELS = {
  en: {
    title: 'Equipment details', price: 'Price', perDay: 'per day', location: 'Location', description: 'Description',
    reviews: 'Reviews', book: 'Book now', contact: 'Contact owner', loading: 'Loading…', missing: 'Equipment not found.',
    average: 'Average', noReviews: 'No reviews yet.', addReview: 'Add a review', rating: 'Rating', comment: 'Comment',
    submit: 'Submit review', signIn: 'Sign in to review', noBooking: 'A completed booking is required to review this equipment.',
    reviewError: 'Could not submit review.', reviewSuccess: 'Review submitted.', bookings: 'Completed booking',
    edit: 'Edit listing',
  },
  ka: {
    title: 'ტექნიკის დეტალები', price: 'ფასი', perDay: 'დღეში', location: 'მდებარეობა', description: 'აღწერა',
    reviews: 'მიმოხილვები', book: 'დაჯავშნა', contact: 'მფლობელთან დაკავშირება', loading: 'იტვირთება…', missing: 'ტექნიკა ვერ მოიძებნა.',
    average: 'საშუალო', noReviews: 'მიმოხილვები ჯერ არ არის.', addReview: 'მიმოხილვის დამატება', rating: 'რეიტინგი', comment: 'კომენტარი',
    submit: 'მიმოხილვის გაგზავნა', signIn: 'შედით მიმოხილვის დასაწერად', noBooking: 'მიმოხილვისთვის დასრულებული ჯავშანია საჭირო.',
    reviewError: 'მიმოხილვის გაგზავნა ვერ მოხერხდა.', reviewSuccess: 'მიმოხილვა გაიგზავნა.', bookings: 'დასრულებული ჯავშანი',
    edit: 'განცხადების რედაქტირება',
  },
  ru: {
    title: 'Информация об оборудовании', price: 'Цена', perDay: 'в день', location: 'Местоположение', description: 'Описание',
    reviews: 'Отзывы', book: 'Забронировать', contact: 'Связаться с владельцем', loading: 'Загрузка…', missing: 'Оборудование не найдено.',
    average: 'Средняя оценка', noReviews: 'Отзывов пока нет.', addReview: 'Оставить отзыв', rating: 'Оценка', comment: 'Комментарий',
    submit: 'Отправить отзыв', signIn: 'Войдите, чтобы оставить отзыв', noBooking: 'Для отзыва требуется завершённая аренда.',
    reviewError: 'Не удалось отправить отзыв.', reviewSuccess: 'Отзыв отправлен.', bookings: 'Завершённая аренда',
    edit: 'Редактировать объявление',
  },
};

function currentUserId() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')?.id;
  } catch {
    return null;
  }
}

export default function EquipmentDetail({ language = 'en' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const t = LABELS[language] || LABELS.en;
  const [equipment, setEquipment] = useState(null);
  const [reviews, setReviews] = useState({ items: [], total: 0, averageRating: 0 });
  const [eligibleBookings, setEligibleBookings] = useState([]);
  const [bookingId, setBookingId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const userId = currentUserId();

  const loadReviews = useCallback(async () => {
    const { data } = await axios.get(`${API_BASE}/reviews/equipment/${id}?page=1&limit=50`);
    setReviews(data);
  }, [id]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data } = await axios.get(`${API_BASE}/equipment/${id}`);
        if (active) setEquipment(data);
        await loadReviews();
        if (localStorage.getItem('token')) {
          const { data: eligible } = await axios.get(`${API_BASE}/reviews/eligible/${id}`, authConfig());
          if (active) setEligibleBookings(eligible.bookings);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.error || t.missing);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [id, loadReviews, t.missing]);

  async function submitReview(event) {
    event.preventDefault();
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    try {
      const { data } = await axios.post(`${API_BASE}/reviews`, {
        bookingId: Number(bookingId),
        rating: Number(rating),
        comment,
      }, authConfig());
      setEligibleBookings((current) => current.filter((booking) => booking.bookingId !== data.bookingId));
      setComment('');
      setNotice(t.reviewSuccess);
      setError('');
      await loadReviews();
    } catch (err) {
      setError(err.response?.data?.error || t.reviewError);
    }
  }

  async function contactOwner() {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    try {
      const { data } = await axios.post(`${API_BASE}/chat/conversations`, { equipmentId: Number(id) }, authConfig());
      navigate(`/messages/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || t.reviewError);
    }
  }

  if (loading) return <main className="feature-page"><p>{t.loading}</p></main>;
  if (!equipment) return <main className="feature-page"><p role="alert">{error || t.missing}</p></main>;

  return (
    <main className="feature-page equipment-detail">
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <div className="equipment-detail-grid">
        <div>
          {equipment.imageUrl && <img src={equipment.imageUrl} alt={equipment.name} className="equipment-detail-image" />}
        </div>
        <section>
          <h1>{equipment.name}</h1>
          <p><strong>{t.price}:</strong> ${equipment.pricePerDay} {t.perDay}</p>
          <p><strong>{t.location}:</strong> {[
            equipment.location,
            cityLabel(findCity(equipment.city), language),
          ].filter(Boolean).join(', ') || '—'}</p>
          <p><strong>{t.description}:</strong> {equipment.description || '—'}</p>
          <div className="feature-actions">
            <button type="button" onClick={() => navigate(`/booking/${id}`)}>{t.book}</button>
            {userId !== equipment.ownerId && <button type="button" onClick={contactOwner}>{t.contact}</button>}
            {userId != null && userId === equipment.ownerId && (
              <button type="button" onClick={() => navigate(`/list-equipment?edit=${id}`)}>{t.edit}</button>
            )}
            <FavoriteButton equipmentId={id} language={language} />
          </div>
        </section>
      </div>

      <section className="review-section">
        <h2>{t.reviews} ({reviews.total})</h2>
        {reviews.total > 0 && <p>{t.average}: {reviews.averageRating.toFixed(1)} / 5</p>}
        {!userId ? <p><Link to="/login">{t.signIn}</Link></p> :
          userId !== equipment.ownerId && eligibleBookings.length === 0 && <p>{t.noBooking}</p>}
        {userId && userId !== equipment.ownerId && eligibleBookings.length > 0 && (
          <form onSubmit={submitReview} className="review-form">
            <h3>{t.addReview}</h3>
            <label>
              {t.bookings}
              <select value={bookingId} onChange={(event) => setBookingId(event.target.value)} required>
                <option value="">—</option>
                {eligibleBookings.map((booking) => <option key={booking.bookingId} value={booking.bookingId}>{booking.bookingId}</option>)}
              </select>
            </label>
            <label>
              {t.rating}
              <select value={rating} onChange={(event) => setRating(Number(event.target.value))}>
                {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label>
              {t.comment}
              <textarea value={comment} maxLength={2000} onChange={(event) => setComment(event.target.value)} />
            </label>
            <button type="submit" disabled={!bookingId}>{t.submit}</button>
          </form>
        )}
        {!reviews.items.length ? <p>{t.noReviews}</p> : (
          <ul className="feature-list">
            {reviews.items.map((review) => (
              <li key={review.id}>
                <strong>★ {review.rating} · {review.reviewerUsername}</strong>
                <p>{review.comment || ''}</p>
                <time>{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Reviews({ equipmentId, language }) {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingBreakdown, setRatingBreakdown] = useState({});
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  const translations = {
    en: {
      reviews: 'Reviews',
      rating: 'Rating',
      averageRating: 'Average Rating',
      outOf: 'out of 5',
      totalReviews: 'Total Reviews',
      writeReview: 'Write a Review',
      reviewTitle: 'Review Title',
      reviewComment: 'Your Review',
      reviewPlaceholder: 'Share your experience with this equipment...',
      submitReview: 'Submit Review',
      cancel: 'Cancel',
      noReviews: 'No reviews yet. Be the first to review!',
      stars: 'stars',
      by: 'by',
      deleteReview: 'Delete Review',
      editReview: 'Edit Review',
      loading: 'Loading reviews...',
      error: 'Error loading reviews',
    },
    ka: {
      reviews: 'მიმოხილვები',
      rating: 'რეიტინგი',
      averageRating: 'საშუალო რეიტინგი',
      outOf: '5 იდან',
      totalReviews: 'მიმოხილვების სულ',
      writeReview: 'მიმოხილვის დაწერა',
      reviewTitle: 'მიმოხილვის სათაური',
      reviewComment: 'თქვენი მიმოხილვა',
      reviewPlaceholder: 'გაუზიარეთ თქვენი გამოცდილება ამ აღჭურვილობასთან...',
      submitReview: 'მიმოხილვის გაგზავნა',
      cancel: 'გაუქმება',
      noReviews: 'მიმოხილვები ჯერ არ არის. იбудьте პირველი!',
      stars: 'ვარი',
      by: 'by',
      deleteReview: 'მიმოხილვის წაშლა',
      editReview: 'მიმოხილვის რედაქტირება',
      loading: 'მიმოხილვების ჩატვირთვა...',
      error: 'შეცდომა მიმოხილვების ჩატვირთვაში',
    },
    ru: {
      reviews: 'Отзывы',
      rating: 'Рейтинг',
      averageRating: 'Средний рейтинг',
      outOf: 'из 5',
      totalReviews: 'Всего отзывов',
      writeReview: 'Написать отзыв',
      reviewTitle: 'Заголовок отзыва',
      reviewComment: 'Ваш отзыв',
      reviewPlaceholder: 'Поделитесь своим опытом использования этого оборудования...',
      submitReview: 'Отправить отзыв',
      cancel: 'Отмена',
      noReviews: 'Отзывов пока нет. Будьте первым!',
      stars: 'звёзд',
      by: 'от',
      deleteReview: 'Удалить отзыв',
      editReview: 'Редактировать отзыв',
      loading: 'Загрузка отзывов...',
      error: 'Ошибка при загрузке отзывов',
    },
  };

  const t = translations[language] || translations['en'];

  useEffect(() => {
    fetchReviews();
  }, [equipmentId]);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/reviews/equipment/${equipmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReviews(response.data.reviews);
      setAverageRating(response.data.averageRating);
      setTotalReviews(response.data.totalReviews);
      setRatingBreakdown(response.data.ratingBreakdown);
    } catch (err) {
      setError(t.error);
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // In a real app, you'd get bookingId, reviewedUserId from the booking context
      // For now, we'll use dummy values
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/reviews`,
        {
          bookingId: 1, // Should come from booking context
          reviewedUserId: 1, // Should come from equipment owner
          equipmentId: equipmentId,
          rating: parseInt(newReview.rating),
          title: newReview.title,
          comment: newReview.comment,
          reviewType: 'equipment',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Review submitted successfully!');
      setNewReview({ rating: 5, title: '', comment: '' });
      setShowForm(false);
      fetchReviews();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting review');
    }
  };

  const StarRating = ({ rating, onClick, readOnly }) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''}`}
            onClick={() => !readOnly && onClick(star)}
            style={{ cursor: readOnly ? 'default' : 'pointer' }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const RatingBreakdownBar = ({ rating, count, total }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="rating-breakdown-bar">
        <span className="rating-label">{rating}★</span>
        <div className="bar-container">
          <div className="bar-fill" style={{ width: `${percentage}%` }}></div>
        </div>
        <span className="rating-count">{count}</span>
      </div>
    );
  };

  if (loading) {
    return <div className="reviews-section">{t.loading}</div>;
  }

  return (
    <div className="reviews-section">
      <h2>{t.reviews}</h2>

      {/* Rating Summary */}
      {totalReviews > 0 && (
        <div className="rating-summary">
          <div className="average-rating">
            <div className="rating-number">{averageRating}</div>
            <StarRating rating={Math.round(averageRating)} readOnly={true} />
            <p>{totalReviews} {t.totalReviews}</p>
          </div>

          <div className="rating-breakdown">
            {[5, 4, 3, 2, 1].map((rating) => (
              <RatingBreakdownBar
                key={rating}
                rating={rating}
                count={ratingBreakdown[rating] || 0}
                total={totalReviews}
              />
            ))}
          </div>
        </div>
      )}

      {/* Write Review Button */}
      {localStorage.getItem('token') && (
        <div className="review-form-section">
          {!showForm ? (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              {t.writeReview}
            </button>
          ) : (
            <form onSubmit={handleSubmitReview} className="review-form">
              <div className="form-group">
                <label>{t.rating}</label>
                <StarRating
                  rating={newReview.rating}
                  onClick={(rate) => setNewReview({ ...newReview, rating: rate })}
                  readOnly={false}
                />
              </div>

              <div className="form-group">
                <label>{t.reviewTitle}</label>
                <input
                  type="text"
                  placeholder="e.g., Excellent equipment!"
                  value={newReview.title}
                  onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>{t.reviewComment}</label>
                <textarea
                  placeholder={t.reviewPlaceholder}
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  rows="4"
                  required
                />
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {t.submitReview}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  {t.cancel}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Reviews List */}
      <div className="reviews-list">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <div className="review-rating">
                  <StarRating rating={review.rating} readOnly={true} />
                  <span className="review-date">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {review.title && <h4>{review.title}</h4>}
              </div>
              <p className="review-comment">{review.comment}</p>
            </div>
          ))
        ) : (
          <p className="no-reviews">{t.noReviews}</p>
        )}
      </div>

      <style jsx>{`
        .reviews-section {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-top: 2rem;
        }

        .reviews-section h2 {
          margin-bottom: 1.5rem;
          color: #333;
        }

        .rating-summary {
          display: grid;
          grid-template-columns: 150px 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: #f9f9f9;
          border-radius: 8px;
        }

        .average-rating {
          text-align: center;
        }

        .rating-number {
          font-size: 3rem;
          font-weight: bold;
          color: #667eea;
        }

        .star-rating {
          display: flex;
          gap: 0.3rem;
          justify-content: center;
          font-size: 1.5rem;
          margin: 0.5rem 0;
        }

        .star {
          color: #ddd;
          cursor: pointer;
          transition: color 0.2s;
        }

        .star.filled {
          color: #ffc107;
        }

        .star:hover {
          color: #ffc107;
        }

        .rating-breakdown {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .rating-breakdown-bar {
          display: grid;
          grid-template-columns: 40px 1fr 40px;
          align-items: center;
          gap: 1rem;
        }

        .rating-label {
          font-weight: 600;
          color: #666;
          font-size: 0.9rem;
        }

        .bar-container {
          background: #eee;
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
        }

        .bar-fill {
          background: #ffc107;
          height: 100%;
          transition: width 0.3s;
        }

        .rating-count {
          color: #999;
          font-size: 0.9rem;
        }

        .review-form-section {
          margin: 2rem 0;
          padding: 1.5rem;
          background: #f9f9f9;
          border-radius: 8px;
        }

        .review-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 600;
          color: #333;
        }

        .form-group input,
        .form-group textarea {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary {
          background-color: #667eea;
          color: white;
        }

        .btn-primary:hover {
          background-color: #5568d3;
        }

        .btn-secondary {
          background-color: #999;
          color: white;
        }

        .btn-secondary:hover {
          background-color: #777;
        }

        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 0.75rem;
          border-radius: 4px;
          border: 1px solid #f5c6cb;
        }

        .success-message {
          background-color: #d4edda;
          color: #155724;
          padding: 0.75rem;
          border-radius: 4px;
          border: 1px solid #c3e6cb;
        }

        .reviews-list {
          margin-top: 2rem;
        }

        .review-card {
          padding: 1.5rem;
          border: 1px solid #eee;
          border-radius: 6px;
          margin-bottom: 1rem;
          background: #fafafa;
        }

        .review-header {
          margin-bottom: 1rem;
        }

        .review-rating {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .review-date {
          color: #999;
          font-size: 0.9rem;
        }

        .review-card h4 {
          margin: 0.5rem 0 0 0;
          color: #333;
        }

        .review-comment {
          color: #666;
          line-height: 1.6;
          margin: 0;
        }

        .no-reviews {
          text-align: center;
          color: #999;
          padding: 2rem;
        }

        @media (max-width: 768px) {
          .rating-summary {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .form-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Reviews;
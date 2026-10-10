import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE, authConfig } from '../utils/api';
import '../styles/Features.css';

const LABELS = {
  en: { title: 'Dashboard', bookingsTab: 'My Bookings', listingsTab: 'My Listings', noBookings: 'No bookings yet. Start renting equipment!', noListings: 'You haven\'t listed any equipment yet.', delete: 'Delete', cancel: 'Cancel', confirm: 'Delete Listing', confirmMsg: 'Are you sure you want to delete this listing? This cannot be undone.', deleteSuccess: 'Listing deleted successfully.', deleteError: 'Could not delete listing.', loading: 'Loading…', price: 'Price', perDay: '/day', location: 'Location', status: 'Status', startDate: 'Start Date', endDate: 'End Date', totalPrice: 'Total Price' },
  ka: { title: 'ინფოპანელი', bookingsTab: 'ჩემი დაკვეთები', listingsTab: 'ჩემი განცხადებები', noBookings: 'დაკვეთები ჯერ არ არის. დაიწყეთ აპარატის ქირავნება!', noListings: 'თქვენ ჯერ არ დაგიმელებია აპარატი.', delete: 'წაშლა', cancel: 'გაუქმება', confirm: 'განცხადების წაშლა', confirmMsg: 'ნამდვილად გსურთ ამ განცხადების წაშლა? ეს გაუქმებული არ იქნება.', deleteSuccess: 'განცხადება წაშლილია.', deleteError: 'განცხადება არ დაიშალა.', loading: 'იტვირთება…', price: 'ფასი', perDay: '/დღე', location: 'ადგილმდებარეობა', status: 'სტატუსი', startDate: 'დაწყების თარიღი', endDate: 'დასრულების თარიღი', totalPrice: 'სულ' },
  ru: { title: 'Панель', bookingsTab: 'Мои бронирования', listingsTab: 'Мои объявления', noBookings: 'Бронирований еще нет. Начните арендовать оборудование!', noListings: 'Вы еще не размещали оборудование.', delete: 'Удалить', cancel: 'Отмена', confirm: 'Удалить объявление', confirmMsg: 'Вы уверены, что хотите удалить это объявление? Это нельзя отменить.', deleteSuccess: 'Объявление удалено.', deleteError: 'Не удалось удалить объявление.', loading: 'Загрузка…', price: 'Цена', perDay: '/день', location: 'Местоположение', status: 'Статус', startDate: 'Дата начала', endDate: 'Дата окончания', totalPrice: 'Всего' },
};

function Dashboard({ language = 'en', isLoggedIn }) {
  const t = LABELS[language] || LABELS.en;
  const [bookings, setBookings] = useState([]);
  const [listings, setListings] = useState([]);
  const [activeTab, setActiveTab] = useState('bookings');
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('token');

  const fetchData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [bookingsRes, listingsRes] = await Promise.all([
        axios.get(`${API_BASE}/bookings/my-bookings`, authConfig()),
        axios.get(`${API_BASE}/equipment/my-equipment`, authConfig()),
      ]);
      setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
      setListings(Array.isArray(listingsRes.data) ? listingsRes.data : []);
      setMessage('');
    } catch (error) {
      console.error('Error fetching data:', error);
      setBookings([]);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData, isLoggedIn]);

  async function deleteListing(id) {
    try {
      await axios.delete(`${API_BASE}/equipment/${id}`, authConfig());
      setMessage(t.deleteSuccess);
      setDeleteConfirm(null);
      await fetchData();
    } catch (error) {
      setMessage(t.deleteError);
      console.error('Error deleting listing:', error);
    }
  }

  if (!isLoggedIn) return <main className="feature-page"><p>Please log in</p></main>;
  if (loading) return <main className="feature-page"><p>{t.loading}</p></main>;

  return (
    <main className="feature-page">
      <h1>{t.title}</h1>
      {message && <p role="status">{message}</p>}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          {t.bookingsTab}
        </button>
        <button
          className={`tab ${activeTab === 'listings' ? 'active' : ''}`}
          onClick={() => setActiveTab('listings')}
        >
          {t.listingsTab}
        </button>
      </div>

      {activeTab === 'bookings' && (
        <div className="bookings-section">
          <h2>{t.bookingsTab}</h2>
          {bookings.length > 0 ? (
            <ul className="feature-list">
              {bookings.map((booking) => (
                <li key={booking.id}>
                  <strong>{booking.equipmentName || `Equipment ${booking.equipmentId}`}</strong>
                  <p>{t.startDate}: {booking.startDate} | {t.endDate}: {booking.endDate}</p>
                  <p>{t.totalPrice}: ${booking.totalPrice} | {t.status}: {booking.status}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>{t.noBookings}</p>
          )}
        </div>
      )}

      {activeTab === 'listings' && (
        <div className="listings-section">
          <h2>{t.listingsTab}</h2>
          {listings.length > 0 ? (
            <ul className="feature-list">
              {listings.map((listing) => (
                <li key={listing.id}>
                  <strong>{listing.name}</strong>
                  <p>{t.price}: ${listing.pricePerDay} {t.perDay} | {t.location}: {listing.location || '—'}</p>
                  {listing.description && <p>{listing.description}</p>}
                  <div className="feature-actions">
                    {deleteConfirm === listing.id ? (
                      <>
                        <p>{t.confirmMsg}</p>
                        <button type="button" onClick={() => deleteListing(listing.id)}>{t.confirm}</button>
                        <button type="button" onClick={() => setDeleteConfirm(null)}>{t.cancel}</button>
                      </>
                    ) : (
                      <button type="button" onClick={() => setDeleteConfirm(listing.id)}>{t.delete}</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>{t.noListings}</p>
          )}
        </div>
      )}
    </main>
  );
}

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function OwnerDashboard() {
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [activeTab, setActiveTab] = useState('listings');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const rawUser = JSON.parse(localStorage.getItem('user') || 'null');
  const user = rawUser && typeof rawUser.id === 'number' ? rawUser : null;

  useEffect(() => {
    if (!token || !user) {
      navigate('/login');
      return;
    }
    fetchListings();
    fetchBookings();
    fetchEarnings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchListings = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/equipment/owner/${user.id}`
      );
      setListings(response.data);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/bookings/my-bookings`, {
        headers: { Authorization: 'Bearer ' + token },
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchEarnings = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/users/${user.id}/earnings`,
        { headers: { Authorization: 'Bearer ' + token } }
      );
      setEarnings(response.data);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/equipment/${id}`, {
        headers: { Authorization: 'Bearer ' + token },
      });
      setListings((prev) => prev.filter((item) => item.id !== id));
      setMessage('Listing deleted successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to delete listing.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (!token || !user) return null;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>My Dashboard</h2>
        <Link to="/add-equipment" className="btn btn-primary">
          + Add New Equipment
        </Link>
      </div>

      {message && <p className="success-message">{message}</p>}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'listings' ? 'active' : ''}`}
          onClick={() => setActiveTab('listings')}
        >
          My Listings
        </button>
        <button
          className={`tab ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          My Bookings
        </button>
        <button
          className={`tab ${activeTab === 'earnings' ? 'active' : ''}`}
          onClick={() => setActiveTab('earnings')}
        >
          Earnings
        </button>
      </div>

      {activeTab === 'listings' && (
        <div className="listings-section">
          <h3>My Equipment Listings</h3>
          {loading ? (
            <p>Loading...</p>
          ) : listings.length > 0 ? (
            <div className="equipment-grid">
              {listings.map((item) => (
                <div key={item.id} className="equipment-card">
                  <img
                    src={item.imageUrl || 'https://via.placeholder.com/300'}
                    alt={item.name}
                  />
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <p className="price">${item.pricePerDay}/day</p>
                  <p className="location">📍 {item.location}</p>
                  <div className="card-actions">
                    <Link
                      to={`/edit-equipment/${item.id}`}
                      className="btn btn-secondary"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="btn btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>You haven't listed any equipment yet.</p>
              <Link to="/add-equipment" className="btn btn-primary">
                List Your First Item
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="bookings-section">
          <h3>My Bookings</h3>
          {bookings.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Equipment ID</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Total Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.equipmentId}</td>
                    <td>{booking.startDate}</td>
                    <td>{booking.endDate}</td>
                    <td>${booking.totalPrice}</td>
                    <td>{booking.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No bookings yet. Start renting equipment!</p>
          )}
        </div>
      )}

      {activeTab === 'earnings' && (
        <div className="earnings-section">
          <h3>Earnings Overview</h3>
          {earnings ? (
            <div className="earnings-cards">
              <div className="earnings-card">
                <h4>Gross Revenue</h4>
                <p className="earnings-amount">${earnings.grossTotal.toFixed(2)}</p>
              </div>
              <div className="earnings-card">
                <h4>Platform Fee (5%)</h4>
                <p className="earnings-amount commission">${earnings.commission.toFixed(2)}</p>
              </div>
              <div className="earnings-card highlight">
                <h4>Your Earnings (95%)</h4>
                <p className="earnings-amount">${earnings.netEarnings.toFixed(2)}</p>
              </div>
              <div className="earnings-card">
                <h4>Completed Rentals</h4>
                <p className="earnings-amount">{earnings.bookingCount}</p>
              </div>
            </div>
          ) : (
            <p>Loading earnings...</p>
          )}
        </div>
      )}
    </div>
  );
}

export default OwnerDashboard;

import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('bookings');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      fetchBookings();
    }
  }, [token]);

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  return (
    <div className="dashboard">
      <h2>My Dashboard</h2>
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          My Bookings
        </button>
        <button
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
      </div>

      {activeTab === 'bookings' && (
        <div className="bookings-section">
          <h3>Your Bookings</h3>
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

      {activeTab === 'profile' && (
        <div className="profile-section">
          <h3>My Profile</h3>
          <p>Update your profile information here</p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

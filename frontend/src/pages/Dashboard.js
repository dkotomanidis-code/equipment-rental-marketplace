import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const apiBaseUrl = process.env.REACT_APP_API_URL || '/api';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleDateString();
}

function SummaryCard({ title, value, subtitle }) {
  return (
    <div className="summary-card">
      <p className="summary-card-title">{title}</p>
      <h3>{value}</h3>
      {subtitle && <p className="summary-card-subtitle">{subtitle}</p>}
    </div>
  );
}

function BookingTable({ title, bookings, emptyMessage }) {
  return (
    <div className="dashboard-section">
      <div className="dashboard-section-header">
        <h3>{title}</h3>
      </div>
      {bookings.length === 0 ? (
        <p className="empty-state">{emptyMessage}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Equipment</th>
              <th>Dates</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>
                  <strong>{booking.equipmentName || `Equipment #${booking.equipmentId}`}</strong>
                  {booking.ownerName && <div className="table-subtext">Owner: {booking.ownerName}</div>}
                  {booking.renterName && <div className="table-subtext">Renter: {booking.renterName}</div>}
                </td>
                <td>{formatDate(booking.startDate)} → {formatDate(booking.endDate)}</td>
                <td className="status-cell">{booking.status}</td>
                <td>{formatCurrency(booking.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const headers = useMemo(
    () => ({
      Authorization: 'Bearer ' + token,
    }),
    [token]
  );

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await axios.get(`${apiBaseUrl}/dashboard`, { headers });
        setDashboard(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Unable to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [headers, token]);

  const removeFavorite = async (equipmentId) => {
    try {
      await axios.delete(`${apiBaseUrl}/favorites/${equipmentId}`, { headers });
      setDashboard((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          summary: {
            ...current.summary,
            savedFavorites: Math.max(0, (current.summary?.savedFavorites || 1) - 1),
          },
          favorites: (current.favorites || []).filter((favorite) => favorite.equipmentId !== equipmentId),
        };
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to remove favorite');
    }
  };

  if (!token) {
    return (
      <div className="dashboard">
        <div className="dashboard-section">
          <h2>Dashboard</h2>
          <p className="empty-state">Please log in to view your dashboard.</p>
          <Link to="/login" className="btn btn-primary">Go to Login</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="dashboard"><p>Loading your dashboard...</p></div>;
  }

  if (error) {
    return <div className="dashboard"><p className="error">{error}</p></div>;
  }

  if (!dashboard) {
    return <div className="dashboard"><p className="empty-state">No dashboard data available.</p></div>;
  }

  const isOwner = dashboard.role === 'owner';

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>{isOwner ? 'Owner Dashboard' : 'Renter Dashboard'}</h2>
          <p className="dashboard-subtitle">
            Welcome back{dashboard.user?.firstName ? `, ${dashboard.user.firstName}` : ''}.
          </p>
        </div>
      </div>

      <div className="summary-grid">
        {isOwner ? (
          <>
            <SummaryCard title="Total Earnings" value={formatCurrency(dashboard.summary.totalEarnings)} />
            <SummaryCard title="Active Rentals" value={dashboard.summary.activeRentals} />
            <SummaryCard title="Upcoming Bookings" value={dashboard.summary.upcomingBookings} />
            <SummaryCard title="Listed Equipment" value={dashboard.summary.listedEquipmentCount} />
          </>
        ) : (
          <>
            <SummaryCard title="Total Rentals" value={dashboard.summary.totalRentals} />
            <SummaryCard title="Total Spending" value={formatCurrency(dashboard.summary.totalSpending)} />
            <SummaryCard title="Current Bookings" value={dashboard.summary.currentBookings} />
            <SummaryCard title="Upcoming Bookings" value={dashboard.summary.upcomingBookings} />
            <SummaryCard title="Saved Favorites" value={dashboard.summary.savedFavorites} />
          </>
        )}
      </div>

      {isOwner ? (
        <>
          <BookingTable
            title="Upcoming Bookings"
            bookings={dashboard.upcomingBookings || []}
            emptyMessage="You do not have any upcoming bookings yet."
          />
          <BookingTable
            title="Recent Bookings"
            bookings={dashboard.recentBookings || []}
            emptyMessage="No recent bookings yet."
          />

          <div className="dashboard-section">
            <div className="dashboard-section-header">
              <h3>Earnings</h3>
            </div>
            {dashboard.recentEarnings?.length ? (
              <table>
                <thead>
                  <tr>
                    <th>Equipment</th>
                    <th>Rental Dates</th>
                    <th>Status</th>
                    <th>Net Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recentEarnings.map((earning) => (
                    <tr key={earning.id}>
                      <td>{earning.equipmentName || `Equipment #${earning.equipmentId}`}</td>
                      <td>{formatDate(earning.rentalStartDate)} → {formatDate(earning.rentalEndDate)}</td>
                      <td className="status-cell">{earning.status}</td>
                      <td>{formatCurrency(earning.netAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-state">Your earnings will appear here after confirmed rentals.</p>
            )}
            {dashboard.earningsByMonth?.length > 0 && (
              <div className="earnings-breakdown">
                {dashboard.earningsByMonth.map((entry) => (
                  <div key={entry.month} className="earnings-breakdown-item">
                    <span>{entry.month}</span>
                    <strong>{formatCurrency(entry.total)}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <BookingTable
            title="Current & Upcoming Bookings"
            bookings={dashboard.currentAndUpcomingBookings || []}
            emptyMessage="No active or upcoming bookings."
          />
          <BookingTable
            title="Rental History"
            bookings={dashboard.rentalHistory || []}
            emptyMessage="You have not completed any rentals yet."
          />

          <div className="dashboard-section">
            <div className="dashboard-section-header">
              <h3>Saved Favorites</h3>
            </div>
            {dashboard.favorites?.length ? (
              <div className="favorites-grid">
                {dashboard.favorites.map((favorite) => (
                  <div key={favorite.id} className="favorite-card">
                    <img
                      src={favorite.equipment?.imageUrl || 'https://via.placeholder.com/300'}
                      alt={favorite.equipment?.name}
                    />
                    <h4>{favorite.equipment?.name}</h4>
                    <p>{favorite.equipment?.location || 'Location pending'}</p>
                    <p className="price">{formatCurrency(favorite.equipment?.pricePerDay)}/day</p>
                    <div className="favorite-actions">
                      <Link to={`/equipment/${favorite.equipmentId}`} className="btn btn-secondary">View</Link>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => removeFavorite(favorite.equipmentId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">Save favorites from the equipment page to keep track of listings you like.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;

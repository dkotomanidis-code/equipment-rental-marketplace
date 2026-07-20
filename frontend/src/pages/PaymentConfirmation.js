import React from 'react';
import { useLocation, Link } from 'react-router-dom';

function PaymentConfirmation() {
  const location = useLocation();
  const { booking, paymentId, equipment } = location.state || {};

  if (!booking) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-container">
          <p>No booking information found.</p>
          <Link to="/equipment" className="btn btn-primary">Browse Equipment</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-page">
      <div className="confirmation-container">
        <div className="confirmation-icon">✅</div>
        <h2>Booking Confirmed!</h2>
        <p className="confirmation-subtitle">
          Your payment was successful and your booking is confirmed.
        </p>

        <div className="confirmation-details">
          <h3>Booking Details</h3>
          <div className="detail-row">
            <span>Booking ID</span>
            <span>#{booking.id}</span>
          </div>
          {equipment && (
            <div className="detail-row">
              <span>Equipment</span>
              <span>{equipment.name}</span>
            </div>
          )}
          <div className="detail-row">
            <span>Start Date</span>
            <span>{booking.startDate}</span>
          </div>
          <div className="detail-row">
            <span>End Date</span>
            <span>{booking.endDate}</span>
          </div>
          <div className="detail-row">
            <span>Total Paid</span>
            <span>${Number(booking.totalPrice).toFixed(2)}</span>
          </div>
          <div className="detail-row">
            <span>Status</span>
            <span className="status-badge confirmed">{booking.status}</span>
          </div>
          {paymentId && (
            <div className="detail-row">
              <span>Payment Reference</span>
              <span className="payment-ref">{paymentId}</span>
            </div>
          )}
        </div>

        <div className="confirmation-actions">
          <Link to="/dashboard" className="btn btn-primary">View My Bookings</Link>
          <Link to="/equipment" className="btn btn-secondary">Browse More Equipment</Link>
        </div>
      </div>
    </div>
  );
}

export default PaymentConfirmation;

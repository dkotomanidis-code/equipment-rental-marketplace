import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY)
  : null;

const PLATFORM_COMMISSION_RATE = 0.05;

function CheckoutForm({ equipment, startDate, endDate, totalPrice, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const commission = totalPrice * PLATFORM_COMMISSION_RATE;
  const ownerAmount = totalPrice - commission;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    try {
      // Step 1: Create payment intent
      const intentRes = await axios.post(`${process.env.REACT_APP_API_URL}/payments/create-intent`, {
        amount: totalPrice,
        currency: 'usd',
      });
      const { clientSecret, paymentId } = intentRes.data;

      // Step 2: Confirm card payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
        return;
      }

      // Step 3: Confirm payment on the backend
      await axios.post(`${process.env.REACT_APP_API_URL}/payments/confirm`, {
        paymentIntentId: paymentIntent.id,
      });

      // Step 4: Create booking record only after payment is confirmed
      const bookingRes = await axios.post(`${process.env.REACT_APP_API_URL}/bookings`, {
        equipmentId: equipment.id,
        startDate,
        endDate,
        totalPrice,
        paymentId: paymentIntent.id,
      });

      onSuccess({ booking: bookingRes.data, paymentId: paymentIntent.id });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <div className="price-breakdown">
        <h3>Price Breakdown</h3>
        <div className="breakdown-row">
          <span>Rental Total</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
        <div className="breakdown-row commission">
          <span>Platform Fee (5%)</span>
          <span>${commission.toFixed(2)}</span>
        </div>
        <div className="breakdown-row owner-row">
          <span>Owner Receives (95%)</span>
          <span>${ownerAmount.toFixed(2)}</span>
        </div>
        <div className="breakdown-row total">
          <span><strong>You Pay</strong></span>
          <span><strong>${totalPrice.toFixed(2)}</strong></span>
        </div>
      </div>

      <div className="card-section">
        <label className="card-label">Card Details</label>
        <div className="card-element-wrapper">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#1f2937',
                  '::placeholder': { color: '#6b7280' },
                },
                invalid: { color: '#dc2626' },
              },
            }}
          />
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <button type="submit" className="btn btn-primary pay-btn" disabled={!stripe || loading}>
        {loading ? 'Processing...' : `Pay $${totalPrice.toFixed(2)}`}
      </button>

      <p className="secure-note">🔒 Payments are securely processed by Stripe</p>
    </form>
  );
}

function Booking() {
  const { equipmentId } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [rentalDays, setRentalDays] = useState(0);
  const [error, setError] = useState('');
  const [step, setStep] = useState('dates'); // 'dates' | 'payment'

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/equipment/${equipmentId}`);
        setEquipment(response.data);
      } catch (err) {
        setError('Equipment not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchEquipment();
  }, [equipmentId]);

  useEffect(() => {
    if (startDate && endDate && equipment) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end - start;
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (days > 0) {
        setRentalDays(days);
        setTotalPrice(days * equipment.pricePerDay);
      } else {
        setRentalDays(0);
        setTotalPrice(0);
      }
    }
  }, [startDate, endDate, equipment]);

  const handleDateSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!startDate || !endDate) {
      setError('Please select both start and end dates.');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('End date must be after start date.');
      return;
    }
    if (rentalDays <= 0) {
      setError('Please select a valid date range.');
      return;
    }
    setStep('payment');
  };

  const handlePaymentSuccess = ({ booking, paymentId }) => {
    navigate('/payment-confirmation', { state: { booking, paymentId, equipment } });
  };

  const today = new Date().toISOString().split('T')[0];

  if (loading) return <div className="booking-page"><p>Loading...</p></div>;
  if (error && !equipment) return <div className="booking-page"><p className="error">{error}</p></div>;

  return (
    <div className="booking-page">
      <div className="booking-container">
        <div className="equipment-summary">
          <img
            src={equipment.imageUrl || 'https://via.placeholder.com/300'}
            alt={equipment.name}
            className="booking-equipment-img"
          />
          <div className="equipment-info">
            <h2>{equipment.name}</h2>
            <p className="booking-price">${equipment.pricePerDay}/day</p>
            <p className="booking-location">📍 {equipment.location}</p>
            {equipment.description && <p className="booking-desc">{equipment.description}</p>}
          </div>
        </div>

        <div className="booking-form-section">
          {step === 'dates' && (
            <form onSubmit={handleDateSubmit} className="dates-form">
              <h3>Select Rental Dates</h3>

              <div className="date-fields">
                <div className="date-field">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    min={today}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="date-field">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || today}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {rentalDays > 0 && (
                <div className="price-summary">
                  <p>
                    {rentalDays} day{rentalDays !== 1 ? 's' : ''} × ${equipment.pricePerDay}/day
                    = <strong>${totalPrice.toFixed(2)}</strong>
                  </p>
                </div>
              )}

              {error && <p className="error">{error}</p>}

              <button type="submit" className="btn btn-primary" disabled={rentalDays <= 0}>
                Continue to Payment
              </button>
            </form>
          )}

          {step === 'payment' && (
            <div className="payment-step">
              <button
                className="back-btn"
                onClick={() => setStep('dates')}
              >
                ← Back to Dates
              </button>
              <h3>Payment Details</h3>
              <p className="rental-summary">
                Renting <strong>{equipment.name}</strong> for {rentalDays} day{rentalDays !== 1 ? 's' : ''}
                &nbsp;({startDate} → {endDate})
              </p>
              {stripePromise ? (
                <Elements stripe={stripePromise}>
                  <CheckoutForm
                    equipment={equipment}
                    startDate={startDate}
                    endDate={endDate}
                    totalPrice={totalPrice}
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>
              ) : (
                <p className="error">
                  Payment is not configured. Please set the{' '}
                  <code>REACT_APP_STRIPE_PUBLISHABLE_KEY</code> environment variable to enable payments.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Booking;

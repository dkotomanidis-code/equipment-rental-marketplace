import axios from 'axios';

const recoveryKey = 'marketplaceCheckoutRecovery';

export function pendingCheckout() {
  try { return JSON.parse(sessionStorage.getItem(recoveryKey)); } catch { return null; }
}

export async function checkout({ equipment, startDate, endDate, totalPrice, stripe, card }) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Please log in before making a booking.');
  if (pendingCheckout()) throw new Error('Resolve your previous payment before starting another booking.');
  const config = { headers: { Authorization: ['Bearer', token].join(' ') } };
  const base = process.env.REACT_APP_API_URL;
  const { data: intent } = await axios.post(`${base}/payments/create-intent`, {
    amount: totalPrice, currency: 'usd',
  }, config);
  const paymentId = intent.paymentId;
  sessionStorage.setItem(recoveryKey, JSON.stringify({ paymentId }));
  // Save before contacting Stripe; network errors must not enable a second charge.
  try {
    const result = await stripe.confirmCardPayment(intent.clientSecret, {
      payment_method: { card },
    });
    if (result.error) {
      const error = new Error(result.error.message);
      if (['requires_payment_method', 'canceled'].includes(result.error.payment_intent?.status)) {
        sessionStorage.removeItem(recoveryKey);
        error.paymentResolved = true;
      }
      throw error;
    }
    if (result.paymentIntent?.status !== 'succeeded') {
      throw new Error('Payment is not complete. Check its status before trying again.');
    }
    const { data: confirmation } = await axios.post(`${base}/payments/confirm`, {
      paymentIntentId: paymentId,
    }, config);
    if (confirmation.status !== 'succeeded') throw new Error('Payment has not been verified.');
    const { data: booking } = await axios.post(`${base}/bookings`, {
      equipmentId: equipment.id, startDate, endDate, paymentId,
    }, config);
    sessionStorage.removeItem(recoveryKey);
    return { booking, paymentId };
  } catch (error) {
    if (!error.paymentResolved) error.paidPaymentId = paymentId;
    throw error;
  }
}

export async function refundCheckout(paymentId) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Please log in to refund this payment.');
  const config = { headers: { Authorization: ['Bearer', token].join(' ') } };
  const base = process.env.REACT_APP_API_URL;
  const { data: payment } = await axios.get(`${base}/payments/${paymentId}`, config);
  if (payment.status === 'refunded') {
    sessionStorage.removeItem(recoveryKey);
    return { status: 'succeeded' };
  }
  if (!['completed', 'succeeded', 'refund_pending', 'refund_failed'].includes(payment.status)) {
    const { data: confirmation } = await axios.post(`${base}/payments/confirm`, {
      paymentIntentId: paymentId,
    }, config);
    if (['requires_payment_method', 'canceled'].includes(confirmation.status)) {
      sessionStorage.removeItem(recoveryKey);
      return { status: 'not_charged' };
    }
    if (confirmation.status !== 'succeeded') {
      throw new Error(`Payment status: ${confirmation.status}. Check again before starting another payment.`);
    }
  }
  const { data } = await axios.post(`${base}/payments/refund`, {
    paymentIntentId: paymentId,
  }, config);
  if (data.status === 'succeeded') sessionStorage.removeItem(recoveryKey);
  return data;
}

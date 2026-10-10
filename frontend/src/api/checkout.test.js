import axios from 'axios';
import { checkout, refundCheckout } from './checkout';

jest.mock('axios');
const args = {
  equipment: { id: 4 }, startDate: '2027-01-01', endDate: '2027-01-03',
  totalPrice: 24.68, card: {},
};
beforeEach(() => {
  jest.resetAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('token', 'test-token');
  process.env.REACT_APP_API_URL = 'http://localhost:5000/api';
});
test('all protected checkout calls send the JWT and use backend pricing', async () => {
  const booking = { id: 8 };
  axios.post.mockResolvedValueOnce({ data: { clientSecret: 'test-secret', paymentId: 'pi_test' } })
    .mockResolvedValueOnce({ data: { status: 'succeeded' } })
    .mockResolvedValueOnce({ data: booking });
  const stripe = { confirmCardPayment: jest.fn().mockResolvedValue({ paymentIntent: { id: 'pi_test', status: 'succeeded' } }) };
  expect(await checkout({ ...args, stripe })).toEqual({ booking, paymentId: 'pi_test' });
  axios.post.mock.calls.forEach((call) => expect(call[2].headers.Authorization).toBe(['Bearer', 'test-token'].join(' ')));
  expect(axios.post.mock.calls[2][1]).toEqual({
    equipmentId: 4, startDate: args.startDate, endDate: args.endDate, paymentId: 'pi_test',
  });
});
test('logged-out checkout never contacts Stripe or the API', async () => {
  localStorage.clear();
  await expect(checkout(args)).rejects.toThrow('log in');
  expect(axios.post).not.toHaveBeenCalled();
});
test('declined cards never create a booking', async () => {
  axios.post.mockResolvedValueOnce({ data: { clientSecret: 'test-secret', paymentId: 'pi_test' } });
  const stripe = { confirmCardPayment: jest.fn().mockResolvedValue({ error: {
    message: 'Declined', payment_intent: { status: 'requires_payment_method' },
  } }) };
  await expect(checkout({ ...args, stripe })).rejects.toThrow('Declined');
  expect(axios.post).toHaveBeenCalledTimes(1);
});
test('processing payments never create bookings', async () => {
  axios.post.mockResolvedValueOnce({ data: { clientSecret: 'test-secret', paymentId: 'pi_test' } });
  const stripe = { confirmCardPayment: jest.fn().mockResolvedValue({ paymentIntent: { id: 'pi_test', status: 'processing' } }) };
  await expect(checkout({ ...args, stripe })).rejects.toThrow('not complete');
  expect(axios.post).toHaveBeenCalledTimes(1);
  await expect(checkout({ ...args, stripe })).rejects.toThrow('previous payment');
  expect(axios.post).toHaveBeenCalledTimes(1);
});
test('post-payment failures retain the payment reference for refund recovery', async () => {
  axios.post.mockResolvedValueOnce({ data: { clientSecret: 'test-secret', paymentId: 'pi_test' } })
    .mockResolvedValueOnce({ data: { status: 'succeeded' } }).mockRejectedValueOnce(new Error('Already booked'));
  const stripe = { confirmCardPayment: jest.fn().mockResolvedValue({ paymentIntent: { id: 'pi_test', status: 'succeeded' } }) };
  await expect(checkout({ ...args, stripe })).rejects.toMatchObject({ paidPaymentId: 'pi_test' });
});
test('refund recovery uses authenticated requests', async () => {
  axios.get.mockResolvedValueOnce({ data: { status: 'completed' } });
  axios.post.mockResolvedValueOnce({ data: { status: 'pending' } });
  expect(await refundCheckout('pi_test')).toEqual({ status: 'pending' });
  expect(axios.post.mock.calls[0][2].headers.Authorization).toBe(['Bearer', 'test-token'].join(' '));
});
test('refund recovery confirms an interrupted backend confirmation before refunding', async () => {
  axios.get.mockResolvedValueOnce({ data: { status: 'pending' } });
  axios.post.mockResolvedValueOnce({ data: { status: 'succeeded' } })
    .mockResolvedValueOnce({ data: { status: 'succeeded' } });
  expect(await refundCheckout('pi_test')).toEqual({ status: 'succeeded' });
  expect(axios.post.mock.calls[0][0]).toContain('/payments/confirm');
  expect(axios.post.mock.calls[1][0]).toContain('/payments/refund');
});
test('processing recovery retains its reference and does not request a refund prematurely', async () => {
  sessionStorage.setItem('marketplaceCheckoutRecovery', JSON.stringify({ paymentId: 'pi_test' }));
  axios.get.mockResolvedValueOnce({ data: { status: 'pending' } });
  axios.post.mockResolvedValueOnce({ data: { status: 'processing' } });
  await expect(refundCheckout('pi_test')).rejects.toThrow('processing');
  expect(sessionStorage.getItem('marketplaceCheckoutRecovery')).not.toBeNull();
  expect(axios.post).toHaveBeenCalledTimes(1);
});
test('unknown Stripe network errors persist recovery before enabling another charge', async () => {
  axios.post.mockResolvedValueOnce({ data: { clientSecret: 'test-secret', paymentId: 'pi_test' } });
  const stripe = { confirmCardPayment: jest.fn().mockRejectedValue(new Error('Network lost')) };
  await expect(checkout({ ...args, stripe })).rejects.toMatchObject({ paidPaymentId: 'pi_test' });
  expect(JSON.parse(sessionStorage.getItem('marketplaceCheckoutRecovery')).paymentId).toBe('pi_test');
  await expect(checkout({ ...args, stripe })).rejects.toThrow('previous payment');
});

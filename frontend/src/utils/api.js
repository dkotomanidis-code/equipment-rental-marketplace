export const API_BASE = (process.env.REACT_APP_API_URL || '/api').replace(/\/+$/, '');

export function authConfig() {
  const token = localStorage.getItem('token');
  return token ? { headers: { Authorization: 'Bearer ' + token } } : {};
}

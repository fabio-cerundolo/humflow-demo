import { useState } from 'react';
import axios from 'axios';
const API = "http://localhost:8000";
export const useAuth = () => {
  const [token, setToken] = useState(localStorage.getItem('flux_token'));
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState(false);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoginError(false);
    try {
      const params = new URLSearchParams(); params.append('username', loginData.username); params.append('password', loginData.password);
      const res = await axios.post(`${API}/token`, params);
      localStorage.setItem('flux_token', res.data.access_token); setToken(res.data.access_token);
    } catch { setLoginError(true); }
  };
  const handleLogout = () => { localStorage.removeItem('flux_token'); setToken(null); };
  return { token, loginData, setLoginData, loginError, handleLogin, handleLogout };
};
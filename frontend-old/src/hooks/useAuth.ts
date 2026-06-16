// src/hooks/useAuth.ts
import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      // 🔥 IMPORTANTE: Invia come JSON con i campi esatti "username" e "password"
      const response = await axios.post(`${API_URL}/token`, {
        username: loginData.username,
        password: loginData.password
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const newToken = response.data.access_token;
      localStorage.setItem('token', newToken);
      setToken(newToken);
    } catch (error: any) {
      console.error('Errore login:', error.response?.data || error.message);
      setLoginError('Credenziali non valide. Riprova.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return { token, loginData, setLoginData, loginError, handleLogin, handleLogout };
};
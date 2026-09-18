import { API_BASE } from '../config/api';
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('token') || null;
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return (stored && stored !== 'undefined' && stored !== 'null') ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [programData, setProgramData] = useState(null);
  const [loadingProgram, setLoadingProgram] = useState(true);
  
  // We don't use useNavigate here directly if AuthProvider wraps Router,
  // but let's assume this is inside Router. Wait, App.jsx handles Router.
  // Actually, we'll just handle login/logout and let components do navigation.

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      if (user?.role === 'CLIENT') {
        fetchProgram();
      } else {
        setLoadingProgram(false);
      }
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setProgramData(null);
      setUser(null);
      setLoadingProgram(false);
    }
  }, [token, user]);

  const fetchProgram = async () => {
    setLoadingProgram(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/programs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        // Assuming getUserPrograms returns { programs: [...] }
        if (data.programs && data.programs.length > 0) {
          setProgramData(data.programs[0].program_data); // Get latest program
        } else {
          setProgramData(null);
        }
      } else {
        if (res.status === 401) {
          logout();
        }
      }
    } catch (err) {
      console.error("Error fetching program", err);
    } finally {
      setLoadingProgram(false);
    }
  };

  const login = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
  };

  const clientLogin = async (clientCode, phoneNumber) => {
    const res = await fetch(`${API_BASE}/api/v1/auth/login-fast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_code: clientCode, phone_number: phoneNumber })
    });
    const data = await res.json();
    if (res.ok) {
      login(data.token, data.user);
      return data;
    } else {
      throw { response: { data } };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, clientLogin, logout, programData, fetchProgram, loadingProgram }}>
      {children}
    </AuthContext.Provider>
  );
};

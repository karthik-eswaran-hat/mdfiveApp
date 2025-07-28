import axios from 'axios';

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default service;

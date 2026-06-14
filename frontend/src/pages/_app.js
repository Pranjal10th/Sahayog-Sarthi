import "@/styles/globals.css";
import axios from 'axios';

if (typeof window !== 'undefined') {
  // 1. Request Interceptor: Automatically inject local storage token
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // 2. Response Interceptor: Catch 401 token expiry status code and redirect
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        const token = localStorage.getItem('token');
        if (token) {
          console.warn("🔒 Session expired or unauthorized (401). Clearing auth storage...");
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('role');
          window.location.href = '/auth/login?expired=true';
        }
      }
      return Promise.reject(error);
    }
  );
}

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

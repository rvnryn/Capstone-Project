import axios from 'axios';

// Create an axios instance
const axiosInstance = axios.create({
     baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
     timeout: 0, // Set a timeout of 10 seconds
     headers: {
          'Content-Type': 'application/json',
          // You can add any other headers you need here
     },
});

axiosInstance.interceptors.request.use((config) => {
     const token = localStorage.getItem('token');
     if (token) {
          config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
});

// axiosInstance.interceptors.response.use(
//      response => response,
//      error => {
//           if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
//                alert('Request timed out. Please try again.');
//           }
//           return Promise.reject(error);
//      }
// );
export default axiosInstance;

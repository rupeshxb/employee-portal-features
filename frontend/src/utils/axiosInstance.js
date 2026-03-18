import axios from 'axios';

// Fallback to localhost if the environment variable isn't set
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create the instance
const axiosInstance = axios.create({
    baseURL: API_BASE_URL, // <-- Fixed: matched the variable name above
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        // Grab the token from localStorage right before the request is sent
        const token = localStorage.getItem('token'); 
        
        if (token) {
            // Note: Using 'token' to match your Django setup from ProjectsOverview
            config.headers['Authorization'] = `token ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosInstance;
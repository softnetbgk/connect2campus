import axios from 'axios';

// Hardcoded fallback for production to bypass Netlify Env Var permissions issue
const PROD_URL = 'https://school-backend-kepp.onrender.com/api';
// Force PROD_URL in production, ignoring any potentially broken Env Vars in Netlify UI
const baseURL = import.meta.env.MODE === 'production' ? PROD_URL : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

// Debug: Log the API URL being used
console.log('🔗 API Base URL (v2):', baseURL, '| Mode:', import.meta.env.MODE);

const api = axios.create({
    baseURL: baseURL,
    timeout: 15000, // 15 seconds timeout
});

// Add a request interceptor to add the JWT token to headers
api.interceptors.request.use(
    (config) => {
        // Updated to use localStorage to adhere to new Mobile Auth standards
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for global error handling and retries
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;

        // If config does not exist or the retry option is set to false, reject
        if (!config || !config.retry) {
            return Promise.reject(error);
        }

        // Set the variable for keeping track of the retry count
        config.__retryCount = config.__retryCount || 0;

        // Check if we've maxed out the total number of retries
        if (config.__retryCount >= config.retry) {
            return Promise.reject(error);
        }

        // Increase the retry count
        config.__retryCount += 1;

        // Create new promise to handle exponential backoff
        const backoff = new Promise(function (resolve) {
            setTimeout(function () {
                resolve();
            }, config.retryDelay || 1000);
        });

        // Return the promise in which recalls axios to retry the request
        return backoff.then(function () {
            return api(config);
        });
    }
);

// Set default retry config
api.defaults.retry = 3;
api.defaults.retryDelay = 1000;

export default api;

import axios from 'axios';

// Hardcoded fallback for production to bypass Netlify Env Var permissions issue
const PROD_URL = 'https://school-backend-kepp.onrender.com/api';
// Dynamic URL that works on localhost AND local network IPs (for mobile testing)
const DEV_URL = `http://${window.location.hostname}:5000/api`;

// Use Localhost in Development, Production URL otherwise
const baseURL = import.meta.env.MODE === 'development' ? DEV_URL : PROD_URL;

// Debug: Log the API URL being used
console.log('🔗 API Base URL (v2):', baseURL, '| Mode:', import.meta.env.MODE);

const api = axios.create({
    baseURL: baseURL,
    timeout: 15000, // 15 seconds timeout
});

// Loading state management (will be set by LoadingProvider)
let loadingCallbacks = {
    start: () => { },
    stop: () => { }
};

// Export function to set loading callbacks
export const setLoadingCallbacks = (start, stop) => {
    loadingCallbacks.start = start;
    loadingCallbacks.stop = stop;
};

// Add a request interceptor to add the JWT token to headers and start loading
api.interceptors.request.use(
    (config) => {
        // Start loading
        loadingCallbacks.start();

        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        // Stop loading on request error
        loadingCallbacks.stop();
        return Promise.reject(error);
    }
);

// Response interceptor for global error handling and retries
api.interceptors.response.use(
    (response) => {
        // Stop loading on successful response
        loadingCallbacks.stop();
        return response;
    },
    async (error) => {
        // Stop loading on error (will restart if retrying)
        loadingCallbacks.stop();

        // Handle Session Expiry or Service Disabled
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Ignore for Login requests - let the component handle the error
            if (error.config && error.config.url && (error.config.url.includes('/login') || error.config.url.includes('/admin/login'))) {
                return Promise.reject(error);
            }

            const msg = error.response.data?.message;

            // Specific check for Service Disabled (403) or Session Invalid (401)
            if (msg === 'School Service Disabled. Contact Super Admin.' || error.response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Force reload to login if not already there
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login?error=' + encodeURIComponent(msg || 'Session Expired');
                }
                return Promise.reject(error);
            }
        }

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

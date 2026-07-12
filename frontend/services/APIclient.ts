import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
        baseURL: API_URL,
        headers: {
            "Content-Type": "application/json"
        },
        timeout: 30000
    }
);

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
)

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("Token is expired or invalid. Please login again.");
            localStorage.removeItem("token");
            if (typeof window !== "undefined" && window.location.pathname !== "/login") 
                window.location.href = "/login";
        } 
        return Promise.reject(error);
    }
)

export default api;
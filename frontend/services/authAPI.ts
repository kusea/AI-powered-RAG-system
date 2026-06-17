import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface TokenResponse {
    access_token: string,
    token_type: string
};

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json"
    }
});

export const authApi = {
    register: (data: Record<string, string>): Promise<TokenResponse> => api.post("/auth/register", data).then(res => res.data),
    login: (data: Record<string, string>): Promise<TokenResponse> => api.post("/auth/login", data).then(res => res.data),
    loginWithGoogle: (token: string): Promise<TokenResponse> => api.post("/auth/google-login", {token}).then(res => res.data)
}

export const getAuthToken = () => {
    return (typeof window !== "undefined") ? localStorage.getItem("token") : null;
}
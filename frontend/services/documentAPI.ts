import axios from "axios";
import api from "./APIclient";

export const documentAPI = {
    fetchDocumentAPI: async () => {
        let token = localStorage.getItem("token"); // get token from local storage after user login
        if (token) token = token.replace(/^"(.*)"$/, '$1');

        const res = await api.get(
            "/documents", 
            {
                headers: {"Authorization": `Bearer ${token}`}
            });
        return res.data;
    },
    uploadDocumentAPI: async ({file, onProgress}: {file: File, onProgress: (progress: number) => void}) => {
        const formData = new FormData();
        formData.append("file", file);

        const token = localStorage.getItem("token"); // get token from local storage after user login
        try{
            const res = await api.post("/documents/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${token}`
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded*100)/progressEvent.total);
                        onProgress(percentCompleted);
                    }
                }
            })
            return res.data;
        } catch(err) {
            console.error("Error uploading file:", err);
        }
    },
    uploadFromGoogleDrive: async (fileId: string, accessToken: string, mimeType: string) => {
        const res = await api.post("/documents/google-drive", {file_id: fileId, access_token: accessToken, mime_type: mimeType});
        return res.data;
    },
}
// Solve the case if user's token is expired
axios.interceptors.response.use((response) => response, (error) => {
    if (error.response && error.response.status === 401) {
        console.warn("Token is expired or invalid. Please login again.");
        localStorage.removeItem("token");
        if (typeof window !== "undefined" && window.location.pathname !== "/login") 
            window.location.href = "/login";
    } 
    return Promise.reject(error);
})
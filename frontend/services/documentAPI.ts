import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
    baseURL: API_URL, 
    headers: {"Content-Type": "application/json"}
});

export const fetchDocumentAPI = async () => {
    let token = localStorage.getItem("token"); // get token from local storage after user login
    if (token) token = token.replace(/^"(.*)"$/, '$1');

    const res = await api.get(
        "/documents", 
        {
            headers: {"Authorization": `Bearer ${token}`}
        });
    return res.data;
}

export const uploadDocumentAPI = async ({file, onProgress}: {file: File, onProgress: (progress: number) => void}) => {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token"); // get token from local storage after user login
    
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
}
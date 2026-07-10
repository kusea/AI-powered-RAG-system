import { useEffect, useState } from 'react';


export const useGooglePicker = () => {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Nếu gapi đã được nạp và khởi tạo từ trước, bỏ qua
        if (typeof window !== 'undefined' && window.gapi && window.gapi.picker) {
            const timer = setTimeout(() => {
                setIsReady(true);
            }, 0);
            return () => clearTimeout(timer);
        }

        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.onload = () => {
            if (window.gapi)
                window.gapi.load('picker', () => {
                    setIsReady(true);
                });
        };
        document.body.appendChild(script);

        return () => {
        // Clean up script nếu component unmount (Tùy chọn)
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    return isReady;
};
import React, { useMemo } from "react";
import { ImageView } from "./ImageVíew";
import { PdfView } from "./PdfView";
import { TextView } from "./TextView";
import { ExcelViewer } from "./ExcelViewer";

interface DocumentViewerProps {
    fileUrl: string;    // Đường dẫn để tải/đọc file từ backend storage
    fileName: string;   // Tên file (để lấy extension)
    textContent: string; // Nội dung chữ thô phục vụ backup hoặc hiển thị văn bản
}

export const DocumentView: React.FC<DocumentViewerProps> = ({fileUrl, fileName, textContent,}) => {
    const extension = useMemo(() => fileName.split(".").pop()?.toLowerCase(), [fileName]);
    const formatImageUrl = (url: string) => {
            if (!url) return "/";
            let cleanURL = url.replace(/\\/g, "/");
    
            if (cleanURL.startsWith("http://") || cleanURL.startsWith("https://")) return cleanURL;
            const BACKEND_URL = "http://localhost:8000";
            cleanURL = `${BACKEND_URL}/${cleanURL}`;
            return cleanURL;
        };
    const formattedUrl = formatImageUrl(fileUrl);
    switch (extension) {
        case "xlsx":
        case "xls":
        case "csv":
        return <ExcelViewer fileUrl={formattedUrl} textContent={textContent} />;
        
        case "png":
        case "jpg":
        case "jpeg":
        case "gif":
        case "bmp":
        return <ImageView fileUrl={formattedUrl} altText={fileName} />;
        
        case "pdf":
        return <PdfView fileUrl={formattedUrl} />;
        
        default:
        // Các file văn bản thô như .txt, .md hoặc fall-back text từ .docx
        return <TextView content={textContent} extension={extension} />;
    }
};
import React, { useMemo } from "react";
import { ImageView } from "./ImageVíew";
import { PdfView } from "./PdfView";
import { TextView } from "./TextView";
import { ExcelViewer } from "./ExcelViewer";
import { DocxViewer } from "./DocxView";

interface DocumentViewerProps {
    fileUrl: string;    // Đường dẫn để tải/đọc file từ backend storage
    fileName: string;   // Tên file (để lấy extension)
    textContent: string; // Nội dung chữ thô phục vụ backup hoặc hiển thị văn bản
}

export const DocumentView: React.FC<DocumentViewerProps> = ({fileUrl, fileName, textContent}) => {
    const extension = useMemo(() => fileUrl.split(".").pop()?.toLowerCase(), [fileUrl]);
    console.log(`Extension: ${extension}`);
    const formatImageUrl = (url: string) => {
            if (!url) return "/";
            let cleanURL = url.replace(/\\/g, "/");
    
            if (cleanURL.startsWith("http://") || cleanURL.startsWith("https://")) return cleanURL;
            const BACKEND_URL = "http://localhost:8000";
            cleanURL = `${BACKEND_URL}/${cleanURL}`;
            return cleanURL;
        };
    const formattedUrl = formatImageUrl(fileUrl);
    const table_ext = ["xlsx", "csv", "xls", ".xlsx", ".csv", ".xls"]
    const docx_ext = ["docx", "doc", ".docx", ".doc"]
    const image_ext = ["jpg", "jpeg", "png", ".jpg", ".jpeg", ".png"]

    if (!extension) return <TextView content={textContent} extension={extension}/>;
    if (table_ext.includes(extension)) return <ExcelViewer fileUrl={formattedUrl} textContent={textContent}/>;
    else if (docx_ext.includes(extension)) return <DocxViewer textContent={textContent} fileUrl={formattedUrl}/>;
    else if (image_ext.includes(extension)) return <ImageView fileUrl={formattedUrl} altText={fileName}/>;
    else if (extension === "pdf") return <PdfView fileUrl={formattedUrl}/>;
    else return <TextView content={textContent} extension={extension}/>;
};
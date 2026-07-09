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

    switch (extension) {
        case "xlsx":
        case "xls":
        case "csv":
        return <ExcelViewer fileUrl={fileUrl} textContent={textContent} />;
        
        case "png":
        case "jpg":
        case "jpeg":
        case "gif":
        case "bmp":
        return <ImageView fileUrl={fileUrl} altText={fileName} />;
        
        case "pdf":
        return <PdfView fileUrl={fileUrl} />;
        
        default:
        // Các file văn bản thô như .txt, .md hoặc fall-back text từ .docx
        return <TextView content={textContent} extension={extension} />;
    }
};
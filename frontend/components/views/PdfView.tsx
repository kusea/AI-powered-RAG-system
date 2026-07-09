import React from "react";

export const PdfView: React.FC<{fileUrl: string, }> = ({fileUrl}) => {
    return (
        <div className = "w-full h-175 border rounded-xl overflow-hidden shadow-inner bg-muted/20">
            <object
                data = {`${fileUrl}#toolbar=1&navpanes=1`}
                type = "application/pdf"
                className = "w-full h-full"    
            >
                <iframe title = "PDF" src = {fileUrl} className = "w-full h-full border-none">
                    <p className = "p-4 text-xs text-destructive">Not supported directly PDF.</p>
                </iframe>
            </object>
        </div>
    )
};
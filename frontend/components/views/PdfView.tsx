import React, { useState } from "react";
import { Eye, RefreshCw, ExternalLink, FileDown } from "lucide-react";

export const PdfView: React.FC<{fileUrl: string, }> = ({fileUrl}) => {
    const [reloadKey, setReloadKey ] = useState<number>(0);

    const handleReload = () => {
        setReloadKey(prev => prev + 1);
    }
    return (
        <div className="w-full flex flex-col border rounded-xl overflow-hidden shadow-sm bg-background">
            {/* Thanh công cụ bổ sung cho Trình xem PDF hình ảnh/bảng biểu */}
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border-b">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                    <Eye className="h-4 w-4 text-red-500" />
                    <span>PDF Interactive Viewer</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <button 
                        onClick={handleReload}
                        className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                        title="Reload document"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <a 
                        href={fileUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-[11px]"
                        title="Open in new tab"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <a 
                        href={fileUrl} 
                        download
                        className="p-1.5 bg-red-600 hover:bg-red-700 rounded-md text-white transition-colors flex items-center gap-1 text-[11px] px-2.5 font-medium shadow-sm"
                    >
                        <FileDown className="h-3.5 w-3.5" />
                        <span>Download</span>
                    </a>
                </div>
            </div>

            {(!fileUrl) ? (
                <div className="p-4 text-xs text-destructive bg-destructive/10 border border-dashed rounded-xl">
                    <p className="text-destructive">This document is empty or the content is not available.</p>
                </div>
            ): (
                <div className="w-full h-200 border rounded-xl overflow-hidden shadow-sm bg-muted/20 relative">
                    <embed
                        src={`${fileUrl}#toolbar=1&navpanes=1&view=FitH`}
                        type="application/pdf"
                        className="w-full h-full border-none"
                    />
                </div>
            )}
        </div>
    )
};
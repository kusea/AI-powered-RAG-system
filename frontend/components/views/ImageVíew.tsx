import React, { useState } from "react";
import { Maximize2, X } from "lucide-react"; 
import Image from "next/image";

const PUBLIC_URL = "http://localhost:8000";

export const ImageView: React.FC<{fileUrl: string, altText: string}> = ({fileUrl, altText}) => {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const formatImageUrl = (url: string) => {
        if (!url) return "/";

        let cleanURL = url.replace(/\\/g, "/");

        if (!cleanURL.startsWith("/")) cleanURL = "/" + cleanURL;
        if (!cleanURL.startsWith("http") || !cleanURL.startsWith("https")) cleanURL = PUBLIC_URL + cleanURL;
        return cleanURL;
    };
    const formattedUrl = formatImageUrl(fileUrl);
        console.log(`Image URL: ${formattedUrl}`);

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-muted/10 border border-dashed rounded-xl relative group max-w-4xl w-full h-100 mx-auto">
            <Image
                src={formattedUrl}
                alt={altText}
                fill
                className="object-contain transition-transform duration-200 hover:scale-[1.01]"
                sizes = "(max-w-4xl) 100vh, 650px"
                unoptimized
            />

            <button
                onClick={() => setIsPreviewOpen(true)}
                className="absolute top-4 right-4 p-2 bg-background/80 hover:bg-background border rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Maximize2 className="h-4 w-4 text-muted-foreground" />
            </button>

            

            {isPreviewOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" 
                    onClick={() => setIsPreviewOpen(false)}
                >
                    <button
                        type="button"
                        onClick={() => setIsPreviewOpen(false)}
                        className="absolute top-4 right-4 text-white text-xs font-medium bg-white/10 px-3 py-1.5 rounded-md hover:bg-white/20 flex items-center gap-1"
                    >
                        <X className="h-4 w-4" /> Close
                    </button>
                    <div className = "relative w-full h-full max-w-5xl max-h-[85vh]">
                        <Image
                            src = {formattedUrl}
                            alt = {altText}
                            fill
                            className = "object-contain animate-in zoom-in-95 duration-150"
                            unoptimized
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
import React, { useState, useEffect, useRef } from "react";
import { FileText, AlertCircle } from "lucide-react";

interface DocxViewerProps {
    textContent?: string;
    fileUrl?: string; 
}

export const DocxViewer: React.FC<DocxViewerProps> = ({ textContent, fileUrl }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true; 
        const renderFile = async () => {
            if (!fileUrl) {
                setLoading(false);
                return;
            }
        
            try {
                setLoading(true);
                setError(null);
                
                const docx = await import("docx-preview");
                
                const response = await fetch(fileUrl);
                if (!response.ok) throw new Error("Can not fetch DOCX document.");
                console.log("Response status:", response.status);
                
                const arrayBuffer = await response.arrayBuffer();
                
                setTimeout(async () => {
                    if (isMounted && containerRef.current) {
                        containerRef.current.innerHTML = ""; // Clear previous content
                        console.log("Rendering DOCX...");
                        await docx.renderAsync(arrayBuffer, containerRef.current, undefined, {
                            className: "docx-render-content",
                            inWrapper: false,
                            ignoreWidth: false,
                            ignoreHeight: false,
                        });
                    } 
                }, 100);
                
            } catch (err) {
                console.error("Error rendering DOCX:", err);
                setError("Error rendering DOCX. Trying to render as plain text.");
            } finally {
                setLoading(false);
            }
        };

        renderFile();

        return () => {
            isMounted = false;
        }
    }, [fileUrl]);

    if (loading) {
        return (
            <div className="p-8 text-center text-xs text-muted-foreground bg-muted/10 border border-dashed rounded-xl">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (error || !fileUrl) {
        const paragraphs = textContent ? textContent.split("\n").map((p) => p.trim()) : [];
        if (paragraphs.length === 0) {
            return (
                <div className="p-8 text-center text-xs text-muted-foreground bg-muted/10 border border-dashed rounded-xl">
                    <p>This document is empty or the content is not available.</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col bg-muted/20 border rounded-xl overflow-hidden shadow-sm w-full max-w-4xl mx-auto">
                {error && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-[11px] text-amber-600">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>{error}</span>
                    </div>
                )}
                <div className="flex items-center justify-between px-4 py-2.5 bg-blue-600/10 border-b text-xs font-medium text-blue-600">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Docx Reader</span>
                    </div>
                </div>
                <div className="p-6 bg-background text-foreground text-xs text-justify space-y-3 max-h-150 overflow-auto">
                    {paragraphs.map((para, i) => para ? <p key={i}>{para}</p> : <div key={i} className="h-2" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-muted/20 border rounded-xl overflow-hidden shadow-sm w-full max-w-4xl mx-auto">
            <div className="flex items-center justify-between px-4 py-2.5 bg-blue-600/10 border-b text-xs font-medium text-blue-600">
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Docx Advanced Viewer</span>
                </div>
            </div>

            <div className="flex-1 overflow-auto max-h-170 p-4 md:p-8 bg-zinc-100 dark:bg-zinc-900/50 flex justify-center dynamic-docx-container">
                <div 
                    ref={containerRef} 
                    className="w-full bg-background text-foreground shadow-md border rounded-md p-6 md:p-12 font-sans overflow-x-auto selection:bg-blue-500/20"
                />
            </div>
        </div>
    );
};
import React from "react";
import { FileText } from "lucide-react";

interface DocxViewerProps {
    textContent: string;
}

export const DocxViewer: React.FC<DocxViewerProps> = ({ textContent }) => {
    if (!textContent || textContent.trim() === "") {
        return (
        <div className="p-8 text-center text-xs text-muted-foreground bg-muted/10 border border-dashed rounded-xl">
            <p className="text-muted-foreground">This document is empty or the content is not available.</p>
        </div>
        );
    }

    const paragraphs = textContent
        .split("\n")
        .map((p) => p.trim());

    return (
        <div className="flex flex-col bg-muted/20 border rounded-xl overflow-hidden shadow-sm w-full max-w-4xl mx-auto">
            <div className="flex items-center justify-between px-4 py-2.5 bg-blue-600/10 border-b text-xs font-medium text-blue-600">
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Docx Reader</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                    {paragraphs.filter(p => p.length > 0).length} {paragraphs.filter(p => p.length > 0).length === 1 ? "paragraph" : "paragraphs"} • {textContent.length.toLocaleString()} {textContent.length === 1 ? "character" : "characters"}
                </div>
            </div>

            <div className="flex-1 overflow-auto max-h-170 p-4 md:p-8 bg-zinc-100 dark:bg-zinc-900/50 flex justify-center">
                <div className="w-full max-w-200 min-h-125 bg-background text-foreground shadow-md border rounded-md p-6 md:p-12 font-sans selection:bg-blue-500/20">
                    <div className="prose prose-sm max-w-none dark:prose-invert space-y-4">
                        {paragraphs.map((para, index) => {
                            if (para.length === 0) {
                                return <div key={index} className="h-2" />;
                            }

                            const isPotentialHeading = para.length < 100 && (
                                para.startsWith("Chapter") || 
                                para.startsWith("Section") || 
                                /^[0-9]\./.test(para) || 
                                para === para.toUpperCase() && para.length > 5 && !/[a-z]/.test(para)
                            );

                            if (isPotentialHeading) {
                                return (
                                <h3 key={index} className="text-base font-bold text-foreground mt-4 mb-2 border-b border-muted pb-1 leading-tight">
                                    {para}
                                </h3>
                                );
                            }

                            // Mặc định render đoạn văn chuẩn Microsoft Word (Căn đều 2 bên - justify)
                            return (
                                <p key={index} className="text-xs text-muted-foreground leading-relaxed text-justify indent-0 tracking-wide">
                                {para}
                                </p>
                            );
                            })
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};
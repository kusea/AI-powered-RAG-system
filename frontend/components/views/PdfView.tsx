import React from "react";

export const PdfView: React.FC<{fileUrl: string, }> = ({fileUrl}) => {
    return (
        <div>
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
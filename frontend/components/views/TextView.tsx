import React from "react";

export const TextView: React.FC<{content: string, extension: string | undefined}> = ({content, extension}) => {
    return (
        <div className="border rounded-xl bg-muted/30 shadow-inner overflow-hidden">
            <div className="bg-muted px-4 py-2 border-b text-xs text-muted-foreground flex justify-between items-center">
                <span>RAW TEXT VIEW ({extension?.toUpperCase() || "TXT"})</span>
                <span>{content ? `${content.length} characters` : "Empty"}</span>
            </div>
            
            {/* Content area */}
            <div className="p-6 max-h-100 overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap bg-card">
                {content ? (
                    content
                ) : (
                    <p className="text-muted-foreground italic text-center py-8">
                        This document is empty or the content is not available.
                    </p>
                )}
            </div>
        </div>
    );
};

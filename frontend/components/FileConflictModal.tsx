import React from "react";

interface FileConflictModalProps {
    isOpen: boolean;
    fileName: string;
    onResolve: (strategy: "overwrite" | "rename" | "skip") => void;
    onCancel: () => void;
}

export const FileConflictModal: React.FC<FileConflictModalProps> = ({isOpen, fileName, onResolve, onCancel,}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg border border-border dark:bg-zinc-900">
            
            {/* Header */}
            <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground dark:text-zinc-50">
                Document has been uploaded before
            </h3>
            <p className="mt-2 text-sm text-muted-foreground dark:text-zinc-400 break-all">
                System detected that a document named <span className="font-semibold text-zinc-800 dark:text-zinc-200">&quot;{fileName}&quot;</span> has been uploaded before. What do you want to resolve this conflict?
            </p>
            </div>

            {/* Các phương án lựa chọn */}
            <div className="space-y-2.5 my-5">
            <button
                onClick={() => onResolve("overwrite")}
                className="w-full text-left p-3 rounded-md border border-border hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex flex-col"
            >
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">💥 Overwrite</span>
                <span className="text-xs text-zinc-500">Replace the old document with the new one. Old chunks will be deleted and update for the new one.</span>
            </button>

            <button
                onClick={() => onResolve("rename")}
                className="w-full text-left p-3 rounded-md border border-border hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex flex-col"
            >
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">📝 Keep both files (Auto Rename)</span>
                <span className="text-xs text-zinc-500">Auto rename the file with an index number after the original file name (For example: &quot;{fileName.split('.')[0]} (1).{fileName.split('.').pop()}&quot;)</span>
            </button>

            <button
                onClick={() => onResolve("skip")}
                className="w-full text-left p-3 rounded-md border border-border hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex flex-col"
            >
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">⏭️ Skip</span>
                <span className="text-xs text-zinc-500">Cancel uploading this file</span>
            </button>
            </div>

            {/* Footer */}
            <div className="flex justify-end mt-4 border-t border-border pt-3">
            <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
                Cancel
            </button>
            </div>

        </div>
        </div>
    );
};
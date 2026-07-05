// frontend/pages/documents/all.tsx
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Share2, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import api from "@/services/APIclient";

interface UnifiedDocument {
    id: number;
    title: string;
    file_size: number | null;
    created_at: string;
    is_shared: boolean; 
    owner_email?: string;
}

export default function AllDocuments() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [sharingDocs, setSharingDocs] = useState<number[]>([]);
    const [shareEmail, setShareEmail] = useState("");
    const [sharePermission, setSharePermission] = useState("read");
    const [isSubmittingShare, setIsSubmittingShare] = useState(false);

    // Gọi endpoint kết hợp ở backend lấy trọn bộ dữ liệu chưa xóa
    const { data: documents = [], isLoading, isError } = useQuery<UnifiedDocument[]>({
        queryKey: ["allUnifiedDocuments"],
        queryFn: async () => {
        const response = await api.get("/documents/all-unified");
        return response.data;
        }
    });

    const handleToggleSelect = (id: number) => {
        setSelectedIds(prevIds => (prevIds.includes(id) ? prevIds.filter(prevId => prevId !== id): ([...prevIds, id])));
    };

    const handleBulkAI = () => {
        if (selectedIds.length === 0) return;
        router.push(`/chat?document_ids=${selectedIds.join(",")}&mode=multi`);
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        const confirmDelete = confirm(`Are you sure you want to delete ${selectedIds.length === 1 ? "this document" : "these documents"}?`);
        if (!confirmDelete) return;
        api.delete(`/documents/delete-document`, {data: {document_ids: selectedIds}}).then(() => {
            alert(`Successfully deleted ${selectedIds.length === 1 ? "this document" : "these documents"}`);
            queryClient.invalidateQueries({queryKey: ["allUnifiedDocuments"]});
            setSelectedIds([]);
        }).catch(err => alert(`Failed to delete documents: ${err.message}`));
    }

    const handleBulkShareOpen = () => {
        if (selectedIds.length === 0) return;
        setSharingDocs(selectedIds);
        setShareEmail("");
        setSharePermission("read");
        setIsShareModalOpen(true);
    };

    const handleConfirmShare: React.ComponentProps<"form">["onSubmit"] = async (e) => {
        e.preventDefault();
        if(sharingDocs.length === 0 || !shareEmail.trim()) return;
        setIsSubmittingShare(true);
        const sharePromises = sharingDocs.map(id => api.post("/documents/share", {document_id: id, shared_to_email: shareEmail, permission: sharePermission}));
        await Promise.all(sharePromises)
            .then(() => {
                alert(`Successfully shared ${sharingDocs.length === 1 ? "this document" : "these documents"} with ${shareEmail}.`);
                setIsShareModalOpen(false);
                setSelectedIds([]);
            })
            .catch(err => alert(`Failed to share document: ${err.message}`))
            .finally(() => setIsSubmittingShare(false));
    }

    const formatFileSize = (bytes: number | null, decimals = 2) => {
        const kb = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
        
        if (!bytes) return "0 Bytes"; 
        const i = Math.floor(Math.log(bytes) / Math.log(kb));

        return parseFloat((bytes / Math.pow(kb, i)).toFixed(dm)) + "" + sizes[i];
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <main className="flex-1 p-8 max-w-5xl w-full mx-auto">
                <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">All documents</h1>
                        <p className="text-sm text-muted-foreground">
                            Includes all documents, both shared and your own.
                        </p>
                    </div>

                    {documents.length > 0 && (
                        <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedIds(selectedIds.length === documents.length ? [] : documents.map(d => d.id))}
                        >
                        {selectedIds.length === documents.length ? "Deselect all" : "Select all "}
                        </Button>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : isError ? (
                    <div className="text-center py-12 border rounded-xl bg-destructive/5 text-destructive">
                        Can not load documents. Please try again.
                    </div>
                ) : documents.length === 0 ? (
                    <p className="text-center py-12 border border-dashed rounded-xl text-muted-foreground">
                        Empty. You don&apos;t have any document yet.
                    </p>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documents.map((doc) => (
                    <div 
                        key={`${doc.is_shared ? 'share' : 'root'}-${doc.id}`}
                        className={`flex relative items-center justify-between border p-4 rounded-xl shadow-xs transition-all ${
                        doc.is_shared 
                            ? "border-blue-200 bg-blue-50/30 dark:bg-blue-950/10"
                            : "border-border bg-card"
                        }`}
                    >
                        <div className="flex items-center space-x-4 min-w-0">
                            <div className={`p-2.5 rounded-lg ${doc.is_shared ? "bg-blue-500/10 text-blue-500" : "bg-primary/10 text-primary"}`}>
                                {doc.is_shared ? <Share2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm truncate max-w-xs md:max-w-md">{doc.title}</p>
                                    {doc.is_shared && (
                                        <span className="text-[10px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 shadow-xs">
                                        Shared
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {doc.is_shared ? `Sender: ${doc.owner_email}` : "Me"} • {new Date(doc.created_at).toLocaleDateString("vi-VN")}
                                </p>
                            </div>
                        </div>

                        <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => router.push(`/chat?document_id=${doc.id}&is_shared=${doc.is_shared}`)}
                            className={`h-8 w-8 p-0 ${doc.is_shared ? "hover:bg-blue-500/10 text-blue-500" : "hover:bg-primary/10 text-primary"}`}
                        >
                            <MessageSquare className="h-4 w-4" /> Ask AI
                        </Button>
                    </div>
                    ))}
                </div>
                )}
            </main>
        </div>
    );
}
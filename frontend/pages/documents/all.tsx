// frontend/pages/documents/all.tsx
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Share2, Loader2, CheckCircle, Trash2, Bot} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import api from "@/services/APIclient";
import { DocumentCard, DocumentItem } from "@/components/DocumentCard";
import { ShareModal } from "@/components/ShareModal";

export default function AllDocuments() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [sharingDocs, setSharingDocs] = useState<DocumentItem[]>([]);

    // Gọi endpoint kết hợp ở backend lấy trọn bộ dữ liệu chưa xóa
    const { data: documents = [], isLoading, isError } = useQuery<DocumentItem[]>({
        queryKey: ["allDocuments"],
        queryFn: async () => {
            const response = await api.get("/documents/all");
            return response.data;
        },
        staleTime: 30000
    });

    const handleToggleSelect = (id: number) => {
        setSelectedIds(prevIds => (prevIds.includes(id) ? prevIds.filter(prevId => prevId !== id): ([...prevIds, id])));
    };

    const handleBulkAskAI = () => {
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

    const handleShareModalOpen = (document: DocumentItem | null) => {
        const selectedDocs = (!document) ? documents.filter(doc => selectedIds.includes(doc.id)): [document];
        setSharingDocs(selectedDocs);
        setIsShareModalOpen(true);
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

                {selectedIds.length > 0 && (
                    <div className="mb-6 flex flex-col sm:flex-row items-center justify-between p-4 bg-primary/10
                                    border border-primary/20 rounded-xl gap-4 w-full">
                        <div className = "flex items-center gap-2 text-sm font-medium">
                            <CheckCircle className = "h-5 w-5 text-primary" />
                            <span>Selecting <strong className="text-primary text-base">{selectedIds.length}</strong> documents</span>
                        </div>

                        <div className = "flex flex-wrap items-center gap-2">
                            <Button onClick={handleBulkAskAI} variant="outline" className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10 gap-2 h-9 text-xs">
                                <Bot className="h-4 w-4" /> Ask AI about {selectedIds.length === 1 ? "this document" : "these documents"}
                            </Button>
                            <Button onClick={() => handleShareModalOpen(null)} variant="outline" className="text-blue-500 border-blue-500/30 hover:bg-blue-500/10 gap-2 h-9 text-xs">
                                <Share2 className="h-4 w-4" /> Share {selectedIds.length === 1 ? "this document" : "these documents"}
                            </Button>
                            <Button onClick={handleBulkDelete} variant="destructive" className="gap-2 h-9 text-xs">
                                <Trash2 className="h-4 w-4" /> Delete {selectedIds.length === 1 ? "this document" : "these documents"}
                            </Button>
                        </div>
                    </div>
                )}

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
                    {documents.map((doc) => {
                        const isChecked = selectedIds.includes(doc.id);
                        return (
                            <div 
                                key={`${doc.is_shared ? 'share' : 'root'}-${doc.id}`}
                                className={`${isChecked ? "border-primary bg-primary/5" 
                                            : doc.is_shared ? "border-blue-200 bg-blue-50/20" 
                                            : "bg-card"
                                            }`}
                            >
                                <DocumentCard 
                                    doc={doc} 
                                    isSelected={isChecked} 
                                    onSelect={handleToggleSelect} 
                                    onShareModalOpen={handleShareModalOpen} 
                                />
                            </div>
                    )})}
                </div>
                )}
                {isShareModalOpen && sharingDocs.length > 0 && 
                    <ShareModal 
                        isShareModalOpen={setIsShareModalOpen} 
                        sharingDocs={sharingDocs} 
                        onSelectedIds={setSelectedIds}
                    />
                }
            </main>
        </div>
    );
}
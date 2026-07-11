import React, { useState} from "react";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft, RefreshCw, Loader2, Trash} from "lucide-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/router";
import api from "@/services/APIclient";
import { documentAPI } from "@/services/documentAPI";

interface TrashDocumentItem {
    id: number;
    title: string;
    file_size: number | null;
    deleted_at: string;
}

export default function DocumentTrash() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const {data: trashDocs = [], isLoading, isError} = useQuery<TrashDocumentItem[]>({
        queryKey: ["trashDocuments"],
        queryFn: async () => {
            const res = await api.get("/documents/trash");
            return res.data;
        },
        staleTime: Infinity
    })

    const handleToggleSelect = ((id: number) => {
        setSelectedIds(prevIds => (prevIds.includes(id) ? prevIds.filter(prevId => prevId !== id): ([...prevIds, id])));
    })

    const restoreMutation = useMutation({
        mutationFn: async (idsRestore: number[]) => await api.put(`/documents/restore-document`, {document_ids: idsRestore}),
        onSuccess: () => {
            alert(`Successfully restore ${trashDocs?.length === 1 ? "this document" : "these documents"}`);
            setSelectedIds([]);
            queryClient.invalidateQueries({queryKey: ["trashDocuments"]});
            queryClient.invalidateQueries({queryKey: ["documents"]});
        },
        onError: (error) => {
            alert(`Failed to restore documents: ${error.message}`);
        }
    });

    const permanentDeleteMutation = useMutation({
        mutationFn: (ids: number[]) => documentAPI.permanentDeleteDocument(ids),
        onSuccess: () => {
            alert(`Successfully permanently deleted ${trashDocs?.length === 1 ? "this document" : "these documents"}`);
            queryClient.invalidateQueries({queryKey: ["trashDocuments"]});
            setSelectedIds([]);
        },
        onError: (err) => alert(`Failed to permanently delete documents. ${err.message}`)
    })

    const handleRestoreDocuments = async (idsRestore: number[]) => {
        if (idsRestore.length === 0) return;
        if (!confirm(`Are you sure you want to restore ${idsRestore.length === 1 ? "this document" : "these documents"}?`)) return;
        
        restoreMutation.mutate(idsRestore);
    }

    return (
        <div className = "min-h-screen bg-background flex flex-col">
            <main className="flex-1 p-8 max-w-5xl w-full mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="gap-1 mb-2">
                            <ArrowLeft className="h-4 w-4" /> Back
                        </Button>
                        <h1 className="text-2xl font-bold tracking-tight">Trash Documnents</h1>
                        <p className="text-sm text-muted-foreground">Manage and restore temporarily deleted documents</p>
                    </div>

                    {/* Bulk restore */}
                    {selectedIds.length > 0 && (
                        <Button 
                            onClick={() => handleRestoreDocuments(selectedIds)} 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                        >
                            <RefreshCw className="h-4 w-4" /> Restore {selectedIds.length} selected document{selectedIds.length > 1 && "s"}
                        </Button>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 border rounded-xl bg-muted/10">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                        <p className="text-sm text-muted-foreground">Loading...</p>
                    </div>
                ) : isError ? (
                    <div className = "text-center py-16 border rounded-xl bg-destructive/5 border-destructive/20 text-destructive">
                        Cannot connect to the server. Please try again...
                    </div>
                ) : trashDocs.length === 0 ? (
                    <div className="text-center py-16 border border-dashed rounded-xl text-muted-foreground">
                        Empty bin. There are no deleted documents.
                    </div>
                ) : (
                    <div className="border rounded-lg bg-card overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b bg-muted/50 text-sm font-medium text-muted-foreground">
                                    <th className="p-4 w-12 text-center">
                                        <input 
                                            type="checkbox"
                                            title="Chọn tất cả"
                                            checked={selectedIds.length === trashDocs.length}
                                            onChange={() => setSelectedIds(selectedIds.length === trashDocs.length ? [] : trashDocs.map(d => d.id))}
                                            className="h-4 w-4 accent-primary cursor-pointer"
                                        />
                                    </th>
                                    <th className="p-4">Title</th>
                                    <th className="p-4">Deleted at</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trashDocs.map((doc) => {
                                    const isChecked = selectedIds.includes(doc.id);
                                    return (
                                        <tr key={doc.id} className={`border-b hover:bg-muted/30 text-sm transition-colors ${isChecked ? "bg-primary/5" : ""}`}>
                                            <td className="p-4 text-center">
                                                <input 
                                                    type="checkbox"
                                                    title="Select documents"
                                                    checked={isChecked}
                                                    onChange={() => handleToggleSelect(doc.id)}
                                                    className="h-4 w-4 accent-primary cursor-pointer"
                                                />
                                            </td>
                                            <td className="p-4 font-medium flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                                                <span className="truncate max-w-sm">{doc.title}</span>
                                            </td>
                                            <td className="p-4 text-muted-foreground">
                                                {new Date(doc.deleted_at).toLocaleString("vi-VN")}
                                            </td>
                                            <td className="p-4 text-right">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => handleRestoreDocuments([doc.id])}
                                                    className="text-emerald-600 hover:bg-emerald-50 border-emerald-200 gap-1"
                                                >
                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                    Restore
                                                </Button>

                                                <Button 
                                                    variant = "outline"
                                                    size = "sm"
                                                    onClick = {() =>{
                                                        if (confirm("Are you sure you want to permanently delete this document? Cannot be redo.")) {
                                                            permanentDeleteMutation.mutate([doc.id]);
                                                        }
                                                    }}
                                                    className = "text-destructive hover:bg-destructive/10 h-8 px-2.5"
                                                >
                                                    <Trash className="w-3.5 h-3.5" />
                                                    Delete completely.
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
import React, { useState} from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { MessageSquare, FileText, User, ArrowUpDown, ArrowLeft} from "lucide-react";

interface SharedDocument {
    id: number; 
    title: string;
    shared_by: string;
    shared_at: string;
}

export default function SharedToMe() {
    const router = useRouter();
    const [sharedDocuments, setSharedDocuments] = useState<SharedDocument[]>([]);
    const [sortField, setSortField] = useState<"title" | "shared_by" | "shared_at">("shared_at");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const handleSort = (field: "title" | "shared_by" | "shared_at") => {
        if (!sharedDocuments) return;
        const isAsc = sortField === field && sortOrder === "asc";
        const sortedDocuments = [...sharedDocuments].sort((a, b) => {
            let valA = a[field].toLowerCase();
            let valB = b[field].toLowerCase();

            if (field === "shared_at") {
                valA = new Date(a.shared_at).getTime().toString();
                valB = new Date(b.shared_at).getTime().toString();
            }
            if (valA < valB) return isAsc ? -1 : 1;
            if (valA > valB) return isAsc ? 1 : -1;
            return 0;
        });
        setSharedDocuments(sortedDocuments);
        setSortField(field);
        setSortOrder(isAsc ? "desc" : "asc");
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <main className="flex-1 p-8 max-w-6xl w-full mx-auto">
                <div className="mb-6">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs"
                            onClick={() => router.push("/dashboard")}>
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <h1 className="text-2xl font-bold tracking-tight">Shared Documents</h1>
                    <p className="text-sm text-muted-foreground">View and work with documents shared with you by your colleagues.</p>
                </div>

                <div className="border rounded-lg bg-card overflow-hidden">
                {/* Bảng danh sách hiển thị */}
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="border-b bg-muted/50 text-sm font-medium text-muted-foreground">
                            <th className="p-4 cursor-pointer hover:text-foreground select-none" onClick={() => handleSort("title")}>
                                <div className="flex items-center gap-1">
                                    Document Name <ArrowUpDown className="w-3.5 h-3.5" />
                                </div>
                            </th>
                            <th className="p-4 cursor-pointer hover:text-foreground select-none" onClick={() => handleSort("shared_by")}>
                                <div className="flex items-center gap-1">
                                    Shared By <ArrowUpDown className="w-3.5 h-3.5" />
                                </div>
                            </th>
                            <th className="p-4 cursor-pointer hover:text-foreground select-none" onClick={() => handleSort("shared_at")}>
                                <div className="flex items-center gap-1">
                                    Shared At <ArrowUpDown className="w-3.5 h-3.5" />
                                </div>
                            </th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sharedDocuments.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center p-8 text-sm text-muted-foreground">
                                    No documents shared with you yet.
                                </td>
                            </tr>
                        ) : (
                            sharedDocuments.map((doc) => (
                            <tr key={doc.id} className="border-b hover:bg-muted/30 text-sm transition-colors">
                                <td className="p-4 font-medium flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                                    <span className="truncate max-w-xs">{doc.title}</span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                                        {doc.shared_by}
                                    </div>
                                </td>
                                    <td className="p-4 text-muted-foreground">
                                    {new Date(doc.shared_at).toLocaleString("vi-VN")}
                                    </td>
                                <td className="p-4 text-right">
                                    <Button variant="outline" size="sm" className="gap-1">
                                        <MessageSquare className="w-3.5 h-3.5 text-primary" />
                                        Ask AI
                                    </Button>
                                </td>
                            </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    )

}
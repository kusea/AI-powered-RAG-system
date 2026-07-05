import React, { useState} from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { MessageSquare, FileText, User, ArrowUpDown, ArrowLeft, Inbox, Send, Loader2, Eye, PenIcon} from "lucide-react";
import api from "@/services/APIclient";
import { useQuery } from "@tanstack/react-query";

interface SharedDocument {
    id: number; 
    title: string;
    shared_by: string;
    share_to: string;
    permission: string;
    shared_at: string;
}

export default function SharedToMe() {
    const router = useRouter();
    const [sortField, setSortField] = useState<"title" | "user" | "shared_at" | "permission">("shared_at");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [activeTab, setActiveTab] = useState<"to_me" | "by_me">("to_me");

    const {data: sharedDocuments = [], isLoading, isError} = useQuery<SharedDocument[]>({
        queryKey: ["sharedDocs", activeTab], 
        queryFn: async () => {
            const url = activeTab === "to_me" ? "/documents/shared-to-me" : "/documents/shared-by-me";
            const res = await api.get(url);
            return res.data;
        }
    });
    const handleSort = (field: "title" | "user" | "shared_at" | "permission") => {
        setSortField(field);
        setSortOrder(sortField === field && sortOrder === "asc" ? "desc" : "asc");
    };

    const sortedDocuments = [...sharedDocuments].sort((a, b) => {
        let valA = "";
        let valB = "";

        if (sortField === "title"){
            valA = a.title.toLowerCase()
            valB = b.title.toLowerCase() 
        } else if (sortField === "user") {
            valA = (activeTab === "to_me" ? a.share_to : a.shared_by).toLowerCase();
            valB = (activeTab === "to_me" ? b.share_to : b.shared_by).toLowerCase();
        } else if (sortField === "shared_at") {
            valA = new Date(a.shared_at).getTime().toString();
            valB = new Date(b.shared_at).getTime().toString();
        } else {
            valA = a.permission.toLowerCase();
            valB = b.permission.toLowerCase();
        }

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
    })

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <main className="flex-1 p-8 max-w-6xl w-full mx-auto">
                <div className="mb-6">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs"
                            onClick={() => router.push("/dashboard")}>
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <h1 className="text-2xl font-bold tracking-tight">Document Sharing Center</h1>
                    <p className="text-sm text-muted-foreground">View and work with shared documents.</p>
                </div>

                <div className="flex space-x-1 bg-muted p-1 rounded-xl max-w-md mb-6">
                    <button
                        onClick={() => setActiveTab("to_me")}
                        className={`flex flex-1 items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all
                            ${activeTab === "to_me" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <Inbox className="w-4 h-4" />
                        Shared to me
                    </button>
                    <button
                        onClick={() => setActiveTab("by_me")}
                        className={`flex flex-1 items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all
                            ${activeTab === "by_me" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <Send className="w-4 h-4" />
                        Shared to others
                    </button>
                </div>

                <div className="border rounded-lg bg-card overflow-hidden">
                {/* Bảng danh sách hiển thị */}
                    <table className="w-full text-center border-collapse">
                        <thead>
                        <tr className="border-b bg-muted/50 text-sm font-medium text-muted-foreground">
                            <th className="p-4 cursor-pointer hover:text-foreground select-none" onClick={() => handleSort("title")}>
                                <div className="flex items-center gap-1">
                                    Document Name <ArrowUpDown className="w-3.5 h-3.5" />
                                </div>
                            </th>
                            <th className="p-4 cursor-pointer hover:text-foreground select-none" onClick={() => handleSort("user")}>
                                <div className="flex items-center gap-1">
                                    {activeTab === "to_me" ? "Shared By" : "Shared To"} <ArrowUpDown className="w-3.5 h-3.5" />
                                </div>
                            </th>
                            <th className="p-4 cursor-pointer hover:text-foreground select-none" onClick={() => handleSort("shared_at")}>
                                <div className="flex items-center gap-1">
                                    Shared At <ArrowUpDown className="w-3.5 h-3.5" />
                                </div>
                            </th>
                            <th className="p-4 cursor-pointer hover:text-foreground select-none">
                                <div className="flex items-center gap-1">
                                    Status <ArrowUpDown className="w-3.5 h-3.5" />
                                </div>
                            </th>
                            <th className="p-4">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="text-center p-12">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                        <span className="text-xs text-muted-foreground">Loading documents...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : isError ? (
                            <tr>
                                <td colSpan={4} className="text-center p-12 text-sm text-destructive">
                                    Failed to load shared documents.
                                </td>
                            </tr>
                        ) : sortedDocuments.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center p-8 text-sm text-muted-foreground">
                                    No documents found.
                                </td>
                            </tr>
                        ) : (
                            sortedDocuments.map((doc) => (
                            <tr key={doc.id} className="border-b hover:bg-muted/30 text-sm transition-colors text-center">
                                <td className="p-4 font-medium flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                                    <span className="truncate max-w-xs">{doc.title}</span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                                        {activeTab === "to_me" ? doc.shared_by : doc.share_to}
                                    </div>
                                </td>
                                <td className="p-4 text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        {doc.shared_at}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1.5">
                                        {doc.permission === "read" ? <Eye className="w-3.5 h-3.5 text-muted-foreground" /> 
                                        : doc.permission === "write" ? <PenIcon className="w-3.5 h-3.5 text-muted-foreground"/>
                                        : <div className="flex items-center gap-1.5">
                                            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                                            <PenIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                        </div>}
                                    </div>
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
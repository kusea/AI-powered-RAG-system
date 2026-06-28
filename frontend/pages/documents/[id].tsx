// frontend/pages/documents/[id].tsx
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft, MessageSquare, Calendar, HardDrive } from "lucide-react";
import Link from "next/link";
import api from "@/services/APIclient";

// Hàm gọi API lấy chi tiết 1 tài liệu dựa trên ID
export default function DocumentDetail() {
    const router = useRouter();
    const { id } = router.query; // Lấy ID tài liệu từ URL
    // Dùng React Query để cache và quản lý dữ liệu
    const { data: doc, isLoading, isError } = useQuery({
        queryKey: ["documentDetail", id],
        queryFn: async () => {
            if (!id) return null;
            const response = await api.get(`/documents/${id}`);
            return response.data;
        },
        enabled: router.isReady && !!id, // Chỉ gọi API khi ID đã tồn tại trên URL
    });
    console.log("DOCUMENT: ", doc);

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    if (!router.isReady || isLoading) return <div className="text-center py-20">Loading to find the document...</div>;
    if (isError || !doc) return <div className="text-center py-20 text-destructive">Error! Can not find the document</div>;

    return (
        <div className="min-h-screen bg-background text-foreground p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between border-b pb-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                </Link>
                
                <Link href={`/chat?document_id=${doc.id}&title=${encodeURIComponent(doc.title)}`}>
                    <Button className="gap-2 text-amber-500 border-amber-500/30 hover:bg-amber-500/10" variant="outline">
                        <MessageSquare className="h-4 w-4" /> Ask AI Assistant
                    </Button>
                </Link>
            </div>

            {/* 1. THÔNG TIN CHUNG CỦA TÀI LIỆU */}
            <div className="flex items-start space-x-4 bg-card p-6 border rounded-xl shadow-sm">
                <div className="p-4 bg-primary/10 text-primary rounded-xl">
                    <FileText className="h-8 w-8" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight truncate">{doc.title}</h1>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-1">
                        <span className="flex items-center gap-1">
                            <HardDrive className="h-4 w-4" /> {formatFileSize(doc.file_size)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" /> Uploaded at: {new Date(doc.created_at).toLocaleDateString("vi-VN")}
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    Preview
                </h2>
            
            <div className="border rounded-xl bg-muted/30 shadow-inner overflow-hidden">
                <div className="bg-muted px-4 py-2 border-b text-xs text-muted-foreground flex justify-between items-center">
                    <span>TEXT VIEW</span>
                    <span>{doc.content ? `${doc.content.length} characters` : "Empty"}</span>
                </div>
                
                {/* Content area */}
                <div className="p-6 max-h-100 overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap bg-card">
                    {doc.content ? (
                        doc.content
                    ) : (
                        <p className="text-muted-foreground italic text-center py-8">
                            This document is empty or the content is not available.
                        </p>
                    )}
                </div>
            </div>
            </div>
        </div>
    );
}
// frontend/pages/documents/[id].tsx
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft, MessageSquare, Calendar, HardDrive, Share2 } from "lucide-react";
import Link from "next/link";
import api from "@/services/APIclient";
import { Insights } from "@/components/DocumentCard";
import { DocumentView } from "@/components/views/DocumentView";

// Hàm gọi API lấy chi tiết 1 tài liệu dựa trên ID
export default function DocumentDetail() {
    const router = useRouter();
    const { id } = router.query;

    const {data: documentInsights} = useQuery<Insights>({
        queryKey: ["documentInsights", id],
        queryFn: async () => {
            if (!id) return null;
            const response = await api.get(`/documents/${id}/insights`);
            return response.data;
        }
    })
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

                <div className = "flex-1 flex justify-end space-x-2">
                    <Link href="/documents/share">
                        <Button className="text-primary border-primary/30 hover:bg-primary/10 gap-2" variant = "outline">
                            <Share2 className="h-4 w-4" /> Share
                        </Button>
                    </Link>
                    
                    <Link href={`/chat?document_id=${doc.id}&title=${encodeURIComponent(doc.title)}`}>
                        <Button className="gap-2 text-amber-500 border-amber-500/30 hover:bg-amber-500/10" variant="outline">
                            <MessageSquare className="h-4 w-4" /> Ask AI Assistant
                        </Button>
                    </Link>
                </div>
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

            <div className="border rounded-xl bg-muted/30 shadow-inner overflow-hidden">
                <div className="bg-muted px-4 py-2 border-b text-xs text-muted-foreground flex justify-between items-center">
                    <span>INSIGHT OF THE DOCUMENT</span>
                </div>
                
                {/* Content area */}
                <div className="p-6 max-h-100 overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap bg-card">
                    {documentInsights ? (
                        <div className="p-4 space-y-3 text-xs">
                            <div>
                                <span className="font-semibold text-primary block mb-1">📝 Quick summary:</span>
                                <p className="text-muted-foreground leading-relaxed">
                                    {documentInsights?.summary || "No summary available"}
                                </p>
                            </div>
                            
                            <div>
                                <span className="font-semibold text-primary block mb-1">📌 Key points:</span>
                                <ul className="list-inside space-y-1 text-muted-foreground">
                                    {documentInsights?.key_points.map((point, index) => (
                                    <li key={index} className="flex items-start gap-1">
                                        <span className="text-primary/70 mt-0.5">•</span>
                                        <span>{point}</span>
                                    </li>
                                    )) || "No key points available"}
                                </ul>
                            </div>

                            <div className="flex flex-wrap gap-1 pt-1">
                                {documentInsights?.key_words.map((kw, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-0.5 bg-primary/5 text-primary text-[10px] rounded-full border border-primary/10 font-medium"
                                        >
                                            #{kw}
                                    </span>
                                )) || "No key words available"}
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground italic text-center py-8">
                            This document is empty or the content is not available.
                        </p>
                    )}
                </div>
            </div>
            
            <DocumentView 
                fileUrl={doc.file_path}
                fileName={doc.title}
                textContent={doc.content}
            />
        </div>
    );
}
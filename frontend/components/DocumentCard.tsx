import React, { useState } from "react";
import { ChevronDown, FileText, MoreVertical, MessageSquare, Share2, Info } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdownMenu";
import { Button } from "./ui/button";
import { useRouter } from "next/router";
import api from "@/services/APIclient";

export interface Insights {
    id: number;
    document_id: number;
    summary: string;
    key_points: string[];
    key_words: string[];
}

export interface DocumentItem {
    id: number;
    title: string;
    file_size: number | null;
    created_at: Date;
    is_shared: boolean;
    owner_email?: string;
}

interface DocumentCardProps {
    doc: DocumentItem;
    isSelected: boolean;
    onSelect: (id: number) => void;
    onShareModalOpen: (doc: DocumentItem) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ doc, isSelected, onSelect, onShareModalOpen}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [documentInsights, setDocumentInsights] = useState<Insights | null>(null);
    const router = useRouter();

    const getDocumentInsights = async () => {
        await api.get(`/documents/${doc.id}/insights`)
            .then(res => setDocumentInsights(res.data))
            .catch(err => console.log(`Error getting document insights: ${err}`));
    };

    const formatBytes = (bytes: number | null, decimals = 2) => {
        if (bytes === 0 || !bytes) return "0 Bytes";
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    };

    return (
        <div className = "flex flex-col relative items-stretch border p-4 pl-6 rounded-xl hover:bg-muted/50 transition-colors">
            <div className = "flex items-center w-full gap-4 justify-between">
                <div className="absolute top-3 right-4 z-10">
                    <input
                        title="Select document"
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(doc.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary cursor-pointer accent-primary"
                    />
                </div>

                <div className="flex items-center space-x-4 min-w-0 p-4 left-2 justify-between gap-4">
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
                            Size: {formatBytes(doc.file_size)} {doc.is_shared ? ` • Sender: ${doc.owner_email}` : "Me"} • Uploaded: {new Date(doc.created_at).toLocaleDateString("vi-VN")}
                        </p>
                    </div>
                </div>

                <div className = "flex items-center gap-1 shrink-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant = "ghost" size = "icon" className = "h-8 w-8 p-0">
                                <MoreVertical className = "h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick = {() => router.push(`/chat?document_ids=${doc.id}&title=${encodeURIComponent(doc.title)}`)} className = "cursor-pointer gap-2">
                                <MessageSquare className = "h-4 w-4" />
                                Ask AI about this document
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick = {() => router.push(`/documents/${doc.id}`)} className = "cursor-pointer gap-2">
                                <Info className = "h-4 w-4" />
                                View document details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick = {(e) => {
                                    e.preventDefault();
                                    onShareModalOpen(doc)
                                    e.stopPropagation();
                                }} 
                                className = "cursor-pointer gap-2"
                            >
                                <Share2 className = "h-4 w-4" />
                                Share document
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-all focus:outline-none"
                        title={isExpanded ? "Shrink summary" : "Expand summary"}
                    >
                        <ChevronDown
                            className={`h-4 w-4 transform transition-transform duration-300 ${
                                isExpanded ? "rotate-180" : "rotate-0"
                            }`}
                            onClick = {getDocumentInsights}
                        />
                    </button>
                </div>
            </div>
            
            
            {documentInsights && (
            <div
                className={`w-full mt-3 transition-all duration-300 ease-in-out border-t bg-muted/10 overflow-hidden 
                ${ isExpanded ? "max-h-125 opacity-100" : "max-h-0 opacity-0 border-none" }`}
            >
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
            </div>
            )}
        </div>
    );
};
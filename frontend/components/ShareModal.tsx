import React, { useState} from "react";
import { Button } from "./ui/button";
import { Share2, Shield, Mail, X} from "lucide-react";
import { DocumentItem } from "./DocumentCard";
import api from "@/services/APIclient";

interface ShareModalProps {
    isShareModalOpen: (isOpen: boolean) => void;
    sharingDocs: DocumentItem[];
    onSelectedIds: (selectedIds: number[]) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({isShareModalOpen, sharingDocs, onSelectedIds}) => {
    const [isSubmittingShare, setIsSubmittingShare] = useState(false);
    const [shareEmail, setShareEmail] = useState<string>("");
    const [sharePermission, setSharePermission] = useState<string>("read");
    const handleConfirmShare: React.ComponentProps<"form">["onSubmit"] = async (e) => {
        e.preventDefault();
        if (sharingDocs.length === 0 || !shareEmail.trim()) return;
        setIsSubmittingShare(true);

        const docIds = sharingDocs.map(doc => doc.id);
        const sharePromises = docIds.map(id => api.post("/documents/share", {document_id: id, shared_to_email: shareEmail, permission: sharePermission}));

        await Promise.all(sharePromises)
            .then(() => {
                alert(`Successfully shared ${docIds.length === 1 ? "this document" : "these documents"} with ${shareEmail}.`);
                isShareModalOpen(false);
                onSelectedIds([]);
            })
            .catch(err => alert(`Failed to share document: ${err.message}`))
            .finally(() => {
                setIsSubmittingShare(false);
                setShareEmail("");
                setSharePermission("read");
            });
    };
    
    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-xs animate-in fade-in-50">
            <div className="bg-card border text-card-foreground rounded-xl w-full max-w-md p-6 shadow-lg relative animate-in zoom-in-95">
                <button 
                        title = "Close Share Modal"
                        onClick={() => isShareModalOpen(false)}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground rounded-md p-1"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <div className="flex items-center gap-2 mb-4">
                        <Share2 className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-bold tracking-tight">
                            Share {sharingDocs.length === 1 ? "document" : `${sharingDocs.length} documents`}
                        </h3>
                    </div>

                    <div className="text-sm text-muted-foreground mb-4 truncate">
                        {sharingDocs.length === 1 ? (
                        <p>Document: <strong className="text-foreground font-medium">{sharingDocs[0].title}</strong></p>)
                        : (
                            <div>
                                <p className="font-medium mb-1">Selected documents:</p>
                                <ul className="list-disc pl-4 space-y-0.5 text-xs">
                                    {sharingDocs.map((doc) => (
                                        <li key={doc.id} className="truncate">
                                            <strong className="text-foreground font-medium">{doc.title}</strong>
                                        </li>))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleConfirmShare} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                <Mail className="h-3 w-3" /> Receiver Email
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="example@domain.com"
                                value={shareEmail}
                                onChange={(e) => setShareEmail(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                <Shield className="h-3 w-3" /> Access permission
                            </label>
                            <select
                                title="Permission Share"
                                value={sharePermission}
                                onChange={(e) => setSharePermission(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <option value="read">Only read</option>
                                <option value="write">Only Write</option>
                                <option value="read_write">Read and Write</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-end space-x-3 pt-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => isShareModalOpen(false)}
                                disabled={isSubmittingShare}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmittingShare} className="gap-1">
                                {isSubmittingShare ? "Share..." : "Confirm"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
    );
    
}
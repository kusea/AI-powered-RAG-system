import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { UploadCloud, CheckCircle, AlertCircle, Loader2, ShieldAlert, Trash2, Bot, Share2} from "lucide-react";
import { documentAPI } from "@/services/documentAPI";
import { getAuthToken } from "@/services/authAPI";
import { useRouter } from "next/router";
import axios from "axios";
import api from "@/services/APIclient";
import { DocumentItem, DocumentCard } from "@/components/DocumentCard";
import { ShareModal } from "@/components/ShareModal";
import { useGooglePicker } from "@/hooks/useGooglePicker";
import { useGoogleLogin } from "@react-oauth/google";
import { FaGoogleDrive } from "react-icons/fa";
import { FileConflictModal } from "@/components/FileConflictModal";

interface GoogleDriveDocument {
    id: string;
    name?: string; 
    mimeType?: string;
    url?: string;
}

interface PickerCallbackData {
    action: string;
    docs?: GoogleDriveDocument[];
}

export default function Dashboard(){
    const queryClient = useQueryClient();
    const router = useRouter();
    
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [uploadStatus, setUploadStatus] = useState<{ "type": "success" | "error" | "warning", "message": string } | null>(null);

    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [sharingDocs, setSharingDocs] = useState<DocumentItem[]>([]);

    const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
    const [conflictType, setConflictType] = useState<"local" | "google-drive" | null>(null);
    const [pendingLocalFile, setPendingLocalFile] = useState<File | null>(null);
    const [pendingDriveFile, setPendingDriveFile] = useState<{fileId: string, accessToken: string, mimeType: string, conflict_strategy: string, filename: string} | null>(null);

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const handleToggleSelect = ((id: number) => {
        setSelectedIds(prevIds => (prevIds.includes(id) ? prevIds.filter(prevId => prevId !== id): ([...prevIds, id])));
    })

    const isPickerSdkReady = useGooglePicker();

    const {data: token} = useQuery({
        queryKey: ["authToken"], 
        queryFn: getAuthToken,
        staleTime: 30000
    });

    const isHasToken = !!token;

    const resetUploadState = () => {
        setTimeout(() => {
            setUploadProgress(null);
        }, 1000);
        
        setPendingLocalFile(null);
        setPendingDriveFile(null);
        setUploadStatus(null);
    }
    // Use useQuery to manage documents data
    const { data: documents = [], isLoading: isDocsLoading, isError: isDocsError } = useQuery<DocumentItem[]>({
        queryKey: ["documents"],
        queryFn: documentAPI.fetchDocumentAPI,
    })
    // Use mutation to upload new files
    const uploadMutation = useMutation({
        mutationFn: documentAPI.uploadDocumentAPI,
        onSuccess: (data, variables) => {
            setUploadStatus({ type: "success", message: `Sucessfully uploaded "${variables.file.name}"` });
            queryClient.invalidateQueries({queryKey: ["documents"]});
            resetUploadState();
        },
        onError: (error) => {
            let message: string = "";
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                if (status === 429) message = "Rate limit exceeded. Please try again later.";
                else message = `An error occurred while uploading "${error.response?.data.message || error.message}".`;
            } else if (error instanceof Error) message = `An error occurred while uploading (not Axios) "${error.message}".`;
            else message = "An unknown error occurred.";
            setUploadStatus({ type: "error", message: message });
            resetUploadState();
        }
    })

    

    const driveUploadMutation = useMutation({
        mutationFn: documentAPI.uploadFromGoogleDrive,
        onSuccess: () => {
            setUploadProgress(100);
            setUploadStatus({ type: "success", message: "Nhập tài liệu từ Google Drive thành công!" });
            queryClient.invalidateQueries({ queryKey: ["documents"] });
            resetUploadState();
        },
        onError: (error) => {
            let message: string = "";
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                if (status === 429) message = "Rate limit exceeded. Please try again later.";
                else message = `An error occurred while uploading "${error.response?.data.message || error.message}".`;
            } else if (error instanceof Error) message = `An error occurred while uploading (not Axios) "${error.message}".`;
            else message = "An unknown error occurred.";
            setUploadStatus({ type: "error", message: message });
            resetUploadState();
        }
    });

    // Solving the drop files logic
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        // Check whether user is authenticated or not by checking token
        if (!token) {
            setUploadStatus({ type: "warning", message: "You must log in to upload files." });
            return;
        }

        if (driveUploadMutation.isPending) {
            setUploadStatus({ type: "warning", message: "Another upload is in progress. Please wait." });
            return;
        }

        const file = acceptedFiles[0];
        const isDuplicate = documents.some(doc => doc.title === file.name);

        if (isDuplicate) {
            setPendingLocalFile(file);
            setConflictType("local");
            setIsConflictModalOpen(true);
        } else {
            uploadMutation.mutate({
                file,
                onProgress: (percent) => setUploadProgress(percent),
                conflict_strategy: "rename"
            })
        }
        setTimeout(() => setUploadStatus(null), 2000);
    }, [uploadMutation, token, documents, driveUploadMutation]);

    // useDropzone
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop,
        accept: {
            'text/plain': ['.txt'],
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'text/markdown': ['.md'],
            'text/html': ['.html'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png']
        },
        multiple: true,
        disabled: driveUploadMutation.isPending
    });

    const handleBulkDelete = async () => {
        const confirmDelete = confirm(`Are you sure you want to delete ${selectedIds.length === 1 ? "this document" : "these documents"}?`);
        if (!confirmDelete) return;

        await api.delete(`/documents/delete-document`, {data: {document_ids: selectedIds}}).then(() => {
            queryClient.invalidateQueries({queryKey: ["documents"]});
            setSelectedIds([]);
        }).catch(err => alert(`Failed to delete documents: ${err.message}`));
    };

    const handleBulkAskAI = async () => {
        if (selectedIds.length === 0) return; 
        const idsQuery = selectedIds.join(",");
        router.push(`/chat?document_ids=${idsQuery}&mode=multi`);
    };

    const handleOpenShareModal = (doc: DocumentItem | null) => {
        const selectedDocs = (!doc) ? documents.filter(doc => selectedIds.includes(doc.id)) : [doc];
        setIsShareModalOpen(true);
        setSharingDocs(selectedDocs);
    };

    const handlePickerCallback = useCallback((data: PickerCallbackData, accessToken: string) => {
        if (data.action === window.google.picker.Action.PICKED && data.docs && data.docs.length > 0) {
            const doc = data.docs[0];

            const isDuplicate = documents.some(document => document.title === doc.name);

            if (isDuplicate) {
                setPendingDriveFile({fileId: doc.id, accessToken, mimeType: doc.mimeType || "", conflict_strategy: "rename", filename: doc.name || ""});
                setConflictType("google-drive");
                setIsConflictModalOpen(true);
            } else {
                driveUploadMutation.mutate({
                    fileId: doc.id,
                    accessToken,
                    mimeType: doc.mimeType || "",
                    conflict_strategy: "rename"
                });
            }
            setTimeout(() => setUploadStatus(null), 2000);
        }
    }, [documents, driveUploadMutation]);

    const openPicker = (access_token: string) => {
        if (!window.google || !window.google.picker) return;
        const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS);
        const picker = new window.google.picker.PickerBuilder()
            .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
            .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY || "")
            .setAppId(process.env.NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID || "")
            .setOAuthToken(access_token)
            .addView(view)
            .setCallback((data: PickerCallbackData) => {
                handlePickerCallback(data, access_token);
            })
            .build();
        picker.setVisible(true);
    };

    const loginWithDrive = useGoogleLogin({
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        flow: "implicit", 
        onSuccess: (tokenResponse) => {
            if(tokenResponse.access_token)
                openPicker(tokenResponse.access_token);
        }
    });

    const handleResolveConflict = (strat: "overwrite" | "rename" | "skip") => {
        setIsConflictModalOpen(false);

        if (conflictType === "local" && pendingLocalFile) 
            uploadMutation.mutate({
                file: pendingLocalFile, 
                onProgress: (percent) => setUploadProgress(percent),
                conflict_strategy: strat
            })
        else if (conflictType === "google-drive" && pendingDriveFile)
            driveUploadMutation.mutate({
                fileId: pendingDriveFile.fileId,
                accessToken: pendingDriveFile.accessToken,
                mimeType: pendingDriveFile.mimeType,
                conflict_strategy: strat
            })
    }

    const handleCancelConflict = () => {
        setIsConflictModalOpen(false);
        resetUploadState();
    }

    const isUploading = uploadMutation.isPending || driveUploadMutation.isPending;

    const handleDriveButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        if (!isPickerSdkReady) {
            alert("Google Picker SDK is not ready. Please try again later.");
            return;
        }

        loginWithDrive();
    };

    return (
        <div className = "min-h-screen bg-background text-foreground p-8 max-w-5xl mx-auto">
            <header className = "mb-8 flex items-center justify-between border-b pb-4">
                <div>
                    <h1 className = "text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className = "text-muted-foreground mt-1">Upload and manage your documents.</p>
                </div>
            </header>

            {/* Dropzone */}
            <div
                {...getRootProps()}
                className = {`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors duration-200 
                    ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50"}`}
            >
                <input {...getInputProps()} />
                <div className = "flex flex-col items-center justify-center space-y-4">
                    <div className = "b-4 bg-muted rounded-full">
                        <UploadCloud className = "h-8 w-8 text-muted-foreground" />
                    </div>
                    {isDragActive ? (
                        <p className = "text-primary font-medium">Drop the files here...</p>
                    ) : (
                        <div>
                            <p className = "text-lg font-medium">Drag and drop files here, or click to select files</p>
                            <p className = "text-sm text-muted-foreground">Supported file types: .txt, .pdf, .docx, .pptx, .xlsx, .md, .html, .csv, .png, .jpeg, .jpg</p>

                            <div className="relative flex py-2 items-center w-full max-w-xs justify-center mx-auto mb-4">
                                <div className="grow border-t border-muted"></div>
                                <span className="shrink mx-4 text-xs text-muted-foreground uppercase select-none">Or</span>
                                <div className="grow border-t border-muted"></div>
                            </div>

                            {/* KHU VỰC NÚT BẤM GOOGLE DRIVE - Đã ép căn giữa */}
                            <div className="w-full flex justify-center items-center">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isUploading}
                                    className="flex items-center gap-2 z-10 mx-auto"
                                    onClick={handleDriveButtonClick}
                                >
                                    <FaGoogleDrive size={20} /> 
                                    {isUploading ? "Loading to download document from Google Drive...." : "Download from Google Drive"}
                                </Button>
                            </div>
                        </div>

                        
                    )}
                </div>
            </div>
            {/* Upload Progress */}
            {uploadProgress !== null && (
                <div className = "mt-6 space-y-2 bg-muted b-4 round-lg border">
                    <div className = "flex justify-between text-sm font-medium">
                        <span className = "flex items-center gap-2">
                            <span className = "animate-pulse inline-block h-2 w-2 rounded-full bg-primary"></span>
                            Uploading...
                        </span>
                        <span>{uploadProgress}%</span>
                    </div>
                    <div className = "w-full bg-muted rounded-full h-2.5 overflow-hidden">
                        <div className = {`bg-primary h-2.5 rounded-full transition-all duration-300 w-${uploadProgress}`}></div>
                    </div>
                </div>
            )}


            {/* Upload Status */}
            {uploadStatus && isHasToken && (
                <div className = {`mt-4 p-4 rounded-lg flex gap-3 items-start border
                    ${uploadStatus.type === "success" ? 
                    "bg-emerald-500/20 border-emerald-500/20 text-emerald-600" 
                    : uploadStatus.type === "warning" ?
                    "bg-amber-500/20 border-amber-500/20 text-amber-600"
                    : "bg-destructive/20 border-destructive/20 text-destructive"}`}>
                        {uploadStatus.type === "success" ? (
                            <CheckCircle className = "h-5 w-5 mt-0.5 shrink-0" />
                        ) : uploadStatus.type === "warning" ? (
                            <ShieldAlert className = "h-5 w-5 mt-0.5 shrink-0" />
                        ) : (
                            <AlertCircle className = "h-5 w-5 mt-0.5 shrink-0" />
                        )}
                        <span className = "text-sm font-medium">{uploadStatus.message}</span>
                </div>
            )}

            {selectedIds.length > 0 && (
                <div className="mt-6 flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-xl">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        <span>Selected <strong className="text-primary text-base">{selectedIds.length}</strong> {selectedIds.length === 1 ? "document" : "documents"}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Button onClick={handleBulkAskAI} variant="outline" className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10 gap-2">
                            <Bot className="h-4 w-4" /> Ask AI about {(selectedIds.length == 1) ? "this document" : `these ${selectedIds.length} selected documents`}
                        </Button>
                        <Button onClick={() => handleOpenShareModal(null)} variant="outline" className="text-primary border-primary/30 hover:bg-primary/10 gap-2">
                            <Share2 className="h-4 w-4" /> Share {(selectedIds.length == 1) ? "this document" : `these ${selectedIds.length} selected documents`}
                        </Button>
                        <Button onClick={handleBulkDelete} variant="destructive" className="gap-2">
                            <Trash2 className="h-4 w-4" /> Delete selected {selectedIds.length === 1 ? "document" : "documents"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Document List */}
            <div className = "mt-10">
                <div className="flex items-center justify-between border-b mb-4">
                    <h2 className = "text-xl font-semibold mb-4 flex items-center gap-2 pb-2">Your Documents</h2>
                    { isHasToken && documents.length > 0 && (
                        <Button variant="ghost" size="sm"
                                className = {`text-sm font-medium text-primary hover:bg-primary/10 transition-colors underline 
                                            ${selectedIds.length === documents.length ? "text-destructive" : "" }`}
                                onClick = {() => setSelectedIds((selectedIds.length === documents.length) ? [] : documents.map(doc => doc.id))}
                                // If all documents are selected, unselect all. Otherwise, select all
                        >
                            {selectedIds.length === documents.length ? "Deselect All" : "Select All"} 
                        </Button>
                    )}
                </div>
                { !isHasToken ? (
                    <div className="text-center py-12 border rounded-xl bg-destructive/5 border-destructive/20 text-destructive">
                        You must login to view your documents.
                    </div>
                ) : isDocsLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 border round-xl bg-muted/10">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                        <p className="text-sm text-muted-foreground">Loading...</p>
                    </div>
                ) : isDocsError ? (
                    <div className="text-center py-12 border rounded-xl bg-destructive/5 border-destructive/20 text-destructive">
                        Can not connect to the server. Please try again later.
                    </div>
                ) : documents.length === 0 ? (
                    <p className = "text-center py-12 border round-xl bg-muted/10 text-muted-foreground">No documents uploaded yet.</p>
                ) : (
                    <div className = "grid grid-cols-1 md:grid-cols-2 gap-4">
                        {documents.map((doc) => {
                            const isChecked = selectedIds.includes(doc.id);
                            return (
                            <div
                                key = {doc.id}
                                className = {`${isChecked ? "border-primary bg-primary/5 shadow-sm" : "hover:bg-muted/50"}`}
                            >
                                <DocumentCard 
                                    doc = {doc}
                                    isSelected = {isChecked}
                                    onSelect = {handleToggleSelect}
                                    onShareModalOpen = {handleOpenShareModal}
                                />
                            </div>
                        )})}
                    </div>
                )}
            </div>

            {isShareModalOpen && sharingDocs.length > 0 && 
            (<ShareModal 
                isShareModalOpen={setIsShareModalOpen} 
                sharingDocs={sharingDocs} 
                onSelectedIds={setSelectedIds} 
            />)}

            {isConflictModalOpen &&
            <FileConflictModal
                isOpen={isConflictModalOpen}
                fileName={conflictType === "local" ? pendingLocalFile?.name || "" : pendingDriveFile?.filename || ""}
                onResolve={handleResolveConflict}
                onCancel={handleCancelConflict}
            />}
    </div>
    );
}
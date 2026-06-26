import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2, ShieldAlert, MessageSquare, Link} from "lucide-react";
import { uploadDocumentAPI, fetchDocumentAPI } from "@/services/documentAPI";
import { getAuthToken } from "@/services/authAPI";
import { useRouter } from "next/router";
import axios from "axios";

interface DocumentItem {
    id: number;
    title: string;
    content: string | null;
    file_size: number | null;
    created_at: Date; 
}

export default function Dashboard(){
    const queryClient = useQueryClient();
    const router = useRouter();
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [uploadStatus, setUploadStatus] = useState<{ "type": "success" | "error" | "warning", "message": string } | null>(null);

    const {data: token} = useQuery({
        queryKey: ["authToken"], 
        queryFn: getAuthToken,
        staleTime: 0
    });

    const isHasToken = !!token;
    // Use useQuery to manage documents data
    const { data: documents = [], isLoading: isDocsLoading, isError: isDocsError } = useQuery<DocumentItem[]>({
        queryKey: ["documents"],
        queryFn: fetchDocumentAPI
    })
    // Use mutation to upload new files
    const uploadMutation = useMutation({
        mutationFn: uploadDocumentAPI,
        onSuccess: (data, variables) => {
            setUploadStatus({ type: "success", message: `Sucessfully uploaded "${variables.file.name}"` });
            queryClient.invalidateQueries({queryKey: ["documents"]});
            setTimeout(() => setUploadProgress(null), 1000);
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
            setUploadProgress(null);
        }
    })

    // Solving the drop files logic
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        // Check whether user is authenticated or not by checking token
        if (!token) {
            setUploadStatus({ type: "warning", message: "You must log in to upload files." });
            return;
        }

        const file = acceptedFiles[0];
        setUploadProgress(0);
        setUploadStatus(null);

        uploadMutation.mutate({
            file,
            onProgress: (percent) => setUploadProgress(percent)
        })
    }, [uploadMutation, token]);

    // Helper function to format files' size
    const formatFileSize = (bytes: number | null, decimals = 2) => {
        const kb = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
        
        if (!bytes) return "0 Bytes"; 
        const i = Math.floor(Math.log(bytes) / Math.log(kb));

        return parseFloat((bytes / Math.pow(kb, i)).toFixed(dm)) + "" + sizes[i];
    }

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
            'text/csv': ['.csv']
        },
        multiple: true
    });

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
                            <p className = "text-sm text-muted-foreground">Supported file types: .txt, .pdf, .docx, .pptx, .xlsx, .md, .html, .csv</p>
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


            {/* Document List */}
            <div className = "mt-10">
                <h2 className = "text-xl font-semibold mb-4 flex items-center gap-2">Your Documents</h2>
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
                    <div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documents.map((doc) => (
                            <div
                                key = {doc.id}
                                className = "flex item-center justify-between border p-4 pl-6 rounded-xl hover:bg-muted/50 transition-colors"
                            >
                                <div className = "flex items-center space-x-4 min-w-0">
                                    <div className = "p-2.5 bg-primary/10 rounded-lg">
                                        <FileText className = "h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm truncate max-w-md md:max-w-xl">{doc.title}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                        Size: {formatFileSize(doc.file_size)} • Uploaded: {new Date(doc.created_at).toLocaleDateString("vi-VN")}
                                        </p>
                                    </div>
                                </div>
                                <div className="px-2 py-6 whitespace-nowrap text-sm font-medium flex items-center">
                                    {/* <Link href={`/chat?document_id=${doc.id}&title=${encodeURIComponent(doc.title)}`}>
                                        <Button size="sm" variant = "outline" className="text-amber-500 hover:text-amber-600 border-amber-500/30 gap-1">
                                            
                                        </Button>
                                    </Link> */}

                                    <button onClick = {() => router.push(`/chat?document_id=${doc.id}&title=${encodeURIComponent(doc.title)}`)}
                                        className="ml-2 text-primary hover:text-primary/80">
                                        <MessageSquare className="h-4 w-4" />
                                        Ask AI
                                    </button>
                                </div>
                                <Link href={`/document/${doc.id}`}>
                                    <Button className="self-center md:self-center md:mt-0" variant = "outline" size = "sm">
                                        Details
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
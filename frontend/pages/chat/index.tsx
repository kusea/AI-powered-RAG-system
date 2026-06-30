import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchChatStreamAPI } from "@/services/chatAPI";
import { FileText, Loader2, Send, User, Bot, Plus, ArrowLeft, MessageSquare, Trash2, Edit2, MoreVertical} from "lucide-react";
import { useRouter } from "next/router";
import api from "@/services/APIclient";
import {DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem} from "@/components/ui/dropdownMenu";

interface SourceDocs {
    id: string;
    title: string;
}

interface Message {
    id: string;
    content: string;
    role: "user" | "assistant";
    sources: SourceDocs[];
}

interface SessionItem {
    id: number;
    title: string;
}

export default function ChatAssistant(){
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const isAutoSessionRef = useRef(false); // flag to determine whether to create a new session

    const router = useRouter();
    const {document_id, title, document_ids} = router.query;

    const [sessions, setSessions] = useState<SessionItem[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<number| null> (null);

    const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
    const [editTitleSession, setEditTitleSession] = useState<string | null>(null);
    // Get all sessions from API during the loading time
    useEffect(() => {
        api.get(`/chat/sessions`).then((response) => {
            setSessions(response.data);
            // if (response.data.length > 0) setCurrentSessionId(response.data[0].id);
            // allow current_session_id = null to make the empty UI initially
        })
    }, [])

    const loadMessageHistory = useCallback((sessionId: number) => {
        api.get(`/chat/sessions/${sessionId}/messages`)
            .then((response) => {
                setMessages(response.data);
            })
            .catch((err) => console.error("Error loading message history", err));
    }, []);

    // Get message history of the current session
    useEffect(() => {
        if (currentSessionId) {
            if (isAutoSessionRef.current){
                isAutoSessionRef.current = false;
                return;
            }
            loadMessageHistory(currentSessionId);
        }
    }, [currentSessionId, loadMessageHistory]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect (
        () => scrollToBottom(),
        [messages]
    );

    // Make a new session
    const handleCreateSession = async () => {
        isAutoSessionRef.current = false;
        setCurrentSessionId(null);
        setMessages([]);
        setInput("");
    }

    const handleDeleteSession = async (sessionId: number, e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation(); // Prevent the click event from bubbling up
        if (!confirm("Are you sure you want to delete this session?")) return;

        try{
            await api.delete(`/chat/sessions/${sessionId}`);
            setSessions((prevSessions) => prevSessions.filter((session) => session.id !== sessionId));
            if(currentSessionId === sessionId) handleCreateSession();
        } catch (error) {
            console.error("Error deleting session", error);
        }
    }

    const handleRenameSession = (e: React.MouseEvent<HTMLDivElement>, session: SessionItem) => {
        e.stopPropagation(); // Prevent the click event from bubbling up
        setEditingSessionId(session.id);
        setEditTitleSession(session.title);
    }

    const handleSaveNewSessionName = async (sessionId: number) => {
        const trimmedTitle = editTitleSession?.trim();
        if (!trimmedTitle) return;

        try {
            await api.put(`/chat/sessions/${sessionId}`, {title: trimmedTitle});
            setSessions((prevSessions) => prevSessions.map((session) => session.id === sessionId ? {...session, title: trimmedTitle} : session));
            setEditingSessionId(null);
        } catch (error) {
            console.error("Error renaming session", error);
        }
    }

    
    const handleSendMessage: React.ComponentProps<"form">["onSubmit"] = async (e) => {
        e.preventDefault();
        const userQuery = input.trim();

        if (!userQuery || isLoading) return;
        setInput("");
        setIsLoading(true);

        const userMessageId = Date.now().toString();
        const assistantMessageId = (Date.now() + 1).toString();

        setMessages((prevMessage) => [
            ...prevMessage,
            {
                id: userMessageId,
                content: userQuery,
                role: "user",
                sources: [],
            },
            {
                id: assistantMessageId,
                content: "",
                role: "assistant",
                sources: []
            }
        ]);

        try {
            const parseDocIds = document_ids ? (document_ids as string).split(",").map((id) => Number(id)) : 
                                document_id ? [Number(document_id)]: [];
            const stream = await fetchChatStreamAPI({
                query: userQuery, 
                document_ids: parseDocIds,
                session_id: currentSessionId
            });
            if (!stream) return;

            const reader = stream.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";

            while (true) {
                const { done, value} = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, {stream: true});
                const lines = buffer.split("\n");

                buffer = lines.pop() || "";

                let currentSources: SourceDocs[] = [];

                for (const line of lines) {
                    const cleanedLine = line.trim();
                    if (!cleanedLine) continue;
                    // Skip the "event: sources" line
                    if (cleanedLine.startsWith("event: sources")) continue; 

                    if (cleanedLine.startsWith("data:")){
                        const dataStr = cleanedLine.replace("data:", "").trim();

                        try{
                            const parsedData = JSON.parse(dataStr);
                            if (parsedData.session_info) {
                                const sessionInfo = parsedData.session_info;
                                isAutoSessionRef.current = true; // Turn on the flag to not load message history
                                setCurrentSessionId(sessionInfo.id);
                                setSessions(prev => [sessionInfo, ...prev])
                            }

                            if (Array.isArray(parsedData)){
                                currentSources = parsedData;
                                setMessages((prevMessage) => prevMessage.map((message) => 
                                    message.id === assistantMessageId ? {...message, sources: currentSources} : message
                                ));
                            } else if (parsedData.text) {// Check if text is from LLM
                                setMessages((prevMessage) => prevMessage.map((message) => 
                                    message.id === assistantMessageId ? {...message, content: message.content + parsedData.content} : message
                                ));
                            }
                        } catch (err) {
                            console.error("Error parsing JSON:", err);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching chat stream:", error);
            setMessages((prevMessage) => prevMessage.map((message) => 
                message.id == assistantMessageId ? {...message, text: "Error fetching chat stream"} : message));
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex w-full flex-row h-[calc(100vh-4rem)] overflow-hidden bg-background text-foreground relative">
            {/* Sidebar to manage chat sessions */}
            <aside className="hidden md:flex w-64 border-r bg-card flex-col shrink-0 h-full overflow-hidden">
                
                <div className="w-64 border-r bg-card p-4 flex flex-col justify-between">
                    <div className="p-2 border-b">
                        <Button onClick={handleCreateSession} className="w-full gap-2 flex items-center justify-center shadow-sm">
                            <Plus className="h-4 w-4" /> New chat session
                        </Button>
                    </div>
                    <div className="space-y-1 p-2 flex-1 overflow-y-auto">
                        {sessions.map((s) => (
                            <div
                                key={s.id}
                                className={`group flex items-center justify-between w-full rounded-lg px-3 py-1.5 transition-colors relative text-sm font-medium cursor-pointer
                                    ${currentSessionId === s.id ? "bg-secondary text-secondary-foreground" : "hover:bg-muted/60 text-muted-foreground"}`}
                                onClick={() => editingSessionId !== s.id && setCurrentSessionId(s.id)}
                            >
                                {editingSessionId === s.id ? (
                                    <Input
                                        value = {editTitleSession?.trim()}
                                        onChange={e => setEditTitleSession(e.target.value)}
                                        autoFocus
                                        className="h-7 text-xs px-2 py-0 border-primary focus-visible:ring-1 focus-visible:ring-primary bg-background"
                                        onBlur={()=> handleSaveNewSessionName(editingSessionId)}
                                        onKeyDown = {(e) => {
                                            if (e.key === "Enter") handleSaveNewSessionName(editingSessionId)
                                            if (e.key === "Escape") setEditingSessionId(null)
                                        }}
                                        onClick = {(e) => e.stopPropagation()} // Prevent the click event from bubbling up
                                    />
                                ): (
                                    <>
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                                            <span className="truncate">{s.title}</span>
                                        </div>

                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-muted">
                                                        <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-36">
                                                    <DropdownMenuItem onClick={(e) => handleRenameSession(e, s)} className="gap-2 cursor-pointer text-xs">
                                                        <Edit2 className="h-3.5 w-3.5" /> Rename
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => handleDeleteSession(s.id, e)} className="gap-2 cursor-pointer text-xs text-destructive focus:text-destructive">
                                                        <Trash2 className="h-3.5 w-3.5" /> Delete chat session
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </> 
                                )}
                            </div>
                        ))}
                    </div>
                    
                </div>
                
            </aside>
            <main className="flex flex-1 min-w-0 min-h-0 flex-col overflow-auto h-[calc(100vh-4rem)] relative bg-slate-50/50 dark:bg-zinc-900/20">
                <header className="border-b bg-background/95 backdrop-blur px-6 py-3 flex items-center gap-3 pt-1 shrink-0 h-16">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs"
                            onClick={() => router.push("/dashboard")}>
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <Bot className="h-6 w-6 text-primary" />
                    <div className="min-w-0">
                        <h1 className="text-xl font-bold tracking-tight truncate">AI Assistant (RAG)</h1>
                        <p className="text-xs text-muted-foreground">
                            {
                                document_ids ? (
                                    <span className="text-primary font-medium">
                                        <FileText className="h-3 w-3" />
                                        Question and answer based on these documents: {`ID ${document_ids}`}
                                    </span>
                                ): document_id ? (
                                    <span className="text-amber-500 font-medium flex items-center gap-1 mt-0.5">
                                        <FileText className="h-3 w-3" /> Question and answer based on document: {title || `ID ${document_id}`}
                                    </span>
                                ): (
                                    <>Question and answer based on all of your documents</>
                                )
                            }
                        </p>
                    </div>
                </header>
                
                {/* Chat messages */}
                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 md:px-8 space-y-6 custom-scrollbar pb-36">
                    {(!currentSessionId || messages.length === 0) ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                        <Bot className="h-12 w-12 text-muted-foreground/40" />
                        <div>
                            <h2 className="text-xl font-bold text-foreground tracking-tight">What can I help you today?</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Send questions to ask AI Assistant {document_id ? "about this document...": "about all of your documents..."}(RAG)
                            </p>
                        </div>
                    </div>
                    ) : (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {messages.map((msg) => (
                            <div
                            key={msg.id}
                            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                {msg.role === "assistant" && (
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <Bot className="h-4 w-4 text-primary" />
                                    </div>
                                )}
                                
                                <div className="flex flex-col max-w-[85%] md:max-w-[75%] gap-2">
                                    <div
                                    className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                        msg.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                        : "bg-muted text-foreground rounded-tl-none border"
                                    }`}>
                                    {msg.content || (isLoading && msg.role === "assistant" && msg.content === "" ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    ) : msg.content)}
                                    </div>

                                    {/* Show the sources if it is available */}
                                    {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-1.5">
                                        {msg.sources.map((source) => (
                                        <div
                                            key={source.id}
                                            className="flex items-center gap-1 text-[11px] bg-background border text-muted-foreground px-2 py-0.5 rounded-md shadow-sm"
                                        >
                                            <FileText className="h-3 w-3 text-primary" />
                                            <span className="truncate max-w-37.5 font-medium">Context: {source.title}</span>
                                        </div>
                                        ))}
                                    </div>
                                    )}
                                </div>

                                {msg.role === "user" && (
                                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                                        <User className="h-4 w-4 text-primary-foreground" />
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    )}
                </div>
                        {/* Place for inputing message */}
                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-background 
                                via-background/90 to-transparent pt-10 pb-6 px-4 md:px-8 max-w-full mx-auto z-10 shrink-0">
                    <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 border-t pt-4">
                            <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={document_id ? "Send questions about your documents...": "Send questions..."}
                            className="flex-1"
                            disabled={isLoading}
                            />
                            <Button type="submit" disabled={isLoading || !input.trim()}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                    </form>
                    <p className="text-[10px] text-center text-muted-foreground mt-2">
                        The answer AI gave may not be 100% accurate. Please check it carefully.
                    </p>
                </div>
            </main>           
        </div>
        
    )

}

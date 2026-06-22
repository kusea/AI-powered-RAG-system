import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchChatStreamAPI } from "@/services/chatAPI";
import { FileText, Loader2, Send, User, Bot, Link, ArrowLeft} from "lucide-react";
import { useRouter } from "next/router";

interface SourceDocs {
    id: string;
    title: string;
}

interface Message {
    id: string;
    text: string;
    role: "user" | "assistant";
    sources: SourceDocs[];
}

export default function ChatAssistant(){
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const router = useRouter();
    const { document_id, title } = router.query;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect (
        () => scrollToBottom(),
        [messages]
    );

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
                text: userQuery,
                role: "user",
                sources: [],
            },
            {
                id: assistantMessageId,
                text: "",
                role: "assistant",
                sources: []
            }
        ]);

        try {
            const docIdNum = document_id ? Number(document_id) : undefined;
            const stream = await fetchChatStreamAPI({
                query: userQuery, 
                document_ids: docIdNum ? [docIdNum] : []
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
                            if (Array.isArray(parsedData)){
                                currentSources = parsedData;
                                setMessages((prevMessage) => prevMessage.map((message) => 
                                    message.id === assistantMessageId ? {...message, sources: currentSources} : message
                                ));
                            } else if (parsedData.text) {// Check if text is from LLM
                                setMessages((prevMessage) => prevMessage.map((message) => 
                                    message.id === assistantMessageId ? {...message, text: message.text + parsedData.text} : message
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
        <div className="flex flex-col h-screen max-w-4xl mx-auto bg-background text-foreground p-4">
            <header className="border-b pb-4 mb-4 flex items-center gap-2">
                <Bot className="h-6 w-6 text-primary" />
                <div>
                    <h1 className="text-xl font-bold tracking-tight">AI Assistant (RAG)</h1>
                    <p className="text-xs text-muted-foreground">
                        {
                            document_id ? (
                                <span className="text-amber-500 font-medium flex items-center gap-1 mt-0.5">
                                    <FileText className="h-3 w-3" /> Question and answer based on document: {title || `ID ${document_id}`}
                                </span>
                            ): (
                                <>Question and answer based on all of your documents</>
                            )
                        }
                    </p>
                </div>

                <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                </Link>
            </header>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                    <Bot className="h-12 w-12 text-muted-foreground/40" />
                    <p className="text-sm">
                        Send questions to ask AI Assistant {document_id ? "about this document...": "about all of your documents..."}(RAG)
                    </p>
                </div>
                ) : (
                messages.map((msg) => (
                    <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        {msg.role === "assistant" && (
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Bot className="h-4 w-4 text-primary" />
                            </div>
                        )}
                        
                        <div className="flex flex-col max-w-[80%] gap-1">
                            <div
                            className={`rounded-2xl p-4 text-sm ${
                                msg.role === "user"
                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                : "bg-muted text-foreground rounded-tl-none border"
                            }`}
                            >
                            {msg.text || (isLoading && msg.role === "assistant" && msg.text === "" ? (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : msg.text)}
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
                )))}
                <div ref={messagesEndRef} />
            </div>

            {/* Place for inputing message */}
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
        </div>
    )

}

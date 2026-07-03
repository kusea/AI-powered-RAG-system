import React, { useState, useEffect} from "react";
import Link from "next/link";
import { useQuery, useQueryClient} from "@tanstack/react-query";
import { useRouter } from "next/router";
import { LogOut, Settings, Database, MessageSquare, Share2, Bell, UserIcon, Trash2} from "lucide-react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "./ui/dropdownMenu";
import { fetchEventSource } from "@microsoft/fetch-event-source";

import { getAuthToken } from "../services/authAPI";

interface NotificationItem {
    id: number;
    text: string;
    type: "receiver" | "sender";
    delta_time: string;
}

export default function NavBar() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    const {data: token} = useQuery({
        queryKey: ["authToken"],
        queryFn: getAuthToken,
        staleTime: 0
    });

    const isLoggedIn = !!token;

    const handleLogout = () => {
        localStorage.removeItem("token");
        queryClient.invalidateQueries({queryKey: ["authToken"]});
        router.push("/dashboard");
    };

    useEffect(() => {
        /* const tok = (typeof window !== "undefined") ? localStorage.getItem("token") : null;
        if (!tok || tok === "undefined") {
            console.warn("Token is not available. Have to delay the SSE connection...." + tok);
            return;
        } */

        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const ctrl = new AbortController();
        const connectSSE = async () => {
            try {
                await fetchEventSource(`${API_URL}/notification/stream`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Accept": "text/event-stream"
                    },
                    signal: ctrl.signal,
                    async onopen(response) {
                        if (response.ok && response.headers.get("Content-Type") === "text/event-stream") {
                            console.log("SSE connection opened");
                            return;
                        }
                        if (response.status == 401) {
                            console.warn("Token is expired or invalid. Please login again.");
                            ctrl.abort(); // Abort the SSE connection
                            localStorage.removeItem("token");
                            router.push("/login");
                            return;
                        }
                        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                            ctrl.abort();
                            throw new Error("SSE connection failed with status " + response.status);
                        }
                    },
                    onmessage(event) {
                        if (event.data) {
                            try {
                                const newNotif: NotificationItem = JSON.parse(event.data);
                                if (newNotif.text) setNotifications((prevNotifications) => [...prevNotifications, newNotif]);
                            } catch (error) {
                                console.error("Error parsing SSE message:", error);
                            }
                        }
                    },
                    onerror(error) {
                        console.error("SSE connection error: ", error);
                        return;
                    },
                    onclose() {
                        console.log("SSE connection closed");
                    }
                });
            } catch (error) {
                console.error("Error connecting to SSE:", error);
            }
        };

        connectSSE();
        return () => ctrl.abort();
    }, [router, token]);

    return (
        <nav className="bg-blue-400 text-white backdrop-blur sticky top-0 z-50 border-b">
            <div className="flex h-16 items-center px-6 max-w-7xl justify-between">
                <div className="flex items-stretch">  
                    <div className="flex items-center space-x-2 cursor-pointer mr-4"
                        onClick={() => router.push("/dashboard")}>
                        <Database className="h-6 w-6 text-primary"/>
                        <span className="font-bold tracking-tight text-lg text-white">RAG knowledge Hub</span>
                    </div>
                
                    <nav className="flex h-16">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className={`flex items-center gap-2 px-5 h-full text-sm font-medium transition-colors
                                ${router.pathname === "/dashboard"
                                    ? "bg-blue-800 text-white"
                                    : "text-blue-100 hover:bg-blue-700 hover:text-white"
                                }`}>
                            Dashboard
                        </button>

                        <button
                            onClick={() => router.push("/chat")}
                            className={`flex items-center gap-2 px-5 h-full text-sm font-medium transition-colors
                                ${router.pathname === "/chat"
                                    ? "bg-blue-800 text-white"
                                    : "text-blue-100 hover:bg-blue-700 hover:text-white"
                                }`}>
                            <MessageSquare className="h-4 w-4" />
                            AI Assistant
                        </button>
                        
                        <button
                            onClick={() => router.push("/share-to-me")}
                            className={`flex items-center gap-2 px-5 h-full text-sm font-medium transition-colors
                                ${router.pathname === "/share-to-me"
                                    ? "bg-blue-800 text-white"
                                    : "text-blue-100 hover:bg-blue-700 hover:text-white"
                                }`}>
                            <Share2 className="h-4 w-4" />
                            Shared to me
                        </button>
                    </nav>
                </div>

                <div className="flex items-center space-x-4 pl-4 text-sm">
                    {!isLoggedIn ? (
                        <div>
                            <Link href="/login" passHref><Button className="hover:bg-muted/20 cursor-pointer" variant = "ghost" size = "sm">Login</Button></Link>
                            <Link href="/signup" passHref><Button className="hover:bg-muted hover:text-foreground cursor-pointer" size = "sm">Sign Up</Button></Link>
                        </div>
                    ): (
                        <div className = "flex items-center space-x-4">
                            <button
                                title = "Recycle Bin"
                                className = {`text-sm font-medium flex items-center gap-1 ${router.pathname === '/documents/trash' ? 'text-primary': 'text-muted-foreground'}`}
                                onClick = {() => router.push('/documents/trash')}>
                                    <Trash2 className="h-5 w-5" />
                                </button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="relative">
                                        <Bell className="h-5 w-5"/>
                                        {/* Show a red dot if there are notifications */}
                                        {notifications.length > 0 && (
                                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent className="w-80" align="end">
                                    <DropdownMenuLabel>Share notifications</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {notifications.length === 0 ? (
                                        <DropdownMenuItem className="text-muted-foreground cursor-default">
                                            No new notifications
                                        </DropdownMenuItem>): (
                                            <div className = "max-h-72 overflow-y-auto">
                                                {notifications.map((notif) =>(
                                                    <DropdownMenuItem key = {notif.id} className = "flex flex-col items-start p-3 gap-1 cursor-pointer">
                                                        <div className = "text-sm text-foreground">{notif.text}</div>
                                                        <span className = "text-xs text-muted-foreground">{notif.delta_time}</span>
                                                    </DropdownMenuItem>
                                                ))}
                                            </div>
                                        )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-muted">
                                        <UserIcon className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>My Account</DropdownMenuLabel>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                                        <Settings className="mr-2 h-4 w-4" />
                                        User Profile
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}
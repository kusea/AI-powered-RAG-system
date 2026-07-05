import React, { useState, useEffect} from "react";
import Link from "next/link";
import { useQuery, useQueryClient} from "@tanstack/react-query";
import { useRouter } from "next/router";
import { LogOut, Settings, Database, MessageSquare, Share2, Bell, UserIcon, Trash2, X} from "lucide-react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "./ui/dropdownMenu";
import { fetchEventSource } from "@microsoft/fetch-event-source";

import { getAuthToken } from "../services/authAPI";

interface NotificationItem {
    id: number;
    text: string;
    type: "receiver" | "sender";
    delta_time: string;
    seen: boolean;
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
    const unseenCount = notifications.filter(notification => !notification.seen).length;
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

        if (router.pathname === "/login" || router.pathname === "/signup") {
            console.log("Not connecting to SSE on login or signup page.");
            return;
        }

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
                            throw new Error("Token is expired or invalid. Please login again.");
                        }
                        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                            ctrl.abort();
                            throw new Error("SSE connection failed with status " + response.status);
                        }
                    },
                    onmessage(event) {
                        if (event.data) {
                            let data = event.data;
                            if (data.startsWith("data:")) {
                                data = data.replace("data:", "");
                            }
                            try {
                                const newNotif = JSON.parse(data.trim());
                                console.log(`New notification: ${newNotif.text}`)
                                if (newNotif.text) {
                                    const mappedNotif: NotificationItem = {
                                        id: newNotif.id || Date.now(),
                                        text: newNotif.text,
                                        type: newNotif.type,
                                        delta_time: newNotif.delta_time,
                                        seen: false
                                    }
                                    setNotifications((prevNotifications) => [mappedNotif, ...prevNotifications]);
                                }
                            } catch (error) {
                                console.error(`Error parsing SSE data: ${error} with data: ${data}`);
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

    const handleMarkAsSeen = (id: number) => {
        setNotifications((prevNotifications) => prevNotifications.map((notification) => notification.id === id ? {...notification, seen: true} : notification));
    };

    const handleDeleteNotifications = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();  // Prevent click event affecting the handleMarkAsSeen function
        setNotifications((prevNotifications) => prevNotifications.filter(notification => notification.id !== id));
    }

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
                            Sharing Center
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
                                        {unseenCount > 0 && (
                                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent className="w-84 max-w-sm" align="end">
                                    <DropdownMenuLabel className="flex justify-between items-center">
                                        <span>Share notifications</span>
                                        {unseenCount > 0 && (
                                            <span className="bg-destructive text-white text-10px px-1.5 py-0.5 rounded-full font-bold">
                                                {unseenCount} new
                                            </span>
                                        )}
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {notifications.length === 0 ? (
                                        <DropdownMenuItem className="text-muted-foreground cursor-default">
                                            No new notifications
                                        </DropdownMenuItem>): (
                                            <div className = "max-h-72 overflow-y-auto">
                                                {notifications.map((notif) =>(
                                                    <DropdownMenuItem 
                                                        key = {notif.id} 
                                                        onClick = {() => handleMarkAsSeen(notif.id)}
                                                        className = {`flex items-center justify-between p-3 gap-2 border-b last-border-0 cursor-ponter transition-all duration-200
                                                        ${notif.seen ? 'bg-background opacity-60 text-muted-foreground' : 'bg-blue-50/50 dark:bg-blue-950/20 font-medium text-foreground'}`}>
                                                            <div className = "flex flex-col items-start gap-0.5 flex-1 min-w-0">
                                                                <div className = "text-sm text-foreground">{notif.text}</div>
                                                                <span className = "text-xs text-muted-foreground">{notif.delta_time}</span>
                                                            </div>

                                                            <button
                                                                title="Delete Notification"
                                                                onClick = {(e) => handleDeleteNotifications(e, notif.id)}
                                                                className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-muted transition-colors shrink-0"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>

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
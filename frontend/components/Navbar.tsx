import React, { useState, useEffect} from "react";
import Link from "next/link";
import { useQuery, useQueryClient} from "@tanstack/react-query";
import { useRouter } from "next/router";
import { LogOut, Settings, Database, MessageSquare, Share2, Bell, UserIcon, Trash2, X, FolderOpen, LayoutDashboard, Menu } from "lucide-react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "./ui/dropdownMenu";
import { fetchEventSource } from "@microsoft/fetch-event-source";

import { getAuthToken } from "../services/authAPI";

interface NotificationItem {
    id: number;
    text: string;
    type: "received" | "sent";
    created_at: string;
    seen: boolean;
}

export default function NavBar() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [now, setNow] = useState(() => Date.now());

    const {data: token} = useQuery({
        queryKey: ["authToken"],
        queryFn: getAuthToken,
        staleTime: 0
    });
    const unseenCount = notifications.filter(notification => !notification.seen).length;
    const isLoggedIn = !!token;

    const navLinks = [
        {href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="mr-2 h-4 w-4" />},
        {href: "/chat", label: "Chat", icon: <MessageSquare className="mr-2 h-4 w-4" />},
        {href: "/documents/all", label: "All Documents", icon: <FolderOpen className="mr-2 h-4 w-4" />},
        {href: "/share-to-me", label: "Share documents", icon: <Share2 className="mr-2 h-4 w-4" />},
    ]

    const handleLogout = () => {
        localStorage.removeItem("token");
        queryClient.invalidateQueries({queryKey: ["authToken"]});
        router.push("/dashboard");
    };

    const getDeltaTimeLabel = (time: string) => {
        const past = new Date(time).getTime();

        const diffInSeconds = Math.floor((now - past) / 1000);
        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        return new Date(time).toLocaleDateString('vi-VN');
    }

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(Date.now());
        }, 30000);
        return () => clearInterval(timer);
    }, []);

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
                                        created_at: newNotif.created_at,
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
                <div className="flex items-stretch gap-4">
                {/* 1. KHI MÀN HÌNH NHỎ (< md): Hiện Dropdown điều hướng góc trái */}
                    <div className="block md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 mt-2">
                                {navLinks.map((link) => (
                                    <DropdownMenuItem key={link.href} asChild>
                                        <Link href={link.href} className={`flex items-center w-full
                                        ${router.pathname === link.href ? "bg-muted text-foreground" : ""}`}>
                                            {link.icon}
                                            <span>{link.label}</span>
                                        </Link>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    
                    <Link href="/dashboard" className="hidden md:flex items-center font-bold text-sm tracking-wide text-foreground">
                        <Database className="h-5 w-5 text-blue-600" />
                        <span>RAG SYSTEM</span>
                    </Link>

                    <div className="hidden md:flex items-center">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-2 px-5 h-16 text-sm font-medium transition-colors
                                ${router.pathname === link.href ? "bg-muted/60 text-foreground" : "text-blue-100 hover:bg-blue-700 hover:text-white"}`}
                            >
                                {link.icon} 
                                <span>{link.label}</span>
                            </Link>
                        ))}
                    </div>
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
                                                                <span className = "text-xs text-muted-foreground">{getDeltaTimeLabel(notif.created_at)}</span>
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
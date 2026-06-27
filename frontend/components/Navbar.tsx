import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient} from "@tanstack/react-query";
import { useRouter } from "next/router";
import { User, LogOut, Settings, Trash2, Database, MessageSquare } from "lucide-react";
import { Button } from "./ui/button";

import { getAuthToken } from "../services/authAPI";

export default function NavBar() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const {data: token} = useQuery({
        queryKey: ["authToken"],
        queryFn: getAuthToken,
        staleTime: 0
    });

    const isLoggedIn = !!token;

    const handleLogout = () => {
        localStorage.removeItem("token");
        queryClient.invalidateQueries({queryKey: ["authToken"]});
        setIsDropdownOpen(false);
        router.push("/dashboard");
    };

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
                        
                    </nav>
                </div>

                <div className="flex items-center space-x-4 pl-4 text-sm">
                    {!isLoggedIn ? (
                        <div>
                            <Link href="/login" passHref><Button className="hover:bg-muted/20 cursor-pointer" variant = "ghost" size = "sm">Login</Button></Link>
                            <Link href="/signup" passHref><Button className="hover:bg-muted hover:text-foreground cursor-pointer" size = "sm">Sign Up</Button></Link>
                        </div>
                    ): (
                        <div>
                            <button title="User Settings"
                                    onClick = {() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="h-9 w-9 rounded-full bg-origin-content border-primary/20 
                                    border-2 flex items-center justify-center focus:outline-none hover:bg-primary/20 transition-colors">
                                <User className="h-5 w-5 text-primary" />
                            </button>

                            {isDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                                    <div className="absolute right-0 mt-2 w-56 bg-popover rounded-xl border shadow-lg py-1.5 z-20 text-sm">
                                    <button onClick={() => router.push("/profile")} className="w-full px-3 py-2 text-black hover:bg-muted text-left flex items-center gap-2">
                                        <Settings className="h-4 w-4" /> User Profile
                                    </button>

                                    <button onClick={() => { alert("Hãy nhấn nút 'Xóa' trực tiếp bên cạnh từng tài liệu ở danh sách phía dưới!"); setIsDropdownOpen(false); }}
                                            className="w-full px-3 py-2 hover:bg-muted text-left flex items-center gap-2 text-amber-600">
                                        <Trash2 className="h-4 w-4" /> Delete uploaded files
                                    </button>

                                    <button onClick={handleLogout} className="w-full px-3 py-2 hover:bg-destructive/10 text-destructive text-left flex items-center gap-2 font-semibold">
                                        <LogOut className="h-4 w-4" /> Logout
                                    </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}
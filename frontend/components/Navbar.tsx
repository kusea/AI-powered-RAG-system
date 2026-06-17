import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient} from "@tanstack/react-query";
import { useRouter } from "next/router";
import { User, LogOut, Settings, Trash2} from "lucide-react";
import { Button } from "./ui/button";

import { getAuthToken } from "../services/authAPI";

export default function NavBar() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const {data: token} = useQuery({
        queryKey: ["authToken"],
        queryFn: getAuthToken,
        staleTime: Infinity
    });

    const isLoggedIn = !!token;

    const handleLogout = () => {
        localStorage.removeItem("token");
        queryClient.invalidateQueries({queryKey: ["authToken"]});
        setIsDropdownOpen(false);
        router.push("/dashboard");
    };

    return (
        <nav className="w-full bg-background/95 border-b backdrop-blur support-backdrop-blur:bg-background/60 sticky 
                        top-0 z-50 px-6 py-3 items-center justify-between flex">
            <div className="flex items-center space-x-2 cursor-pointer"
                onClick={() => router.push("/dashboard")}>
                <div className="bg-primary text-primary-foreground p-1.5 rounded-lg font-bold text-sm">
                    RAG System
                </div>
                <span className="font-bold hidden sm:inline-block">AI knowledge Hub</span>
            </div>

            <div className="flex items-center space-x-4 justify-end relative">
                {!isLoggedIn ? (
                    <div>
                        <Link href="/login" passHref><Button className="hover:bg-muted/20 cursor-pointer" variant = "ghost" size = "sm">Login</Button></Link>
                        <Link href="/signup" passHref><Button className="hover:bg-muted hover:text-foreground cursor-pointer" size = "sm">Sign Up</Button></Link>
                    </div>
                ): (
                    <div>
                        <button title="User Settings"
                                onClick = {() => setIsDropdownOpen(!isDropdownOpen)}
                                className="h-9 w-9 rounded-full bg-primary/10 border-primary/20 
                                border-2 flex items-center justify-center focus:outline-none hover:bg-primary/20 transition-colors">
                            <User className="h-5 w-5 text-primary" />
                        </button>

                        {isDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                                <div className="absolute right-0 mt-2 w-56 bg-popover rounded-xl border shadow-lg py-1.5 z-20 text-sm">
                                <button onClick={() => setIsDropdownOpen(false)} className="w-full px-3 py-2 hover:bg-muted text-left flex items-center gap-2">
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

        </nav>
    )
}
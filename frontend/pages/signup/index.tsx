import React, {useState} from "react";
import {authApi} from "@/services/authAPI";
import {useRouter} from "next/router";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {LayoutDashboard, Lock, Mail, Loader2, User, Eye, EyeOff} from "lucide-react";
import Link from "next/link";
import axios from "axios";

export default function Signup() {
    const [email, setEmail] = useState("");
    const [username, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleRegister: React.ComponentProps<"form">["onSubmit"] = async (e)=>{
        e.preventDefault();
        setLoading(true);
        setError("");

        try{
            const data = await authApi.register({email, password, username});
            localStorage.setItem("token", data.access_token);
            router.push("/dashboard");
        } catch(err: unknown){
            if (axios.isAxiosError(err) && err.response?.data) {
                const detail = err.response?.data.detail;
                setError(detail || "Login failed. Please try again.");
            }
            else {
                setError("An unexpected error happened. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
        <div className="w-full max-w-md space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            
            {/* Header */}
            <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-50">
                <LayoutDashboard className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Create an account
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Start building your custom AI knowledge base in less than a minute
            </p>
            </div>

            {error && (
            <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-lg dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">
                {error}
            </div>
            )}

            {/* Form Register */}
            <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Username</label>
                <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <Input
                    type="text"
                    placeholder="John Doe"
                    className="pl-10"
                    value={username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserName(e.target.value)}
                />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email address</label>
                <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <Input
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    required
                />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
                <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <Input
                    type={showPass ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    required
                />
                <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2 top-2 h-4 w-4 text-zinc-500 dark:text-zinc-400 transition-colors"
                >
                    {showPass ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Get started"}
            </Button>
            </form>

            {/* Navigation */}
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-zinc-900 dark:text-zinc-50 hover:underline">
                Sign in instead
            </Link>
            </p>
        </div>
        </div>
    );
    
}

import React, { useState } from "react";
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { authApi } from "@/services/authAPI";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LayoutDashboard, Lock, Mail, Loader2, Eye, EyeOff} from "lucide-react";
import Link from "next/link";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPass, setShowPass] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Thay thế FormEvent bằng kiểu trích xuất trực tiếp từ thuộc tính onSubmit của thẻ form
  const handleCredentialsLogin: React.ComponentProps<"form">["onSubmit"] = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const data = await authApi.login({ email, password });
      localStorage.setItem("token", data.access_token);
      void router.push("/dashboard"); 
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const detail = err.response.data.detail;
        setError(detail || "Login failed. Please try again.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse): Promise<void> => {
    if (!credentialResponse.credential) {
      setError("Google authentication failed. No token provided.");
      return;
    }
    
    setLoading(true);
    try {
      const data = await authApi.loginWithGoogle(credentialResponse.credential);
      localStorage.setItem("token", data.access_token);
      void router.push("/dashboard");
    } catch (err: unknown) {
      setError("Google authentication failed on server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
        <div className="w-full max-w-md space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-50">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Welcome back
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Sign in to continue exploring your AI knowledge base
            </p>
          </div>

          {error && (
            <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-lg dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleCredentialsLogin} className="space-y-4">
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
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  className = "absolute right-2 top-2 text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300 transition-colors" 
                  onClick={() => setShowPass(!showPass)}>
                    {showPass ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign in with Email"}
            </Button>
          </form>

          <div className="relative flex py-2 items-center text-xs uppercase text-zinc-400">
            <div className="grow border-t border-zinc-200 dark:border-zinc-800"></div>
            <span className="shrink mx-4 text-zinc-400">Or continue with</span>
            <div className="grow border-t border-zinc-200 dark:border-zinc-800"></div>
          </div>

          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google login failed")}
              theme="outline"
              width="400"
            />
          </div>

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-zinc-900 dark:text-zinc-50 hover:underline">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
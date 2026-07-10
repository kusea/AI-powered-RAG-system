import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@/components/theme-provider";
import { useState, useEffect} from "react";
import { QueryClient, QueryClientProvider} from "@tanstack/react-query";
import NavBar from "@/components/Navbar";  
import { useRouter } from "next/router";
import { Loader2 } from "lucide-react"
import Footer from "@/components/Footer";
import { GoogleOAuthProvider } from "@react-oauth/google";


export default function App({ Component, pageProps }: AppProps) {
    // Create the client query respectively to each session of application
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false, // disable unnecessary refetch when switch tab
                retry: 1
            }
        }}
    ));

    const router = useRouter();
    const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

    useEffect(() => {
        const checkAuthStatus = () => {
        const token = localStorage.getItem("token");
            const publicRoutes = ["/login", "/signup"]; 
            const isPublicRoute = publicRoutes.includes(router.pathname);

            if (token) {
                if (isPublicRoute) router.push("/chat"); // Move to the chat page
                else setCheckingAuth(false); // Allow to see other pages
            } else {
                if (!isPublicRoute && router.pathname !== "/") router.push("/login"); // Force to move user to the login page
                else setCheckingAuth(false);
            }
        };

        // Chạy kiểm tra mỗi khi đường dẫn thay đổi
        checkAuthStatus();
    }, [router.pathname, router]);

    // Màn hình chờ (Loading Splash) giúp giao diện không bị giật nháy khi chuyển hướng ngầm
    if (checkingAuth) {
        return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-600 dark:text-zinc-400" />
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Verifying session...</p>
        </div>
        );
    }


    return (
        <QueryClientProvider client = {queryClient}>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
                <div className="h-screen overflow-auto bg-background text-foreground flex flex-col">
                    <GoogleOAuthProvider clientId = {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
                        <NavBar />
                        <div className = "flex-1 w-full pb-12">
                            <Component {...pageProps} />
                        </div>
                        <Footer />
                    </GoogleOAuthProvider>
                </div>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
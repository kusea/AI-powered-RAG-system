import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@/components/theme-provider";
import { useState } from "react";
import { QueryClient, QueryClientProvider} from "@tanstack/react-query";
import NavBar from "@/components/Navbar";  


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


    return (
        <QueryClientProvider client = {queryClient}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <div className="min-h-screen bg-background text-foreground flex flex-col">
                    <NavBar />
                    <Component {...pageProps} />
                </div>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
import React from "react";
import Link from "next/link";
import { FileText, HelpCircle } from "lucide-react";
import { FaGithub } from "react-icons/fa";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full border-t bg-card text-card-foreground mt-auto">
        <div className="mx-auto max-w-5xl px-6 py-6 md:flex md:items-center md:justify-between lg:px-8">
            {/* Bản quyền */}
            <div className="flex justify-center md:order-2 space-x-6 text-sm text-muted-foreground">
                <Link href="/dashboard" className="hover:text-foreground flex items-center gap-1 transition-colors">
                    <FileText className="h-4 w-4" /> Document
                </Link>
                <a 
                    href="https://github.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-foreground flex items-center gap-1 transition-colors"
                >
                    <FaGithub className="h-4 w-4" /> GitHub
                </a>
                <Link href="/help" className="hover:text-foreground flex items-center gap-1 transition-colors">
                    <HelpCircle className="h-4 w-4" /> Help
                </Link>
            </div>
            
            {/* Thông tin thêm */}
            <div className="mt-4 md:order-1 md:mt-0 text-center md:text-left">
            <p className="text-xs leading-5 text-muted-foreground">
                &copy; {currentYear} AI-powered RAG System.
            </p>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                Mangement and query system based on LLM structure.
            </p>
            </div>
        </div>
        </footer>
    );
}
import React, { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Table, Loader2, ExternalLink } from "lucide-react";

interface SheetsState {
    [sheetName: string] : string;
}

export const ExcelViewer: React.FC<{ fileUrl: string; textContent: string }> = ({ fileUrl }) => {
    const [sheets, setSheets] = useState<SheetsState>({});
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [activeSheet, setActiveSheet] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Read excel file from backend and transfer it to 2-dimension array
        fetch(fileUrl)
        .then((res) => res.arrayBuffer())
        .then((ab) => {
            const wb = XLSX.read(ab, { type: "array", cellStyles: true, cellNF: true, cellDates: true });
            const result: SheetsState = {};
            
            wb.SheetNames.forEach((sheetName) => {
                const worksheet = wb.Sheets[sheetName];
                // Chuyển sheet thành mảng 2 chiều chứa các hàng và cột
                result[sheetName] = XLSX.utils.sheet_to_html(worksheet, {
                    editable: false, 
                    header: "",
                    footer: ""
                });
            });
            setLoading(true);
            setSheetNames(wb.SheetNames);
            setSheets(result);
            setActiveSheet(wb.SheetNames[0]);
        })
        .catch((err) => console.error("Error reading Excel file", err))
        .finally(() => setLoading(false));
    }, [fileUrl]);

    useEffect(() => {
        if (!loading && activeSheet && sheets[activeSheet] && containerRef.current) {
            containerRef.current.innerHTML = sheets[activeSheet];
            const tableElement = containerRef.current.querySelector("table");
            if (tableElement) {
                tableElement.className = "min-w-full text-[11px] font-sans border-collapse excel-rendered-table";
                
                const allCells = tableElement.querySelectorAll("td, th");
                allCells.forEach((cell) => {
                    cell.classList.add("border", "border-zinc-300", "dark:border-zinc-700", "p-2", "text-foreground");
                });
            }
        }
    }, [loading, activeSheet, sheets]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 border border-dashed rounded-xl gap-2 text-xs text-muted-foreground animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                <span>Loading original sheets...</span>
            </div>
        );
    }

    if (sheetNames.length === 0 || !activeSheet) {
        return <div className="p-4 text-xs text-muted-foreground text-center">No sheets found</div>;
    }

    return (
        <div className="flex flex-col h-full bg-background border rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 bg-muted/40 p-2 border-b overflow-x-auto">
                <Table className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <div className="flex gap-1">
                    {Object.keys(sheets).map((name) => (
                    <button
                        key={name}
                        onClick={() => setActiveSheet(name)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        activeSheet === name ? "bg-emerald-600 text-white shadow" : "hover:bg-muted text-muted-foreground"
                        }`}
                    >
                        {name}
                    </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-auto max-h-150 bg-zinc-50 dark:bg-zinc-950 p-2">
                <div 
                    ref={containerRef} 
                    className="excel-container-wrapper overflow-x-auto w-full"
                />
            </div>

            <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border-t">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                    <Table className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Excel Interactive Viewer</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <a 
                        href={fileUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-[11px]"
                        title="Open in new tab"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Open in new tab</span>
                    </a>
                </div>
            </div>

            <style jsx global>{`
                .excel-rendered-table {
                    border-collapse: collapse !important;
                    width: max-content;
                    min-width: 100%;
                }
                .excel-rendered-table td {
                    border: 1px solid #d4d4d8 !important; /* Viền đen/xám nhạt tiêu chuẩn */
                    padding: 6px 10px !important;
                    white-space: normal;
                    word-break: break-word;
                }
                .dark .excel-rendered-table td {
                    border: 1px solid #3f3f46 !important; /* Viền tương thích chế độ Dark Mode */
                }
                /* Giữ nguyên định dạng màu sắc hoặc chữ in đậm do thư viện gán trực tiếp vào thuộc tính style inline */
                .excel-rendered-table td[style] {
                    font-weight: inherit;
                }
            `}</style>
        </div>
    );
};
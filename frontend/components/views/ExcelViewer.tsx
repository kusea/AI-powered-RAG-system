import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Table } from "lucide-react";

type ExcelCellType = string | number | boolean | Date | null | undefined;

interface SheetsState {
    [sheetName: string] : ExcelCellType[][];
}

export const ExcelViewer: React.FC<{ fileUrl: string; textContent: string }> = ({ fileUrl }) => {
    const [sheets, setSheets] = useState<SheetsState>({});
    const [activeSheet, setActiveSheet] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Read excel file from backend and transfer it to 2-dimension array
        fetch(fileUrl)
        .then((res) => res.arrayBuffer())
        .then((ab) => {
            const wb = XLSX.read(ab, { type: "array" });
            const result: SheetsState = {};
            
            wb.SheetNames.forEach((sheetName) => {
            const worksheet = wb.Sheets[sheetName];
            // Chuyển sheet thành mảng 2 chiều chứa các hàng và cột
            result[sheetName] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
            });
            
            setLoading(true);
            setSheets(result);
            setActiveSheet(wb.SheetNames[0]);
        })
        .catch((err) => console.error("Lỗi đọc file excel", err))
        .finally(() => setLoading(false));
    }, [fileUrl]);

    if (!activeSheet) return <div className="p-4 text-xs text-muted-foreground animate-pulse">Loading sheet...</div>;

    const maxCols = Math.max(...sheets[activeSheet].map(row => row.length), 0);

    return (
        <div className="flex flex-col h-full bg-background border rounded-xl overflow-hidden shadow-sm">
            {/* Thanh điều hướng các Sheet như Microsoft Excel thực tế */}
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

            {/* Grid hiển thị bảng dữ liệu nâng cao */}
            <div className="flex-1 overflow-auto max-h-150 relative bg-zinc-50 dark:bg-zinc-950">
                <table className="w-full text-left border-collapse text-[11px] font-mono table-fixed">
                    <thead>
                        <tr className="bg-muted/80 sticky top-0 z-10 border-b shadow-sm">
                            {/* Ô góc trên cùng bên trái */}
                            <th className="p-1.5 border-r border-b bg-muted/90 w-10 text-center text-muted-foreground font-bold"></th>
                            {Array.from({ length: maxCols }).map((_, index) => (
                                <th key={index} className="p-1.5 border-r border-b font-semibold text-center text-muted-foreground bg-muted/90 min-w-25 max-w-50">
                                    {String.fromCharCode(65 + (index % 26)) + (index >= 26 ? Math.floor(index / 26) : "")}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sheets[activeSheet].map((row: ExcelCellType[], rowIndex: number) => (
                            <tr key={rowIndex} className="border-b hover:bg-emerald-500/5 transition-colors group">
                                {/* Cột số thứ tự dòng */}
                                <td className="p-1.5 border-r bg-muted/40 sticky left-0 text-center font-bold text-muted-foreground group-hover:bg-muted/70 w-10 z-0">
                                    {rowIndex + 1}
                                </td>
                                {Array.from({ length: maxCols }).map((_, cellIndex) => {
                                    const cell = row[cellIndex];
                                    const isNumber = typeof cell === "number";
                                    return (
                                        <td 
                                            key={cellIndex} 
                                            className={`p-1.5 border-r whitespace-nowrap overflow-hidden text-ellipsis text-foreground border-muted/50 ${
                                                isNumber ? "text-right font-sans text-blue-600 dark:text-blue-400" : "text-left"
                                            }`}
                                        >
                                            {cell !== undefined && cell !== null ? String(cell) : ""}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
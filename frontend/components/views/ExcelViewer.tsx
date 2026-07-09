import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";

type ExcelCellType = string | number | boolean | Date | null | undefined;

interface SheetsState {
    [sheetName: string] : ExcelCellType[][];
}

export const ExcelViewer: React.FC<{ fileUrl: string; textContent: string }> = ({ fileUrl }) => {
    const [sheets, setSheets] = useState<SheetsState>({});
    const [activeSheet, setActiveSheet] = useState<string>("");

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
            result[sheetName] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            });
            
            setSheets(result);
            setActiveSheet(wb.SheetNames[0]);
        })
        .catch((err) => console.error("Lỗi đọc file excel", err));
    }, [fileUrl]);

    if (!activeSheet) return <div className="p-4 text-xs text-muted-foreground animate-pulse">Loading sheet...</div>;

    return (
        <div className="flex flex-col h-full bg-background border rounded-xl overflow-hidden shadow-sm">
        {/* Selecting sheet tab */}
        <div className="flex gap-1 bg-muted/40 p-2 border-b overflow-x-auto">
            {Object.keys(sheets).map((name) => (
            <button
                key={name}
                onClick={() => setActiveSheet(name)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeSheet === name ? "bg-primary text-primary-foreground shadow" : "hover:bg-muted text-muted-foreground"
                }`}
            >
                {name}
            </button>
            ))}
        </div>

        {/* Data grid of selected sheet */}
        <div className="flex-1 overflow-auto max-h-150">
            <table className="w-full text-left border-collapse text-xs">
            <thead>
                <tr className="bg-muted/60 sticky top-0 border-b">
                {sheets[activeSheet][0]?.map((_, index) => (
                    <th key={index} className="p-2 border-r font-semibold text-center text-muted-foreground bg-muted/80 w-12">
                    {String.fromCharCode(65 + (index % 26))} {/* Display column name A, B, C, ... */}
                    </th>
                ))}
                </tr>
            </thead>
            <tbody>
                {sheets[activeSheet].map((row: ExcelCellType[], rowIndex: number) => (
                <tr key={rowIndex} className="border-b hover:bg-muted/30 transition-colors">
                    {row.map((cell: ExcelCellType, cellIndex: number) => (
                    <td key={cellIndex} className="p-2 border-r whitespace-nowrap overflow-hidden max-w-50 text-foreground">
                        {cell !== undefined && cell !== null ? String(cell) : ""}
                    </td>
                    ))}
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        </div>
    );
};
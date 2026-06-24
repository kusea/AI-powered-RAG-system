const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ChatStreamPayload {
    query: string;
    document_ids: number[];
}

export async function fetchChatStreamAPI(payload: ChatStreamPayload){
    const res = await fetch(`${API_URL}/chat/query`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })

    if(!res.ok) throw new Error(`Failed to fetch chat stream: ${res.statusText}`)

    return res.body
}
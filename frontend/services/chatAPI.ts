const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ChatStreamPayload {
    query: string;
    document_ids: number[] | null;
    session_id: number | null;
}

export async function fetchChatStreamAPI(payload: ChatStreamPayload){
    console.log(`Fetching chat stream with payload: ${JSON.stringify(payload)}`)
    const res = await fetch(`${API_URL}/chat/query`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(payload)
    })

    if(!res.ok) throw new Error(`Failed to fetch chat stream: ${res.statusText}`)

    return res.body
}
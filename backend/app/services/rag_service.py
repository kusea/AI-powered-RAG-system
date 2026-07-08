from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Document, ChunkDocument, ChatMessage, ChatSession
from app.core.config import settings
from sentence_transformers import SentenceTransformer
from typing import List, Optional

import traceback
import json
import asyncio
from openai import AsyncOpenAI

#Logic to search for similar embeddings based on cosine similarity using pgvector's built-in functions
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
openai_client = AsyncOpenAI(
    base_url=settings.AI_BASE_URL,
    api_key=settings.OPENAI_API_KEY
) #Need to add AI api key later in .env
SEARCH_LIMIT = 20
"""
USE THE SEARCH HYBRID TO REPLACE JUST ONLY SEARCH BY VECTOR SEMANTIC 
def search_similar_embeddings(db: Session, query_text: str, limit: int, document_ids: Optional[List[int]] = None) -> List[Document]:
    query_vector = embedding_model.encode(query_text).tolist()
    if len(query_vector) != settings.VECTOR_DIMENSION:
        raise HTTPException(status_code=400, detail="Vector must have exactly the number of dimensions.")
    
    query = db.query(ChunkDocument)
    if document_ids:
        query = query.filter(ChunkDocument.document_id.in_(document_ids))

    results = query.order_by(
        ChunkDocument.embedding.cosine_distance(query_vector)
    ).limit(limit).all()
    return results """

async def generate_chat_stream(db: Session, query_text: str, document_ids: Optional[List[int]] = None, 
                                isNewSession: bool = False, session_id: int = None, session_title: str = None):
    if isNewSession:
        session_info = {"id": session_id, "title": session_title}
        yield f"data: {json.dumps({"session_info": session_info})}\n\n"
    
    relevant_docs = search_hybrid(db, query_text, SEARCH_LIMIT, document_ids)
    relev_docs = [db.query(Document).get(doc.document_id) for doc in relevant_docs]
    print(f"\n------Relevant docs: {[f"Doc {doc.id}: {doc.title}\n" for doc in relev_docs]}----------\n")
    # Prepare the content to make context for prompt and source metadata
    content_text = []
    source_metadata = []
    seen_title = set()

    for doc in relev_docs:
        normalized_title = doc.title.strip()
        if not normalized_title or normalized_title in seen_title:
            continue
        source_metadata.append({"id": doc.id, "title": doc.title})
        seen_title.add(normalized_title)

    content_text = [(doc.content or "").strip() for doc in relevant_docs]
    # Send the source list as an event called "sources"
    yield f"event: sources\ndata:{json.dumps(source_metadata)}\n\n"
    await asyncio.sleep(0.01)

    context_str = "\n---\n".join(content_text)

    print("\n------Context: " + context_str + "----------\n")

    system_prompt = (
        "YOU ARE AN AI ASSISTANT INTEGRATED INTO AN INTERNAL DOCUMENT MANAGEMENT SYSTEM (RAG SYSTEM)."
        "YOU HAVE FULL PERMISSION TO ACCESS AND READ THE USER'S EXTRACTED FILE DATA PROVIDED BELOW."

        "Your tasks:"
        "1. Answer the user's questions if and only if that information IS LOCATED WITHIN THE PROVIDED CONTEXT."
        "2. ABSOLUTELY DO NOT respond with canned refusal phrases such as \"I do not have access to your files\" or \"I am a language model and do not store files.\" YOU CURRENTLY HAVE THE FILE IN YOUR HANDS."
        "3. Extract the exact data found inside the <context></context> tags to answer the user directly."
        "4. If the information is truly not found within the <context> tags, reply exactly: \"This information was not found in your documents.\" and do not speculate further."
        f"Content: <context>{context_str}</context>"
    ) if context_str else (
        "You are a helpful AI assistant. Notice the user that you can not find suitable documents to answer the question. "
    )

    # Call AI API
    try:
        response = await openai_client.chat.completions.create(
            model = "llama-3.3-70b-versatile",
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query_text}
            ],
            stream = True # Set words appear one by one
        )
        print (f"Response: {response}")
        assistant_chat_content = ""
        async for chunk in response:
            content = chunk.choices[0].delta.content
            if content:
                assistant_chat_content += content
                yield f"data: {json.dumps({"text": content})}\n\n"
                await asyncio.sleep(0.01)
        print (f"Assistant chat content: {assistant_chat_content}")
        assistant_message = ChatMessage(
            session_id = session_id,
            role = "assistant",
            content = assistant_chat_content
        )
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        session.messages.append(assistant_message)
        db.add(assistant_message)
        db.commit()

    except Exception as err:
        print("--------- ERROR IN STREAM PROCESS ----------")
        traceback.print_exc()
        error_data = {"error": str(err)}
        yield f"data: {json.dumps(error_data)}\n\n"


async def generate_document_summary(document_content: str):
    # Use LLM to quickly summarize and extract data from document
    if not document_content or len(document_content.strip()) == 0:
        return {
            "summary": "Empty document, can not generate summary.",
            "key_points": [],
            "key_words": []
        }
    
    truncated_content = document_content[:8000] if len(document_content) > 8000 else document_content
    promp = (
        "YOU ARE AN AI ASSISTANT INTEGRATED INTO AN INTERNAL DOCUMENT MANAGEMENT SYSTEM (RAG SYSTEM)."
        "YOU HAVE FULL PERMISSION TO ACCESS AND READ THE USER'S EXTRACTED FILE DATA PROVIDED BELOW."
        "Your tasks: Read the document(s) and return a standard JSON object with summary, key_points and key_words satisfying the following requirements:"
        "1. 'summary': A overview (at most 200 words, about 3-5 sentences) of the document(s)."
        "2. 'key_points': A list of 5 key points extracted from the document(s)."
        "3. 'key_words': A list of 5 keywords from the document(s)."
        f"Content: \n{truncated_content}"
    )

    try:
        response = await openai_client.chat.completions.create(
            model = "llama-3.3-70b-versatile",
            messages = [
                {"role": "system", "content": promp},
            ],
            stream = False, # Set words appear one by one
            response_format={"type": "json_object"}
        )
        
        result_content = response.choices[0].message.content
        return json.loads(result_content)
    except Exception as e:
        print(f"Error during generate document summary: {str(e)}")
        return {
            "summary": "Error during generate document summary.",
            "key_points": [str(e)],
            "key_words": []
        }
    
def reciprocal_rank_fusion(vector_results, fts_results, k = 60 ): # default const k value = 60
    rrf_scores = {}

    # Calculate RRF score for each document based on vector
    for rank, doc in enumerate(vector_results):
        doc_id = doc.id
        rrf_scores[doc_id] = rrf_scores.get(doc_id, 0) + 1.0 / (rank + 1 + k)

    for rank, doc in enumerate(fts_results):
        doc_id = doc.id
        rrf_scores[doc_id] = rrf_scores.get(doc_id, 0) + 1.0 / (rank + 1 + k)

    sorted_doc_ids = sorted(rrf_scores.items(), key=lambda item: item[1], reverse=True) # sort and transfer the rrf_scores list of dict into list of set
    return sorted_doc_ids

def search_hybrid(db: Session, query_text: str, limit: int, document_ids: Optional[list[int]] = None):
    # Vector search
    query_vector = embedding_model.encode(query_text).tolist()
    vector_query = db.query(ChunkDocument)
    if document_ids:
        vector_query = vector_query.filter(ChunkDocument.document_id.in_(document_ids))
    vector_results = vector_query.order_by(
        ChunkDocument.embedding.cosine_distance(query_vector)
    ).limit(limit).all()
    
    # Full text search (BM25 - Postgre)
    fts_query = db.query(ChunkDocument).filter(
        func.to_tsvector('english', ChunkDocument.content).match(query_text, language="english")
    )
    if document_ids:
        fts_query = fts_query.filter(Document.id.in_(document_ids))
    fts_results = fts_query.limit(limit*2).all()
    
    combined_ranks =  reciprocal_rank_fusion(vector_results, fts_results)

    final_chunks = []
    chunk_map = {c.id: c for c in vector_results + fts_results}

    for doc_id, score in combined_ranks[:limit]:
        final_chunks.append(chunk_map[doc_id])

    return final_chunks

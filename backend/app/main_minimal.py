# backend/app/main_minimal.py
"""
Minimal version of main.py for debugging startup issues
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Language Learning Flashcards - Minimal",
    description="Minimal version for debugging",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def read_root():
    return {"message": "Minimal server is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}
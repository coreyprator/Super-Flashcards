#!/usr/bin/env python3
"""
Simple server runner without reload to debug startup issues
"""
import uvicorn
import os
import sys

# Add the backend directory to the path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

if __name__ == "__main__":
    print("Starting simple server...")
    try:
        uvicorn.run(
            "app.main:app",
            host="localhost",
            port=8000,
            reload=False,  # Disable reload to avoid issues
            log_level="info"
        )
    except Exception as e:
        print(f"Server failed to start: {e}")
        import traceback
        traceback.print_exc()
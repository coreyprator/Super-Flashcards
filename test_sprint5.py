#!/usr/bin/env python3
"""
Sprint 5 Phase 1 - Local Network Testing Script
Test offline sync functionality across devices (laptop ↔ iPhone)
"""

import subprocess
import sys
import socket
import time
import requests
from pathlib import Path

def get_local_ip():
    """Get the local network IP address"""
    try:
        # Connect to a remote address to determine local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except:
        return "localhost"

def check_backend_running():
    """Check if the FastAPI backend is running"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def start_backend():
    """Start the FastAPI backend"""
    print("🚀 Starting FastAPI backend...")
    backend_path = Path(__file__).parent / "backend"
    
    # Start backend in background
    process = subprocess.Popen([
        sys.executable, "-m", "uvicorn", 
        "app.main:app", 
        "--reload", 
        "--host", "0.0.0.0", 
        "--port", "8000"
    ], cwd=backend_path)
    
    # Wait for backend to start
    for i in range(30):  # Wait up to 30 seconds
        if check_backend_running():
            print("✅ Backend started successfully")
            return process
        time.sleep(1)
        print(f"⏳ Waiting for backend to start... ({i+1}/30)")
    
    print("❌ Backend failed to start")
    return None

def start_frontend():
    """Start the frontend server"""
    print("🌐 Starting frontend server...")
    frontend_path = Path(__file__).parent / "frontend"
    
    # Start frontend in background
    process = subprocess.Popen([
        sys.executable, "-m", "http.server", "3000"
    ], cwd=frontend_path)
    
    time.sleep(2)  # Give it a moment to start
    print("✅ Frontend started successfully")
    return process

def run_tests():
    """Run Sprint 5 Phase 1 tests"""
    local_ip = get_local_ip()
    
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║                    SPRINT 5 PHASE 1 TESTING                 ║")  
    print("║                   Offline Sync + Cross-Device                ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    print()
    
    # Check if backend is running
    if not check_backend_running():
        print("❌ Backend not running, starting it...")
        backend_process = start_backend()
        if not backend_process:
            print("💥 Failed to start backend. Please start manually:")
            print("   cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
            return
    else:
        print("✅ Backend is already running")
        backend_process = None
    
    print()
    print("🌍 NETWORK ACCESS INFORMATION:")
    print(f"   Laptop URL:     http://localhost:8000")
    print(f"   iPhone URL:     http://{local_ip}:8000")
    print(f"   Local Network:  http://{local_ip}:8000")
    print()
    
    print("📱 IPHONE TESTING STEPS:")
    print("   1. Connect iPhone to same WiFi network")
    print("   2. Open Safari and navigate to:")
    print(f"      http://{local_ip}:8000")
    print("   3. Test offline functionality:")
    print("      • Turn on Airplane Mode")
    print("      • Create/edit flashcards")
    print("      • Turn off Airplane Mode")
    print("      • Watch automatic sync")
    print()
    
    print("🧪 AUTOMATED TESTS:")
    
    # Test 1: Health Check
    try:
        response = requests.get(f"http://{local_ip}:8000/health")
        if response.status_code == 200:
            print("   ✅ Health check passed")
        else:
            print("   ❌ Health check failed")
    except Exception as e:
        print(f"   ❌ Health check error: {e}")
    
    # Test 2: API Endpoints
    endpoints = [
        "/api/flashcards",
        "/api/languages",
        "/api/tts/voices"
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"http://{local_ip}:8000{endpoint}", timeout=5)
            if response.status_code == 200:
                print(f"   ✅ {endpoint} - OK")
            else:
                print(f"   ⚠️  {endpoint} - {response.status_code}")
        except Exception as e:
            print(f"   ❌ {endpoint} - Error: {e}")
    
    print()
    print("🔧 DEBUG FEATURES:")
    print("   • Check browser console for Sprint 5 initialization logs")
    print("   • Use sync status UI in header")
    print("   • Test debug buttons in footer")
    print("   • Monitor IndexedDB in DevTools > Application > Storage")
    print()
    
    print("✨ TESTING CHECKLIST:")
    print("   □ IndexedDB initializes properly")
    print("   □ Offline flashcard creation works")
    print("   □ Sync queue populates when offline")
    print("   □ Automatic sync when back online")
    print("   □ Cross-device sync (laptop ↔ iPhone)")
    print("   □ Conflict resolution (last-write-wins)")
    print("   □ UI updates reflect sync status")
    print()
    
    input("Press Enter when done testing (this will keep servers running)...")
    
    # Keep servers running
    print("✅ Testing complete! Servers are still running.")
    print("💡 To stop servers, press Ctrl+C")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down servers...")
        if backend_process:
            backend_process.terminate()

if __name__ == "__main__":
    run_tests()
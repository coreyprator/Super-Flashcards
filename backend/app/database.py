# backend/app/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import urllib

# Detect if running in Cloud Run
CLOUD_RUN = os.getenv("K_SERVICE") is not None

if CLOUD_RUN:
    # Cloud SQL connection via Public IP
    server = os.getenv("SQL_SERVER", "35.224.242.223")  # Cloud SQL Public IP
    database = os.getenv("SQL_DATABASE", "LanguageLearning")
    username = os.getenv("SQL_USER", os.getenv("SQL_USERNAME", "flashcards_user"))  # Try SQL_USER first (Cloud Run), then SQL_USERNAME (legacy)
    password = os.getenv("SQL_PASSWORD", "")  # Will be loaded from Secret Manager
    
    print(f"🔌 Cloud Run Database Configuration:")
    print(f"   Server: {server}")
    print(f"   Database: {database}")
    print(f"   Username: {username}")
    print(f"   Password: {'*' * len(password) if password else '(empty)'}")
    
    # Connect to Cloud SQL via public IP with SQL Auth
    # Add port 1433 explicitly and increase timeout
    params = urllib.parse.quote_plus(
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={server},1433;"
        f"DATABASE={database};"
        f"UID={username};"
        f"PWD={password};"
        f"Encrypt=yes;"
        f"TrustServerCertificate=yes;"
        f"Connection Timeout=30;"
    )
    DATABASE_URL = f"mssql+pyodbc:///?odbc_connect={params}"
else:
    # Local MS SQL Express connection
    server = os.getenv("SQL_SERVER", "localhost\\SQLEXPRESS")
    database = os.getenv("SQL_DATABASE", "LanguageLearning")
    username = os.getenv("SQL_USERNAME", "")  # Empty for Windows Auth
    password = os.getenv("SQL_PASSWORD", "")
    
    # Detect if connecting to Cloud SQL from local (IP address instead of localhost)
    is_cloud_sql = not ("localhost" in server.lower() or "\\" in server)
    
    # Build connection string
    if username:
        # SQL Server Authentication
        if is_cloud_sql:
            # Cloud SQL requires port, encryption settings
            params = urllib.parse.quote_plus(
                f"DRIVER={{ODBC Driver 17 for SQL Server}};"
                f"SERVER={server},1433;"
                f"DATABASE={database};"
                f"UID={username};"
                f"PWD={password};"
                f"Encrypt=yes;"
                f"TrustServerCertificate=yes;"
                f"Connection Timeout=30;"
            )
        else:
            # Local SQL Server
            params = urllib.parse.quote_plus(
                f"DRIVER={{ODBC Driver 17 for SQL Server}};"
                f"SERVER={server};"
                f"DATABASE={database};"
                f"UID={username};"
                f"PWD={password}"
            )
        DATABASE_URL = f"mssql+pyodbc:///?odbc_connect={params}"
    else:
        # Windows Authentication (Trusted Connection)
        params = urllib.parse.quote_plus(
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={server};"
            f"DATABASE={database};"
            f"Trusted_Connection=yes"
        )
        DATABASE_URL = f"mssql+pyodbc:///?odbc_connect={params}"

# Create engine with connection pool settings
# pool_pre_ping: Test connections before using them (prevents "connection closed" errors)
# This is critical for async operations that may leave connections idle
engine = create_engine(
    DATABASE_URL, 
    echo=True,
    pool_pre_ping=True,      # Test connection before use
    pool_size=5,              # Number of connections to maintain
    max_overflow=10,          # Additional connections when pool exhausted
    pool_recycle=3600,        # Recycle connections after 1 hour
    pool_timeout=30           # Timeout for getting connection from pool
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
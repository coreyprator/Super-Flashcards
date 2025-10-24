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
    username = os.getenv("SQL_USERNAME", "flashcards_user")
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
    
    # Build connection string
    if username:
        # SQL Server Authentication
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

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
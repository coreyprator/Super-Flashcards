import pyodbc

conn = pyodbc.connect(
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=35.224.242.223;'
    'DATABASE=LanguageLearning;'
    'UID=flashcards_user;'
    'PWD=ezihRMX6VAaGd97hAuwW;'
    'Encrypt=yes;'
    'TrustServerCertificate=yes'
)

cursor = conn.cursor()

print("\n=== FLASHCARDS TABLE COLUMNS ===")
cursor.execute("""
    SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'flashcards'
    ORDER BY ORDINAL_POSITION
""")

for row in cursor.fetchall():
    nullable = "NULL" if row.IS_NULLABLE == 'YES' else "NOT NULL"
    length = f"({row.CHARACTER_MAXIMUM_LENGTH})" if row.CHARACTER_MAXIMUM_LENGTH and row.CHARACTER_MAXIMUM_LENGTH != -1 else ""
    print(f"  {row.COLUMN_NAME}: {row.DATA_TYPE}{length} {nullable}")

print("\n=== SAMPLE FLASHCARD WITH ALL COLUMNS ===")
cursor.execute("SELECT TOP 1 * FROM flashcards WHERE word_or_phrase = 'polvo à lagareiro'")
columns = [column[0] for column in cursor.description]
row = cursor.fetchone()

if row:
    for col, val in zip(columns, row):
        print(f"  {col}: {val}")

conn.close()

import pyodbc
conn = pyodbc.connect('DRIVER={ODBC Driver 17 for SQL Server};SERVER=35.224.242.223,1433;DATABASE=learning;UID=sqlserver;PWD=LGxbsXu3*Cwyte3CLrnZ;TrustServerCertificate=yes')
cur = conn.cursor()
cur.execute("DELETE FROM flashcards WHERE word_or_phrase LIKE 'R2B1-canary-%'")
n1 = cur.rowcount
cur.execute("DELETE FROM mythological_figures WHERE english_name LIKE 'R2B1-canary-%'")
n2 = cur.rowcount
conn.commit()
print(f'Deleted canary rows: flashcards={n1}, figures={n2}')
cur.close()
conn.close()

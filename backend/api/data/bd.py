import psycopg2 as sql

DB = {
    "host": "localhost",
    "port": 5432,
    "database": "elecciones_onpe",
    "user": "postgres",
    "password": "123",
}

def get_connection():
    return sql.connect(**DB)


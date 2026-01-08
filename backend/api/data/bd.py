import psycopg2 as sql
import pandas as pd
import os 

# Configuracion para Localhost
DB = {
    "host": "localhost",
    "port": 5432,
    "database": "elecciones_onpe",
    "user": "postgres",
    "password": "123",
}

def get_connection():
    # 1. Intentamos leer la URL de la base de datos de Vercel
    db_url = os.environ.get("POSTGRES_URL")
    
    if db_url:
        # Si existe la URL (Estamos en la nube), conectamos usando esa URL
        return sql.connect(db_url)
    else:
        # Si NO existe (Estamos en tu PC), usamos el diccionario DB local
        return sql.connect(**DB)


# --- TUS FUNCIONES (Se mantienen igual, solo usan la nueva conexión) ---

def obtener_usuario(dni: int):
    conn = get_connection()
    try:
        query = """
        SELECT * FROM usuario
        WHERE dni = %s;
        """
        # Pandas usa la conexión que le entregamos (sea local o nube)
        df = pd.read_sql_query(query, conn, params=(dni,))
        return df
    finally:
        conn.close()

def obtener_usuario_voto(dni : int):
    conn = get_connection()
    try:
        query = """
        SELECT * FROM voto
        WHERE dni = %s;
        """
        df = pd.read_sql_query(query, conn, params=(dni,))
        return df
    finally:
        conn.close()

def guardar_votante(id_voto: int, dni: int, presidente: str, vicepresidente: str, diputado: str, parlamentario: str, senador: str):
    conn = get_connection()
    try:
        # Usamos cursor estándar para operaciones de escritura (INSERT/UPDATE)
        cur = conn.cursor()
        query = """
        INSERT INTO voto (id_voto, dni, fecha, presidente, vicepresidente, diputado, parlamentario, senador)
        VALUES (%s, %s, CURRENT_DATE, %s, %s, %s, %s, %s);
        """
        # Ejecutamos la orden
        cur.execute(query, (id_voto, dni, presidente, vicepresidente, diputado, parlamentario, senador))
        
        # Confirmar los cambios en la base de datos
        conn.commit()
        cur.close()
    except Exception as e:
        conn.rollback() # Deshacer si hay error
        raise e
    finally:
        conn.close()
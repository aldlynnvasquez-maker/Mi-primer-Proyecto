import psycopg2 as sql
import pandas as pd

DB = {
    "host": "localhost",
    "port": 5432,
    "database": "elecciones_onpe",
    "user": "postgres",
    "password": "123",
}

def get_connection():
    return sql.connect(**DB)


#Obtener usuario
def obtener_usuario(dni: int):
    conn = get_connection()
    query = """
    SELECT * 
    FROM usuario
    WHERE dni = %s;
    """
    df = pd.read_sql_query(query,conn,params=(dni,))

    conn.close()
    return df

def obtener_usuario_voto(dni : int):
    conn = get_connection()
    query = """
    SELECT * FROM voto
    WHERE dni = %s;
    """
    df = pd.read_sql_query(query,conn,params=(dni,))
    conn.close()
    return df

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
        
        # ¡Importante! Confirmar los cambios en la base de datos
        conn.commit()
        cur.close()
    except Exception as e:
        conn.rollback() # Deshacer si hay error
        raise e
    finally:
        conn.close()
from config.db_config import get_connection
import psycopg2

class ForeignKeyNotFoundError(Exception):
    pass

def resolve_foreign_key(table: str, column: str, value: str):
    if not value:
        raise ForeignKeyNotFoundError(f"❌ Cannot resolve null/empty value for table '{table}' column '{column}'.")

    query = f"SELECT id FROM {table} WHERE {column} = %s"
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (value,))
                result = cur.fetchone()
                if not result:
                    raise ForeignKeyNotFoundError(f"❌ No record found in '{table}' where {column} = '{value}'")
                return result[0]
    except psycopg2.Error as e:
        raise Exception(f"PostgreSQL error while resolving foreign key: {str(e)}")

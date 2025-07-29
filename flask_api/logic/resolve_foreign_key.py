from db_utils.db_utils import get_connection

def resolve_foreign_key(table, field, value, bank_type=None):
    conn = get_connection()
    cur = conn.cursor()

    try:
        if table == "banks" and bank_type == "nbfc":
            table = "nbfc_info"
            field = "nbfc_name"

        sql = f"SELECT id FROM systemisers.{table} WHERE {field} = %s"
        cur.execute(sql, (value,))
        result = cur.fetchone()
        if result:
            return result[0]
        else:
            raise ValueError(f"❌ No record found in systemisers.{table} where {field} = '{value}'")
    except Exception as e:
        raise ValueError(f"PostgreSQL error while resolving foreign key: {e}")
    finally:
        cur.close()
        conn.close()

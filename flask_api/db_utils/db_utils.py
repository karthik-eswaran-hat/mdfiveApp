import psycopg2
from psycopg2.extras import execute_values
from config.db_config import DB_CONFIG


def insert_data(query, values=None):
    try:
        with psycopg2.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                cur.execute(query, values)
                if "RETURNING" in query.upper():
                    return cur.fetchone()[0]
                conn.commit()
                return None
    except Exception as e:
        print(f"Error in insert_data: {e}")
        return None


def insert_many(query, values):
    try:
        with psycopg2.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                execute_values(cur, query, values)
                conn.commit()
    except Exception as e:
        print(f"Bulk insert error: {e}")


def select_one(query, params=None):
    try:
        with psycopg2.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                cur.execute(query, params or ())
                result = cur.fetchone()
                return result[0] if result else None
    except Exception as e:
        print(f"Select error (one): {e}")
        return None


def select_all(query, params=None):
    try:
        with psycopg2.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                cur.execute(query, params or ())
                return cur.fetchall()
    except Exception as e:
        print(f"Select error (all): {e}")
        return []


def update_data(query, params=None):
    """Update data and return number of affected rows"""
    try:
        with psycopg2.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                cur.execute(query, params or ())
                affected_rows = cur.rowcount
                conn.commit()
                return affected_rows
    except Exception as e:
        print(f"Update error: {e}")
        return 0


def update_many(query, params_list):
    """Update multiple rows"""
    try:
        with psycopg2.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                affected_rows = 0
                for params in params_list:
                    cur.execute(query, params)
                    affected_rows += cur.rowcount
                conn.commit()
                return affected_rows
    except Exception as e:
        print(f"Bulk update error: {e}")
        return 0


def execute_query(query, params=None):
    """Execute any query (useful for DELETE, UPDATE without return value)"""
    try:
        with psycopg2.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                cur.execute(query, params or ())
                affected_rows = cur.rowcount
                conn.commit()
                return affected_rows
    except Exception as e:
        print(f"Execute query error: {e}")
        return 0

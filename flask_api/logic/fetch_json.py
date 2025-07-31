import psycopg2
from config.db_config import DB_CONFIG

def fetch_json_from_db(report_name_pattern):
    try:
        with psycopg2.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT user_input_data
                    FROM test_suite.json_report_test_data_app
                    WHERE report_name ~ %s
                    LIMIT 1;
                """, (report_name_pattern,))
                result = cur.fetchone()
                return result[0] if result else None
    except Exception as e:
        print(f"Fetch error: {e}")
        exit()

from flask import request, jsonify
from db import get_db_connection
from contextlib import contextmanager

@contextmanager
def db_cursor():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        yield cur
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()

def register_routes(app):

    @app.route('/api/test', methods=['GET'])
    def test():
      try:
          with db_cursor() as cur:
              query = """
                  SELECT * FROM test_suite.get_valid_report_sample_counts(
                      (
                          SELECT MAX(
                              CAST(SUBSTRING(report_name FROM 'Report_(\\d+)_') AS INTEGER)
                          )
                          FROM test_suite.json_report_test_data
                          WHERE report_name ~ 'Report_\\d+_'
                      )
                  );
              """
              cur.execute(query)
              rows = cur.fetchall()
          return jsonify({
              "success": True,
              "datakar": rows
          })
      except Exception as e:
          return jsonify({
              "success": False,
              "error": str(e)
          }), 500


    @app.route('/api/get-latest-report', methods=['GET'])
    def get_latest_report():
        query = """
            SELECT 
                MAX(CAST(SUBSTRING(report_name FROM 'Report_(\\d+)_') AS INTEGER)) AS report_count,
                MAX(report_name) FILTER (WHERE report_name ~ 'Report_\\d+_\\d+') AS sample_report_id
            FROM test_suite.json_report_test_data
            WHERE report_name ~ 'Report_\\d+_';
        """
        try:
            with db_cursor() as cur:
                cur.execute(query)
                result = cur.fetchone()
            return jsonify({
                'report_count': int(result['report_count']) if result['report_count'] else 0,
                'sample_report_id': result['sample_report_id'] or '',
                'success': True
            })
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/load-test-data', methods=['POST'])
    def load_test_data():
        query = "SELECT NOW();"  # Placeholder query — replace with your actual logic
        try:
            with db_cursor() as cur:
                cur.execute(query)
                result = cur.fetchone()
            return jsonify({'success': True, 'result': result})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

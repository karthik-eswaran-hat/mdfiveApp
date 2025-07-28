from flask import request, jsonify
from db import get_db_connection

def register_routes(app):
    

    @app.route('/api/test', methods=['GET'])
    def test():
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT * FROM systemisers.users;")
            rows = cur.fetchall()
            cur.close()
            conn.close()

            return jsonify({
                "success": True,
                "users": rows
            })
        except Exception as e:
            return jsonify({
                "success": False,
                "error": str(e)
            }), 500

    
    @app.route('/api/get-latest-report', methods=['GET'])
    def get_latest_report():
        query = "SELECT MAX(CAST(SUBSTRING(report_name FROM 'Report_(\d+)_') AS INTEGER)) AS max_number FROM test_suite.json_report_test_data WHERE report_name ~ 'Report_\d+_';"
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute(query)
            result = cur.fetchone()
            cur.close()
            conn.close()

            if result:
                return jsonify({
                    'report_count': int(result['report_count']) if result['report_count'] else 0,
                    'sample_report_id': result['sample_report_id'] or '',
                    'success': True
                })
            else:
                return jsonify({
                    'report_count': 0,
                    'sample_report_id': '',
                    'success': True,
                    'message': 'No valid reports found'
                })
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/load-test-data', methods=['POST'])
    def load_test_data():
        query = ""
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute(query)
            result = cur.fetchone()
            cur.close()
            conn.commit()
            conn.close()
            return jsonify({'success': True, 'result': result})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500


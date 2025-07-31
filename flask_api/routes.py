from flask import request, jsonify
from db import get_db_connection
from contextlib import contextmanager
import psycopg2.extras

@contextmanager
def db_cursor():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
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
                    SELECT * FROM test_suite.get_valid_report_sample_counts_app(
                        (
                            SELECT MAX(
                                CAST(SUBSTRING(report_name FROM 'Report_(\\d+)_') AS INTEGER)
                            )
                            FROM test_suite.json_report_test_data_app
                            WHERE report_name ~ 'Report_\\d+_'
                        )
                    );
                """
                cur.execute(query)
                rows = cur.fetchall()
            return jsonify({
                "success": True,
                "data": rows
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
            FROM test_suite.json_report_test_data_app
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
        query = """
            SELECT * FROM test_suite.load_valid_sample_report_app(
                (
                    SELECT MAX(
                        CAST(SUBSTRING(report_name FROM 'Report_(\\d+)_') AS INTEGER)
                    )
                    FROM test_suite.json_report_test_data_app
                    WHERE report_name ~ 'Report_\\d+_'
                )
            );
        """
        try:
            with db_cursor() as cur:
                cur.execute(query)
                result = cur.fetchone()
            return jsonify({'success': True, 'result': result})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/reportSummary', methods=['GET'])
    def get_report_combination_summary():
        query = "SELECT * FROM test_suite.report_combination_summary_app;"
        try:
            with db_cursor() as cur:
                cur.execute(query)
                rows = cur.fetchall()
                result = [dict(row) for row in rows]
            return jsonify({
                'success': True,
                'data': result
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    @app.route('/api/reportComparison', methods=['GET'])
    def compare_report_id():
        report_id_1 = request.args.get('report_id_1')
        report_id_2 = request.args.get('report_id_2')
        
        project_report_stage_id_1 = request.args.get('project_report_stage_id_1')
        project_report_stage_id_2 = request.args.get('project_report_stage_id_2')
        
        if not report_id_1 or not report_id_2:
            return jsonify({
                'success': False,
                'error': 'Both report_id_1 and report_id_2 are required parameters'
            }), 400
        
        if project_report_stage_id_1 and project_report_stage_id_2:
            query = f"SELECT * FROM systemisers.compare_flattened_json_by_report_id({report_id_1}, {report_id_2}, {project_report_stage_id_1}, {project_report_stage_id_2});"
        elif project_report_stage_id_1:
            query = f"SELECT * FROM systemisers.compare_flattened_json_by_report_id({report_id_1}, {report_id_2}, {project_report_stage_id_1});"
        else:
            query = f"SELECT * FROM systemisers.compare_flattened_json_by_report_id({report_id_1}, {report_id_2});"
        
        try:
            with db_cursor() as cur:
                cur.execute(query)
                rows = cur.fetchall()
                result = [dict(row) for row in rows]
            
            return jsonify({
                'success': True,
                'data': result,
                'comparison_info': {
                    'report_id_1': report_id_1,
                    'report_id_2': report_id_2,
                    'project_report_stage_id_1': project_report_stage_id_1,
                    'project_report_stage_id_2': project_report_stage_id_2,
                    'differences_found': len(result)
                }
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
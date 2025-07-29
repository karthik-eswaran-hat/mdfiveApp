from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import json
import traceback

from logic.insert_report import insert_report
from logic.report_downloader import download_report
from db_utils.db_utils import select_all,select_one
from logic.fetch_json import fetch_json_from_db
from queries.queries import *
import re

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

def extract_report_number(report_name):
    match = re.match(r"Report_(\d+)", report_name)
    return match.group(1) if match else None

@app.route('/api/test', methods=['GET'])
def get_valid_report():
    """Get valid reports with sample IDs and counts"""
    try:
        query = """
        SELECT 
            SUBSTRING(report_name FROM 'Report_([0-9]+)') as sample_report_id,
            COUNT(*) as report_count
        FROM test_suite.json_report_test_data 
        WHERE report_name ~ 'Report_[0-9]+'
        GROUP BY SUBSTRING(report_name FROM 'Report_([0-9]+)')
        ORDER BY sample_report_id::INTEGER DESC
        """
        
        reports = select_all(query)
        
        # Format the data for frontend
        formatted_reports = []
        for report in reports:
            formatted_reports.append({
                'sample_report_id': report[0],
                'report_count': report[1]
            })
        
        return jsonify({
            'status': 'success',
            'data': formatted_reports,
            'message': f'Found {len(formatted_reports)} report groups'
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'data': []
        }), 500

@app.route('/api/load-test-data', methods=['POST'])
def load_test_data():
    """Process and load test data into the database"""
    try:
        # Default configuration
        user_id = 181
        org_id = 175
        company_id = 175
        
        # Get all available reports
        fetch_report_names_query = """
        SELECT DISTINCT report_name 
        FROM test_suite.json_report_test_data 
        ORDER BY 1 DESC
        LIMIT 5
        """
        
        report_names = select_all(fetch_report_names_query)
        
        processed_reports = []
        failed_reports = []
        
        for (report_name,) in report_names:
            try:
                print(f"🟢 Processing {report_name}...")
                
                # Fetch JSON data
                data = fetch_json_from_db(report_name)
                if not data:
                    failed_reports.append({
                        'report_name': report_name,
                        'error': 'No data found'
                    })
                    continue
                
                # Insert report
                report_id = insert_report(data, user_id, org_id, company_id)
                
                processed_reports.append({
                    'report_name': report_name,
                    'report_id': report_id,
                    'status': 'success'
                })
                
                print(f"✅ Successfully processed {report_name} with ID: {report_id}")
                
            except Exception as e:
                failed_reports.append({
                    'report_name': report_name,
                    'error': str(e)
                })
                print(f"❌ Error processing {report_name}: {e}")
        
        return jsonify({
            'status': 'success',
            'message': f'Processed {len(processed_reports)} reports successfully',
            'data': {
                'processed_count': len(processed_reports),
                'failed_count': len(failed_reports),
                'processed_reports': processed_reports,
                'failed_reports': failed_reports
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'data': None
        }), 500

@app.route('/api/reportSummary', methods=['GET'])
def get_report_summary():
    """Get report combination summary"""
    try:
        query = """
        SELECT 
            CASE 
                WHEN pr.is_fresh_term_loan AND pr.is_od_enhancement AND pr.is_takeover THEN 'Fresh + OD Enhancement + Takeover'
                WHEN pr.is_fresh_term_loan AND pr.is_od_enhancement THEN 'Fresh + OD Enhancement'
                WHEN pr.is_fresh_term_loan AND pr.is_takeover THEN 'Fresh + Takeover'
                WHEN pr.is_od_enhancement AND pr.is_takeover THEN 'OD Enhancement + Takeover'
                WHEN pr.is_fresh_term_loan THEN 'Fresh Term Loan'
                WHEN pr.is_od_enhancement THEN 'OD Enhancement'
                WHEN pr.is_takeover THEN 'Takeover'
                WHEN pr.is_od_renewal THEN 'OD Renewal'
                WHEN pr.is_od_fresh THEN 'Fresh OD'
                ELSE 'Other'
            END as report_combination,
            COUNT(*) as report_count
        FROM systemisers.project_reports pr
        GROUP BY 
            CASE 
                WHEN pr.is_fresh_term_loan AND pr.is_od_enhancement AND pr.is_takeover THEN 'Fresh + OD Enhancement + Takeover'
                WHEN pr.is_fresh_term_loan AND pr.is_od_enhancement THEN 'Fresh + OD Enhancement'
                WHEN pr.is_fresh_term_loan AND pr.is_takeover THEN 'Fresh + Takeover'
                WHEN pr.is_od_enhancement AND pr.is_takeover THEN 'OD Enhancement + Takeover'
                WHEN pr.is_fresh_term_loan THEN 'Fresh Term Loan'
                WHEN pr.is_od_enhancement THEN 'OD Enhancement'
                WHEN pr.is_takeover THEN 'Takeover'
                WHEN pr.is_od_renewal THEN 'OD Renewal'
                WHEN pr.is_od_fresh THEN 'Fresh OD'
                ELSE 'Other'
            END
        ORDER BY report_count DESC
        """
        
        summary_data = select_all(query)
        
        formatted_summary = []
        for row in summary_data:
            formatted_summary.append({
                'report_combination': row[0],
                'report_count': row[1]
            })
        
        return jsonify({
            'status': 'success',
            'data': formatted_summary,
            'message': f'Found {len(formatted_summary)} report combinations'
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'data': []
        }), 500

@app.route('/api/process-single-report', methods=['POST'])
def process_single_report():
    print("Processing karthik report...")
    """Process a single report by name"""
    try:
        data = request.get_json()
        report_name = data.get('report_name')
        
        if not report_name:
            return jsonify({
                'status': 'error',
                'message': 'Report name is required'
            }), 400
        
        # Default configuration
        user_id = 181
        org_id = 175
        company_id = 175
        
        # Fetch and process the report
        json_data = fetch_json_from_db(report_name)
        if not json_data:
            return jsonify({
                'status': 'error',
                'message': f'No data found for report: {report_name}'
            }), 404
        
        # Insert report
        report_id = insert_report(json_data, user_id, org_id, company_id)
        
        return jsonify({
            'status': 'success',
            'message': f'Report {report_name} processed successfully',
            'data': {
                'report_name': report_name,
                'report_id': report_id
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/download-report', methods=['POST'])
def download_report_endpoint():
    """Download a report by ID"""
    try:
        data = request.get_json()
        report_id = data.get('report_id')
        email = data.get('email', 'nandagopal@gmail.com')
        password = data.get('password', 'Testing@12345')
        
        if not report_id:
            return jsonify({
                'status': 'error',
                'message': 'Report ID is required'
            }), 400
        
        success = download_report(report_id, email, password)
        
        if success:
            return jsonify({
                'status': 'success',
                'message': f'Report {report_id} downloaded successfully',
                'data': {
                    'report_id': report_id,
                    'file_path': f'output_reports/Report_{report_id}.pdf'
                }
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'message': f'Failed to download report {report_id}'
            }), 500
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/reports', methods=['GET'])
def get_all_reports():
    """Get all processed reports"""
    try:
        query = """
        SELECT 
            pr.id,
            pr.created_at,
            pr.is_fresh_term_loan,
            pr.is_od_enhancement,
            pr.is_takeover,
            pr.is_od_renewal,
            pr.is_od_fresh,
            b.name as bank_name,
            ls.name as loan_scheme_name
        FROM systemisers.project_reports pr
        LEFT JOIN systemisers.banks b ON pr.bank_id = b.id
        LEFT JOIN systemisers.loan_schemes ls ON pr.loan_scheme_id = ls.id
        ORDER BY pr.created_at DESC
        LIMIT 50
        """
        
        reports = select_all(query)
        
        formatted_reports = []
        for report in reports:
            formatted_reports.append({
                'id': report[0],
                'created_at': report[1].isoformat() if report[1] else None,
                'is_fresh_term_loan': report[2],
                'is_od_enhancement': report[3],
                'is_takeover': report[4],
                'is_od_renewal': report[5],
                'is_od_fresh': report[6],
                'bank_name': report[7],
                'loan_scheme_name': report[8]
            })
        
        return jsonify({
            'status': 'success',
            'data': formatted_reports,
            'message': f'Found {len(formatted_reports)} reports'
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'data': []
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'status': 'error',
        'message': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'status': 'error',
        'message': 'Internal server error'
    }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

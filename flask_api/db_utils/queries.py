fetch_report_names_query = """
    SELECT DISTINCT report_name
    FROM test_suite.json_report_test_data_app
    ORDER BY 1 DESC
    """
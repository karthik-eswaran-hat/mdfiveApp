fetch_report_names_query = """
    SELECT DISTINCT report_name
    FROM test_suite.json_report_test_data
    ORDER BY 1 DESC
    """
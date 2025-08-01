INSERT_OD_CC_ENHANCEMENT = """
INSERT INTO systemisers.project_report_cc_ods (
    amount, int_rate, type, enhancement_amount,
    organization_id, company_id, report_id,
    created_by, updated_by, created_at, updated_at,
    name, sanction_date, amount_type
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
RETURNING id
"""

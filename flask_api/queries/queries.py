INSERT_PROJECT_REPORT = """
INSERT INTO systemisers.project_reports (
    user_id, organization_id, company_id,
    is_fresh_term_loan, is_od_enhancement, is_takeover, is_od_renewal,
    created_by, updated_by, created_at, updated_at,
    bank_id, loan_scheme_id, branch_id, is_od_fresh
) VALUES (%s, %s, %s, %s, %s, %s, %s,
          %s, %s, %s, %s, %s, %s, %s, %s)
RETURNING id;
"""
INSERT_TERM_LOAN = """
INSERT INTO systemisers.project_report_term_loans (
    organization_id, company_id, report_id, loan_amt, emi_start_date,
    is_secure, emi_amt, num_installments, int_rate,
    created_by, updated_by, created_at, updated_at,
    bank_id, installment_type, name, loan_type, amount_type
) VALUES (%s, %s, %s, %s, %s,
          %s, %s, %s, %s,
          %s, %s, %s, %s,
          %s, %s, %s, %s, %s)
RETURNING id;
"""
INSERT_OD_CC = """
INSERT INTO systemisers.project_report_cc_ods (
    organization_id, company_id, report_id,
    os_amt, amount, type,
    created_by, updated_by, created_at, updated_at,
    bank_id, int_rate, name, sanction_date,
    od_limits_json, takeover_id,
    amount_type_os, amount_type_od_cc
) VALUES (%s, %s, %s,
          %s, %s, %s,
          %s, %s, %s, %s,
          %s, %s, %s, %s,
          %s, %s, %s, %s)
RETURNING id;
"""

INSERT_OD_CC_ENHANCEMENT = """
INSERT INTO systemisers.project_report_new_cc_ods (
    amount, int_rate, od_cc_type, enhancement_amount,
    organization_id, company_id, report_id,
    created_by, updated_by, created_at, updated_at,
    name, sanction_date, amount_type
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
RETURNING id
"""



INSERT_FRESH_LOAN = """
INSERT INTO systemisers.project_report_new_loans (
    organization_id, company_id, report_id,
    num_installments, int_rate, moratorium_period,
    created_by, updated_by, created_at, updated_at,
    name, sanction_date
) VALUES (%s, %s, %s, %s, %s, %s,
          %s, %s, %s, %s,
          %s, %s)
RETURNING id;
"""
INSERT_ASSET = """
INSERT INTO systemisers.project_report_loan_assets (
    organization_id, company_id, name, type_id, original_value, margin,
    project_report_new_loan_id, promoter_contribution,
    created_by, created_at, updated_at
) VALUES (%s, %s, %s, %s, %s, %s,
          %s, %s, %s, %s, %s)
RETURNING id;
"""
INSERT_LOAN_BIFURCATION = """
INSERT INTO systemisers.project_report_loan_bifurcations (
    organization_id, company_id, report_id,
    financial_year, bank_od, rel_party_loan, other_loan,
    is_current, total_loan,
    created_by, updated_by, created_at, updated_at,
    term_loans, business_loans
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
RETURNING id;
"""
INSERT_ASSUMPTION = """
INSERT INTO systemisers.project_report_assumptions (
    organization_id, company_id, report_id,
    profit_margin, profit_margin_hist_pct, profit_margin_type,
    customer_credit_period, supplier_credit_period, version,
    is_current, updated_by, created_by,
    created_at, updated_at, related_party_amount,
    other_loan_amount, description,
    customer_credit_hist_pct, supplier_credit_hist_pct, od_amount
) VALUES (%s, %s, %s, %s, %s, %s,
          %s, %s, %s, TRUE, %s, %s,
          %s, %s, %s, %s, %s,
          %s, %s, %s)
RETURNING id;
"""
INSERT_ASSUMPTION_DETAIL = """
INSERT INTO systemisers.project_report_assumptions_details (
    assumption_id, assumptions_type_id, financial_year,
    value, percentage_increase, year_type,
    created_by, created_at, updated_at
) VALUES %s
"""
INSERT_TAKEOVER_LOAN = """
INSERT INTO systemisers.project_report_takeovers (
    report_id, takeover_type, int_rate, num_installments,
    created_by, updated_by, created_at, updated_at,
    organization_id, company_id, is_merged, sanction_date, name
) VALUES (%s, %s, %s, %s,
          %s, %s, %s, %s,
          %s, %s, %s, %s, %s)
RETURNING id;
"""

# =============================================================================
# UPDATE QUERIES
# =============================================================================

# Update Term Loan with Takeover ID
UPDATE_TERM_LOAN_TAKEOVER = """
UPDATE systemisers.project_report_term_loans 
SET takeover_id = %s, updated_at = %s 
WHERE id = %s
"""

# Update OD/CC with Takeover ID
UPDATE_OD_CC_TAKEOVER = """
UPDATE systemisers.project_report_cc_ods 
SET takeover_id = %s, updated_at = %s 
WHERE id = %s
"""

# Update Loan Bifurcation Status
UPDATE_LOAN_BIFURCATION_CURRENT = """
UPDATE systemisers.project_report_loan_bifurcations 
SET is_current = FALSE 
WHERE report_id = %s
"""

# =============================================================================
# SELECT QUERIES
# =============================================================================

# Select Term Loans for Takeover by Report ID and Name
SELECT_TERM_LOANS_FOR_TAKEOVER = """
SELECT id FROM systemisers.project_report_term_loans 
WHERE report_id = %s AND name = %s
"""

# Select OD/CC for Takeover by Report ID and Name
SELECT_OD_CC_FOR_TAKEOVER = """
SELECT id FROM systemisers.project_report_cc_ods 
WHERE report_id = %s AND name = %s
"""

# Select Term Loans by Multiple IDs
SELECT_TERM_LOANS_BY_IDS = """
SELECT id FROM systemisers.project_report_term_loans 
WHERE id = ANY(%s)
"""

# Select OD/CC by Takeover ID
SELECT_OD_CC_BY_TAKEOVER_ID = """
SELECT id FROM systemisers.project_report_cc_ods 
WHERE takeover_id = %s
"""

# Select All Term Loans for a Report
SELECT_ALL_TERM_LOANS_FOR_REPORT = """
SELECT id, name FROM systemisers.project_report_term_loans 
WHERE report_id = %s
"""

# Select All OD/CC for a Report
SELECT_ALL_OD_CC_FOR_REPORT = """
SELECT id, name FROM systemisers.project_report_cc_ods 
WHERE report_id = %s
"""

# Select Term Loan by ID
SELECT_TERM_LOAN_BY_ID = """
SELECT id, name, takeover_id FROM systemisers.project_report_term_loans 
WHERE id = %s
"""

# Select OD/CC by ID
SELECT_OD_CC_BY_ID = """
SELECT id, name, takeover_id FROM systemisers.project_report_cc_ods 
WHERE id = %s
"""

# Select Takeover by ID
SELECT_TAKEOVER_BY_ID = """
SELECT id, name, takeover_type, is_merged FROM systemisers.project_report_takeovers 
WHERE id = %s
"""

# Select All Takeovers for a Report
SELECT_ALL_TAKEOVERS_FOR_REPORT = """
SELECT id, name, takeover_type, is_merged FROM systemisers.project_report_takeovers 
WHERE report_id = %s
"""

# =============================================================================
# ADDITIONAL UTILITY QUERIES
# =============================================================================

# Check if Loan Bifurcation exists for Report
CHECK_LOAN_BIFURCATION_EXISTS = """
SELECT COUNT(*) FROM systemisers.project_report_loan_bifurcations 
WHERE report_id = %s
"""

# Get Bank ID by Name
SELECT_BANK_ID_BY_NAME = """
SELECT id FROM systemisers.banks WHERE name = %s
"""

# Get Branch ID by Branch Name
SELECT_BRANCH_ID_BY_NAME = """
SELECT id FROM systemisers.bank_branches WHERE branch = %s
"""

# Get Loan Scheme ID by Name
SELECT_LOAN_SCHEME_ID_BY_NAME = """
SELECT id FROM systemisers.loan_schemes WHERE name = %s
"""

# Get Project Report by ID
SELECT_PROJECT_REPORT_BY_ID = """
SELECT * FROM systemisers.project_reports WHERE id = %s
"""

# =============================================================================
# DELETE QUERIES (if needed for cleanup)
# =============================================================================

# Delete Term Loan by ID
DELETE_TERM_LOAN_BY_ID = """
DELETE FROM systemisers.project_report_term_loans WHERE id = %s
"""

# Delete OD/CC by ID
DELETE_OD_CC_BY_ID = """
DELETE FROM systemisers.project_report_cc_ods WHERE id = %s
"""

# Delete Takeover by ID
DELETE_TAKEOVER_BY_ID = """
DELETE FROM systemisers.project_report_takeovers WHERE id = %s
"""

# Delete All Takeovers for Report
DELETE_ALL_TAKEOVERS_FOR_REPORT = """
DELETE FROM systemisers.project_report_takeovers WHERE report_id = %s
"""

import json
from datetime import datetime
from db_utils.db_utils import insert_data, insert_many, select_one, select_all, update_data, update_many
from queries.queries import (
    INSERT_PROJECT_REPORT, INSERT_TERM_LOAN, INSERT_OD_CC, INSERT_FRESH_LOAN,
    INSERT_ASSET, INSERT_ASSUMPTION, INSERT_ASSUMPTION_DETAIL, INSERT_LOAN_BIFURCATION,
    INSERT_TAKEOVER_LOAN, UPDATE_TERM_LOAN_TAKEOVER, UPDATE_OD_CC_TAKEOVER,
    UPDATE_LOAN_BIFURCATION_CURRENT
)

itr_version_map = {"ITR1": 1, "ITR2": 2, "ITR3": 3, "ITR4": 4, "ITR5": 5, "ITR6": 6, "ITR7": 7}
year_type_map = {"actuals": 0, "provisional": 1, "projected": 2}
loan_type_map = {"term_loan": 0, "bussiness_loan": 1}
installment_type_map = {"month": 0, "year": 1}
amount_type_map = {"inr": 0, "lakhs": 1}
takeover_type_map = {"od_cc": 0, "term_loan": 1}

def format_od_limits(od_limits):
    return {str(limit["year"]): limit["limit"] for limit in od_limits}

def update_loan_bifurcation_status(report_id):
    """Update loan bifurcation status like in Rails"""
    try:
        update_data(UPDATE_LOAN_BIFURCATION_CURRENT, (report_id,))
        print(f"✅ Updated loan bifurcation status for report {report_id}")
    except Exception as e:
        print(f"❌ Failed to update loan bifurcation status: {e}")

def find_matching_loans_by_bank_and_amount(inserted_loans, bank_name, original_amount, tolerance=0.01):
    """Find matching loans by bank name and amount with tolerance"""
    matching_loans = []
    
    for loan in inserted_loans:
        loan_data = loan.get('data', {})
        loan_bank = loan_data.get('bank', {}).get('name', '')
        loan_amount = float(loan_data.get('loan_amt', 0))
        
        # Check bank name match
        bank_match = bank_name.lower() in loan_bank.lower() or loan_bank.lower() in bank_name.lower()
        
        # Check amount match with tolerance
        amount_diff = abs(loan_amount - original_amount) / max(loan_amount, original_amount)
        amount_match = amount_diff <= tolerance
        
        if bank_match and amount_match:
            matching_loans.append(loan)
            print(f"🎯 Found matching loan: ID={loan['id']}, Bank={loan_bank}, Amount={loan_amount}")
    
    return matching_loans

def insert_report(data, user_id, org_id, company_id):
    now = datetime.now()
    report_data = data["what_you_want_details"]

    bank_id = select_one("SELECT id FROM systemisers.banks WHERE name = %s", (report_data["bank"]["name"],))
    branch_id = select_one("SELECT id FROM systemisers.bank_branches WHERE branch = %s", (report_data["bank_branch"]["branch"],))
    loan_scheme_id = select_one("SELECT id FROM systemisers.loan_schemes WHERE name = %s", (report_data["loan_scheme"]["name"],))

    report_id = insert_data(INSERT_PROJECT_REPORT, (
        user_id, org_id, company_id,
        report_data["is_fresh_term_loan"], report_data["is_od_enhancement"], report_data["is_takeover"], report_data["is_od_renewal"],
        user_id, user_id, now, now,
        bank_id, loan_scheme_id, branch_id, report_data["is_od_fresh"]
    ))

    # Store inserted loans for takeover linking
    inserted_term_loans = []
    inserted_od_cc = []

    # --- STEP 1: Insert Existing Term Loans ---
    existing_loans = data.get("existing_loan_details_details") or {}
    term_loans = existing_loans.get("term_loan_details") or []
    if not isinstance(term_loans, list):
        term_loans = []

    print("🔄 STEP 1: Inserting existing term loans...")
    for tl in term_loans:
        try:
            print("DEBUG: Term loan entry:", tl)
            loan_amt = tl.get("loan_amt")
            if loan_amt is None:
                print("⚠️ Skipping term loan due to missing loan amount")
                continue

            bank_name = tl.get("bank", {}).get("name")
            if not bank_name:
                print("⚠️ Skipping term loan due to missing bank name")
                continue

            tl_bank_id = select_one("SELECT id FROM systemisers.banks WHERE name = %s", (bank_name,))
            if not tl_bank_id:
                print(f"⚠️ Skipping term loan. Bank not found: {bank_name}")
                continue

            loan_type = loan_type_map.get(tl.get("loan_type", "term_loan"), 0)
            installment_type = installment_type_map.get(tl.get("installment_type", "month").lower(), 0)
            amount_type_code = amount_type_map.get(tl.get("amount_type", "inr").lower(), 0)

            term_loan_id = insert_data(INSERT_TERM_LOAN, (
                org_id, company_id, report_id, loan_amt, tl.get("emi_start_date"),
                tl.get("is_secure", False), tl.get("emi_amt"), tl.get("num_installments"), tl.get("int_rate"),
                user_id, user_id, now, now,
                tl_bank_id, installment_type, tl.get("name"), loan_type, amount_type_code
            ))
            
            inserted_term_loans.append({
                'id': term_loan_id,
                'name': tl.get("name"),
                'data': tl
            })
            print(f"✅ Inserted term loan ID: {term_loan_id}, Name: {tl.get('name')}, Bank: {bank_name}, Amount: {loan_amt}")

        except Exception as e:
            print(f"❌ Failed to insert term loan: {e}")

    # --- STEP 2: Insert Existing OD/CC Loans ---
    print("🔄 STEP 2: Inserting existing OD/CC loans...")
    for od in existing_loans.get("od_cc_details") or []:
        try:
            print("DEBUG: OD/CC entry:", od)
            bank_name = od.get("bank", {}).get("name")
            if not bank_name:
                print("⚠️ Skipping OD/CC due to missing bank name")
                continue

            od_bank_id = select_one("SELECT id FROM systemisers.banks WHERE name = %s", (bank_name,))
            if not od_bank_id:
                print(f"⚠️ Skipping OD/CC. Bank not found: {bank_name}")
                continue

            od_limits_json = json.dumps(format_od_limits(od.get("od_limits", [])))
            amt_type_os = amount_type_map.get(od.get("amount_type_os", "inr").lower(), 0)
            amt_type_od = amount_type_map.get(od.get("amount_type_od_cc", "inr").lower(), 0)

            od_cc_id = insert_data(INSERT_OD_CC, (
                org_id, company_id, report_id,
                od.get("os_amount"), od.get("amount"), od.get("type"),
                user_id, user_id, now, now,
                od_bank_id, od.get("int_rate"), od.get("name"), od.get("sanction_date"),
                od_limits_json, None,  # takeover_id is None initially
                amt_type_os, amt_type_od
            ))
            
            inserted_od_cc.append({
                'id': od_cc_id,
                'name': od.get("name"),
                'data': od
            })
            print(f"✅ Inserted OD/CC ID: {od_cc_id}, Name: {od.get('name')}, Bank: {bank_name}")

        except Exception as e:
            print(f"❌ Failed to insert OD/CC: {e}")

    # --- STEP 3: Process Takeover from repayment_summary ---
    print("🔄 STEP 3: Processing takeover loans from repayment_summary...")
    try:
        repayment_summary = data.get("repayment_summary") or {}
        takeover_list = repayment_summary.get("take_over") or []
        
        print(f"📋 Found {len(takeover_list)} takeover entries in repayment_summary")
        
        for takeover_entry in takeover_list:
            try:
                print(f"DEBUG: Processing takeover entry: {takeover_entry}")
                
                # Extract takeover details
                bank_name = takeover_entry.get("bank_name")
                original_amount = float(takeover_entry.get("original_amount", 0))
                interest_rate = float(takeover_entry.get("interest_rate", 0))
                duration = int(takeover_entry.get("duration", 0))
                start_date = takeover_entry.get("start_date")
                
                if not bank_name or not original_amount or not interest_rate or not duration:
                    print("⚠️ Skipping takeover due to missing required fields")
                    continue

                # Determine takeover type (assuming term loan for now)
                takeover_type = takeover_type_map.get("term_loan", 1)
                
                # Generate takeover name (similar to Rails pattern)
                takeover_name = f"TO-TL-{bank_name.upper().replace(' ', '')}-{original_amount/100000:.2f}L"
                
                print(f"🔄 Creating takeover: {takeover_name}")

                # STEP 3.1: Insert takeover record
                takeover_id = insert_data(INSERT_TAKEOVER_LOAN, (
                    report_id, takeover_type, interest_rate, duration,
                    user_id, user_id, now, now,
                    org_id, company_id, False,  # is_merged = False by default
                    start_date, takeover_name
                ))

                print(f"✅ Inserted takeover record with ID: {takeover_id}, Name: {takeover_name}")

                # STEP 3.2: Find matching existing loans
                matching_loans = find_matching_loans_by_bank_and_amount(
                    inserted_term_loans, bank_name, original_amount
                )
                
                if not matching_loans:
                    # Try to find in OD/CC if no term loans match
                    matching_loans = find_matching_loans_by_bank_and_amount(
                        inserted_od_cc, bank_name, original_amount
                    )
                    loan_type_for_update = "od_cc"
                else:
                    loan_type_for_update = "term_loan"

                # STEP 3.3: Update matching loans with takeover_id
                if matching_loans:
                    # Check if this should be a merged takeover
                    is_merged = len(matching_loans) > 1
                    
                    if is_merged:
                        # Update takeover record to set is_merged = True
                        update_data(
                            "UPDATE systemisers.project_report_takeovers SET is_merged = %s WHERE id = %s",
                            (True, takeover_id)
                        )
                        print(f"🔄 Updated takeover {takeover_id} as merged (multiple loans)")

                    for loan in matching_loans:
                        loan_id = loan['id']
                        try:
                            if loan_type_for_update == "term_loan":
                                affected_rows = update_data(UPDATE_TERM_LOAN_TAKEOVER, (takeover_id, now, loan_id))
                                if affected_rows > 0:
                                    print(f"✅ Updated term loan {loan_id} with takeover_id {takeover_id}")
                                    update_loan_bifurcation_status(report_id)
                                else:
                                    print(f"⚠️ No rows affected when updating term loan {loan_id}")
                            else:
                                affected_rows = update_data(UPDATE_OD_CC_TAKEOVER, (takeover_id, now, loan_id))
                                if affected_rows > 0:
                                    print(f"✅ Updated OD/CC {loan_id} with takeover_id {takeover_id}")
                                    update_loan_bifurcation_status(report_id)
                                else:
                                    print(f"⚠️ No rows affected when updating OD/CC {loan_id}")
                                    
                        except Exception as e:
                            print(f"❌ Failed to update loan {loan_id}: {e}")
                else:
                    print(f"⚠️ No matching loans found for takeover: Bank={bank_name}, Amount={original_amount}")

            except Exception as e:
                print(f"❌ Failed to process takeover entry: {e}")

    except Exception as e:
        print(f"❌ Error processing takeover from repayment_summary: {e}")

    # --- STEP 4: Process Legacy Takeover (if exists) ---
    print("🔄 STEP 4: Processing legacy takeover loans...")
    try:
        takeover_details = (data.get("proposed_loan_details") or {}).get("take_over_details") or {}
        
        # Process legacy takeover term loans
        for tl in takeover_details.get("term_loan_details") or []:
            try:
                print("DEBUG: Legacy Takeover Term loan entry:", tl)
                
                if not tl.get("num_installments") or not tl.get("int_rate"):
                    print("⚠️ Skipping legacy takeover term loan due to missing required fields")
                    continue

                takeover_type = takeover_type_map.get("term_loan", 1)
                is_merged = tl.get("is_merged", False)

                takeover_id = insert_data(INSERT_TAKEOVER_LOAN, (
                    report_id, takeover_type, float(tl.get("int_rate", 0)), int(tl.get("num_installments", 0)),
                    user_id, user_id, now, now,
                    org_id, company_id, is_merged, tl.get("sanction_date"), tl.get("name")
                ))

                print(f"✅ Inserted legacy takeover record with ID: {takeover_id}")

                # Find and update related term loans (existing logic)
                term_loan_ids_to_update = []
                
                if 'term_loan_ids' in tl:
                    term_loan_ids_to_update = tl['term_loan_ids']
                elif 'existing_loan_id' in tl:
                    term_loan_ids_to_update = [tl['existing_loan_id']]
                else:
                    takeover_name = tl.get("name", "")
                    for loan in inserted_term_loans:
                        loan_name = loan.get('name', '')
                        if loan_name and (loan_name in takeover_name or takeover_name.split('-')[-1] in loan_name):
                            term_loan_ids_to_update.append(loan['id'])
                            break

                for loan_id in term_loan_ids_to_update:
                    try:
                        affected_rows = update_data(UPDATE_TERM_LOAN_TAKEOVER, (takeover_id, now, loan_id))
                        if affected_rows > 0:
                            print(f"✅ Updated term loan {loan_id} with takeover_id {takeover_id}")
                            update_loan_bifurcation_status(report_id)
                    except Exception as e:
                        print(f"❌ Failed to update term loan {loan_id}: {e}")

            except Exception as e:
                print(f"❌ Failed to process legacy takeover term loan: {e}")

        # Process legacy takeover OD/CC loans
        for od in takeover_details.get("od_cc_details") or []:
            try:
                print("DEBUG: Legacy Takeover OD/CC entry:", od)
                
                takeover_type = takeover_type_map.get("od_cc", 0)
                is_merged = od.get("is_merged", False)

                takeover_id = insert_data(INSERT_TAKEOVER_LOAN, (
                    report_id, takeover_type, float(od.get("int_rate", 0)), 0,
                    user_id, user_id, now, now,
                    org_id, company_id, is_merged, od.get("sanction_date"), od.get("name")
                ))

                print(f"✅ Inserted legacy takeover OD/CC record with ID: {takeover_id}")

                # Find and update related OD/CC loans (existing logic)
                od_cc_ids_to_update = []
                
                if 'od_cc_ids' in od:
                    od_cc_ids_to_update = od['od_cc_ids']
                elif 'existing_loan_id' in od:
                    od_cc_ids_to_update = [od['existing_loan_id']]
                else:
                    takeover_name = od.get("name", "")
                    for odcc in inserted_od_cc:
                        odcc_name = odcc.get('name', '')
                        if odcc_name and (odcc_name in takeover_name or takeover_name.split('-')[-1] in odcc_name):
                            od_cc_ids_to_update.append(odcc['id'])
                            break

                for odcc_id in od_cc_ids_to_update:
                    try:
                        affected_rows = update_data(UPDATE_OD_CC_TAKEOVER, (takeover_id, now, odcc_id))
                        if affected_rows > 0:
                            print(f"✅ Updated OD/CC {odcc_id} with takeover_id {takeover_id}")
                            update_loan_bifurcation_status(report_id)
                    except Exception as e:
                        print(f"❌ Failed to update OD/CC {odcc_id}: {e}")

            except Exception as e:
                print(f"❌ Failed to process legacy takeover OD/CC: {e}")

    except Exception as e:
        print(f"❌ Error processing legacy takeover details: {e}")

    # --- STEP 5: Fresh Term Loans ---
    print("🔄 STEP 5: Processing fresh term loans...")
    try:
        fresh_loans = (data.get("proposed_loan_details") or {}).get("fresh_term_loan_details") or []
        for fresh in fresh_loans:
            try:
                new_loan_id = insert_data(INSERT_FRESH_LOAN, (
                    org_id, company_id, report_id,
                    fresh.get("num_installments"), float(fresh.get("int_rate", 0)), fresh.get("moratorium_period"),
                    user_id, user_id, now, now,
                    fresh.get("name"), fresh.get("sanction_date")
                ))

                for asset in fresh.get("assets") or []:
                    insert_data(INSERT_ASSET, (
                        org_id, company_id, asset.get("name"), int(asset.get("type_id", 0)), 
                        float(asset.get("original_value", 0)),
                        float(asset.get("margin", 0)), new_loan_id, float(asset.get("promoter_contribution", 0)),
                        user_id, now, now
                    ))

            except Exception as e:
                print(f"❌ Failed to insert fresh loan: {e}")

    except Exception as e:
        print(f"❌ Error processing fresh loans: {e}")

    # --- STEP 6: Loan Bifurcation ---
    print("🔄 STEP 6: Processing loan bifurcation...")
    try:
        bifurcation_list = data.get("loan_bifurcation_details") or []
        for bifur in bifurcation_list:
            try:
                insert_data(
                    INSERT_LOAN_BIFURCATION,
                    (
                        org_id, company_id, report_id,
                        bifur.get("financial_year"), bifur.get("bank_od"), bifur.get("rel_party_loan"), bifur.get("other_loan"),
                        False, bifur.get("total_loan"),
                        user_id, user_id, now, now,
                        bifur.get("term_loans"), bifur.get("business_loans")
                    )
                )
            except Exception as e:
                print(f"❌ Failed to insert loan bifurcation: {e}")

    except Exception as e:
        print(f"❌ Error processing loan bifurcation: {e}")

    # --- STEP 7: Assumption Details ---
    print("🔄 STEP 7: Processing assumption details...")
    try:
        assumption_details = data.get("assumption_details") or {}
        assumption_list = assumption_details.get("assumption_details", [{}])
        
        if isinstance(assumption_list, list) and len(assumption_list) > 0:
            assumption_json = assumption_list[0]
        elif isinstance(assumption_list, dict):
            assumption_json = assumption_list
        else:
            assumption_json = {}

        print("DEBUG: Assumption JSON:", assumption_json)
        
        itr_version_code = itr_version_map.get(assumption_json.get("itr_version", "").upper(), 0)

        assumption_id = insert_data(INSERT_ASSUMPTION, (
            org_id, company_id, report_id,
            assumption_json.get("profit_margin"), assumption_json.get("profit_margin_hist_pct"), assumption_json.get("profit_margin_type"),
            assumption_json.get("customer_credit_period"), assumption_json.get("supplier_credit_period"), itr_version_code,
            user_id, user_id, now, now,
            assumption_json.get("related_party_amount"), assumption_json.get("other_loan_amount"),
            assumption_json.get("description"), assumption_json.get("customer_credit_hist_pct"),
            assumption_json.get("supplier_credit_hist_pct"), assumption_json.get("od_amount")
        ))

        detail_rows = []
        details = assumption_json.get("details") or {}
        
        if isinstance(details, list):
            print("⚠️ Details is a list, expected dict. Converting...")
            details = {}
        
        for group, entries in details.items():
            if not isinstance(entries, list):
                print(f"⚠️ Entries for group {group} is not a list, skipping")
                continue
                
            for entry in entries:
                if not isinstance(entry, dict):
                    print(f"⚠️ Entry {entry} is not a dict, skipping")
                    continue
                    
                year_type = year_type_map.get(entry.get("year_type", "").lower(), 0)
                detail_rows.append((
                    assumption_id, entry.get("assumptions_type_id"), entry.get("financial_year"),
                    entry.get("value"), entry.get("percentage_increase"), year_type,
                    user_id, now, now
                ))

        if detail_rows:
            insert_many(INSERT_ASSUMPTION_DETAIL, detail_rows)

    except Exception as e:
        print(f"❌ Error processing assumption details: {e}")

    print(f"\n🎉 Project report (ID: {report_id}) inserted successfully!")
    print(f"📊 Summary:")
    print(f"   - Term Loans: {len(inserted_term_loans)}")
    print(f"   - OD/CC Loans: {len(inserted_od_cc)}")
    print(f"   - Report ID: {report_id}")
    
    return report_id

from datetime import datetime
from db_utils.db_utils import insert_data
from queries.enhancement_queries import INSERT_OD_CC_ENHANCEMENT

# Mapping of amount types to internal codes
amount_type_map = {"inr": 0, "lakhs": 1, "crores": 2}

def insert_od_cc_enhancement_details(data, org_id, company_id, report_id, user_id):
    now = datetime.now()

    # Navigate to the enhancement loan list
    enhancement_list = (
        data.get("user_input", {})
            .get("proposed_loan_details", {})
            .get("od_cc_enhancement_details", [])
    )

    if not enhancement_list:
        print("⚠️ No OD/CC enhancement details found.")
        return

    print(f"🔍 Found {len(enhancement_list)} OD/CC enhancement loan(s).")

    for enhancement in enhancement_list:
        try:
            name = enhancement.get("name", "Unnamed")
            amount = enhancement.get("amount", 0)
            int_rate = enhancement.get("int_rate", 0.0)
            enhancement_amount = enhancement.get("enhancement_amount", 0)
            sanction_date = enhancement.get("sanction_date")
            amount_type_str = enhancement.get("amount_type", "inr").lower()
            amount_type_id = amount_type_map.get(amount_type_str, 0)

            # Insert enhancement record
            enhancement_id = insert_data(INSERT_OD_CC_ENHANCEMENT, (
                amount, int_rate, 2,  # type=2 → enhancement
                enhancement_amount,
                org_id, company_id, report_id,
                user_id, user_id, now, now,
                name, sanction_date, amount_type_id
            ))

            print(f"✅ Successfully inserted OD/CC enhancement loan: {name}, ID: {enhancement_id}")

        except Exception as e:
            print(f"❌ Failed to insert OD/CC enhancement loan '{enhancement.get('name', 'Unnamed')}': {e}")

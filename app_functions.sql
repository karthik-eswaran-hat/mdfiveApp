CREATE OR REPLACE FUNCTION test_suite.get_valid_report_sample_counts_app(min_report_id INTEGER)
RETURNS TABLE(report_count INTEGER, sample_report_id TEXT)
LANGUAGE sql
AS $$
WITH
report_data AS (
  SELECT *
  FROM (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY report_id ORDER BY created_at DESC) rn
    FROM systemisers.project_report_stages rt
    WHERE report_json IS NOT NULL AND report_id > min_report_id
  ) t
),
asset_data AS (
  SELECT
    rt.report_id, rt.rn, rt.id,
    asset_data.key,
    ROUND(asset_data.value::numeric / 100000, 2) AS value
  FROM report_data rt
  INNER JOIN jsonb_each_text(
    report_json -> 'project_report' -> 'balance_sheet' -> 'asset_summary' -> 'total_assets'
  ) AS asset_data(key, value)
    ON TRUE
  WHERE key != 'md5'
),
liab_data AS (
  SELECT
    rt.report_id, rt.rn, rt.id,
    asset_data.key,
    ROUND(asset_data.value::numeric / 100000, 2) AS value
  FROM report_data rt
  INNER JOIN jsonb_each_text(
    report_json -> 'project_report' -> 'balance_sheet' -> 'liability_summary' -> 'liability_total'
  ) AS asset_data(key, value)
    ON TRUE
  WHERE key != 'md5'
),
valid_reports AS (
  SELECT ad.report_id, ad.id, MAX(ABS(ad.value - ld.value)) AS diff
  FROM asset_data ad
  INNER JOIN liab_data ld
    ON ld.report_id = ad.report_id AND ad.id = ld.id AND ld.key = ad.key
  GROUP BY ad.report_id, ad.id
  HAVING MAX(ABS(ad.value - ld.value)) <= 0.1
)
SELECT
  COUNT(*) AS report_count,
  MIN(rd.report_id || '_' || rd.id) AS sample_report_id
FROM report_data rd
INNER JOIN valid_reports vr ON vr.report_id = rd.report_id AND vr.id = rd.id
GROUP BY test_suite.remove_keys_recursively_from_json(
  rd.report_json -> 'user_input',
  ARRAY['md5', 'created_at', 'report_id', 'is_psb', 'is_active']
);
$$;




-- Function to load valid sample report and create test data if not exists
-- SELECT * FROM test_suite.load_valid_sample_report(1195);

CREATE OR REPLACE FUNCTION test_suite.load_valid_sample_report_app(min_report_id INTEGER)
RETURNS TABLE(result TEXT)
LANGUAGE sql
AS $$
WITH
report_data AS (
  SELECT *
  FROM (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY report_id ORDER BY created_at DESC) rn
    FROM systemisers.project_report_stages rt
    WHERE report_json IS NOT NULL AND report_id > min_report_id
  ) t
),
asset_data AS (
  SELECT
    rt.report_id, rt.rn, rt.id,
    asset_data.key,
    ROUND(asset_data.value::numeric / 100000, 2) AS value
  FROM report_data rt
  INNER JOIN jsonb_each_text(
    report_json -> 'project_report' -> 'balance_sheet' -> 'asset_summary' -> 'total_assets'
  ) AS asset_data(key, value)
    ON TRUE
  WHERE key != 'md5'
),
liab_data AS (
  SELECT
    rt.report_id, rt.rn, rt.id,
    asset_data.key,
    ROUND(asset_data.value::numeric / 100000, 2) AS value
  FROM report_data rt
  INNER JOIN jsonb_each_text(
    report_json -> 'project_report' -> 'balance_sheet' -> 'liability_summary' -> 'liability_total'
  ) AS asset_data(key, value)
    ON TRUE
  WHERE key != 'md5'
),
valid_reports AS (
  SELECT ad.report_id, ad.id, MAX(ABS(ad.value - ld.value)) AS diff
  FROM asset_data ad
  INNER JOIN liab_data ld
    ON ld.report_id = ad.report_id AND ad.id = ld.id AND ld.key = ad.key
  GROUP BY ad.report_id, ad.id
  HAVING MAX(ABS(ad.value - ld.value)) <= 0.1
),
sample_report AS (
  SELECT MIN(rd.report_id || '_' || rd.id) AS sample_report_id
  FROM report_data rd
  INNER JOIN valid_reports vr ON vr.report_id = rd.report_id AND vr.id = rd.id
  GROUP BY test_suite.remove_keys_recursively_from_json(
    rd.report_json -> 'user_input',
    ARRAY['md5', 'created_at', 'report_id', 'is_psb', 'is_active']
  )
)
SELECT
  test_suite.create_report_test_data_if_not_exists_app(
    split_part(sample_report_id, '_', 1)::INT,
    split_part(sample_report_id, '_', 2)::INT
  ) AS result
FROM sample_report;
$$;





CREATE OR REPLACE FUNCTION test_suite.create_report_test_data_if_not_exists_app(
    p_report_id INT,
    p_id INT DEFAULT NULL,
    p_report_name TEXT DEFAULT NULL,
    test_tags TEXT[] DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    user_input_json JSONB;
    json_md5 TEXT;
    final_report_name TEXT;
  /* 
    SELECT test_suite.create_report_test_data_if_not_exists_app(190);

    SELECT test_suite.create_report_test_data_if_not_exists_app(188, 'test_report', ARRAY['regression', 'smoke']);
  */
BEGIN

    user_input_json := test_suite.get_user_input_details_from_report(p_report_id, p_id);

    json_md5 := test_suite.compute_flat_json_md5(user_input_json);

    final_report_name := COALESCE(p_report_name, 'Report_' || p_report_id || '_' || COALESCE(p_id::TEXT, 'latest'));

    IF NOT EXISTS (
        SELECT 1
        FROM test_suite.json_report_test_data_app
        WHERE user_input_data_md5 = json_md5
    ) THEN
        INSERT INTO test_suite.json_report_test_data_app (
            report_name,
            user_input_data,
            user_input_data_md5,
            project_report_json,
            report_tags,
            created_at
        )
        VALUES (
            final_report_name,
            user_input_json,
            json_md5,
            (
                SELECT report_json
                FROM systemisers.project_report_stages
                WHERE report_id = p_report_id
                  AND (p_id IS NULL OR id = p_id)
                  AND report_json IS NOT NULL
                ORDER BY created_at DESC
                LIMIT 1
            ),
            test_tags,
            NOW()
        );
    END IF;
END;
$$ LANGUAGE plpgsql;






CREATE OR REPLACE VIEW test_suite.report_combination_summary_app AS
SELECT
    TRIM(BOTH ', ' FROM CONCAT_WS(', ',
        CASE WHEN pr.is_fresh_term_loan = 1 THEN 'Fresh Term Loan' END,
        CASE WHEN pr.is_od_enhancement = 1 THEN 'OD Enhancement' END,
        CASE WHEN pr.is_takeover = 1 THEN 'Takeover' END,
        CASE WHEN pr.is_od_renewal = 1 THEN 'OD Renewal' END,
        CASE WHEN pr.is_od_fresh = 1 THEN 'OD Fresh' END
    )) AS report_combination,
    COUNT(*) AS report_count
FROM (
    SELECT
        td.id,
        MAX(CASE WHEN fj.key_path = 'what_you_want_details.is_fresh_term_loan' AND fj.value::boolean THEN 1 ELSE 0 END) AS is_fresh_term_loan,
        MAX(CASE WHEN fj.key_path = 'what_you_want_details.is_od_enhancement' AND fj.value::boolean THEN 1 ELSE 0 END) AS is_od_enhancement,
        MAX(CASE WHEN fj.key_path = 'what_you_want_details.is_takeover' AND fj.value::boolean THEN 1 ELSE 0 END) AS is_takeover,
        MAX(CASE WHEN fj.key_path = 'what_you_want_details.is_od_renewal' AND fj.value::boolean THEN 1 ELSE 0 END) AS is_od_renewal,
        MAX(CASE WHEN fj.key_path = 'what_you_want_details.is_od_fresh' AND fj.value::boolean THEN 1 ELSE 0 END) AS is_od_fresh
    FROM test_suite.json_report_test_data_app td
    INNER JOIN LATERAL systemisers.flatten_json_full(td.user_input_data) fj ON true
    WHERE fj.key_path ~ 'what_you_want_details\.is_'
    GROUP BY td.id
) pr
GROUP BY
    TRIM(BOTH ', ' FROM CONCAT_WS(', ',
        CASE WHEN pr.is_fresh_term_loan = 1 THEN 'Fresh Term Loan' END,
        CASE WHEN pr.is_od_enhancement = 1 THEN 'OD Enhancement' END,
        CASE WHEN pr.is_takeover = 1 THEN 'Takeover' END,
        CASE WHEN pr.is_od_renewal = 1 THEN 'OD Renewal' END,
        CASE WHEN pr.is_od_fresh = 1 THEN 'OD Fresh' END
    ))
ORDER BY report_count DESC;



CREATE OR REPLACE FUNCTION systemisers.compare_flattened_json_by_report_id(
    p_report_id_1 INT,
    p_report_id_2 INT,
    p_project_report_stage_id_1 INT DEFAULT NULL,
    p_project_report_stage_id_2 INT DEFAULT NULL
)
RETURNS TABLE (
    diff_key_path TEXT,
    value_1 TEXT,
    value_2 TEXT
) AS $$
BEGIN
/*
  SELECT * FROM systemisers.compare_flattened_json_by_report_id(<first_report_id>, <second_report_id>, <first_report_stage_id> optional, <second_report_stage_id> optional);
  
  SELECT * FROM systemisers.compare_flattened_json_by_report_id(190, 188);

  SELECT * FROM systemisers.compare_flattened_json_by_report_id(173, 173, 926, 863);

*/
    RETURN QUERY
    WITH
    json_1 AS (
        SELECT report_json
        FROM systemisers.project_report_stages
        WHERE report_id = p_report_id_1
          AND id = COALESCE(p_project_report_stage_id_1, id)
          AND report_json IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1
    ),
    json_2 AS (
        SELECT report_json
        FROM systemisers.project_report_stages
        WHERE report_id = p_report_id_2
          AND id = COALESCE(p_project_report_stage_id_2, id)
          AND report_json IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1
    ),
    flat_1 AS (
        SELECT key_path AS kp, value AS value_1
        FROM systemisers.flatten_json_full((SELECT report_json FROM json_1))
    ),
    flat_2 AS (
        SELECT key_path AS kp, value AS value_2
        FROM systemisers.flatten_json_full((SELECT report_json FROM json_2))
    ),
    merged AS (
        SELECT
            COALESCE(f1.kp, f2.kp) AS diff_key_path,
            f1.value_1,
            f2.value_2
        FROM flat_1 f1
        FULL OUTER JOIN flat_2 f2 ON f1.kp = f2.kp
    )
    SELECT *
    FROM merged
    WHERE merged.value_1 IS DISTINCT FROM merged.value_2;
END;
$$ LANGUAGE plpgsql;
import service from "../lib/axios";

export function getValidReport(){
    return service({
        url:"api/test",
        method:"get"
    })
}

export function loadTestData(){
    return service({
        url:"api/load-test-data",
        method:"post"
    })
}

export function getReportCombination(){
    return service({
      url:"api/reportSummary",
      method:"get"
    })
}

export function compareReport(
  reportId1: number, 
  reportId2: number, 
  projectReportStageId1?: number, 
  projectReportStageId2?: number, 
  insertFlag: boolean = false
) {
  const params: any = { 
    report_id_1: reportId1, 
    report_id_2: reportId2,
    insert_flag: insertFlag.toString()
  };
  
  if (projectReportStageId1) {
    params.project_report_stage_id_1 = projectReportStageId1;
  }
  
  if (projectReportStageId2) {
    params.project_report_stage_id_2 = projectReportStageId2;
  }
  
  return service({
    url: "api/reportComparison",
    method: "get",
    params: params,
  });
}


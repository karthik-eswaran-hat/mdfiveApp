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

export function compareReport(reportId1 :number, reportId2 :number) {
  return service({
    url: "api/reportComparison",
    method: "get",
    params: { report_id_1: reportId1, report_id_2: reportId2 },
  });
}


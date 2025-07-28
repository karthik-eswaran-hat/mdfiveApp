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


import service from "../lib/axios";



export function getValidReport(){
    return service({
        url:"api/test",
        method:"get"
    })
}
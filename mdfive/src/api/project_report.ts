import service from "../lib/axios";



export function getUser(){
    return service({
        url:"api/test",
        method:"get"
    })
}
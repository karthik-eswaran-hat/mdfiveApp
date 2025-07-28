import { useQuery } from "@tanstack/react-query"
import { getValidReport } from "../api/project_report"

const LoadPage = () => {

  const { getReport} = useQuery ({
    queryKey: ['user'],
    queryFn: () => getValidReport()
  })
  


  return (
    <div>
      <h1>Loading</h1>
      
    </div>
  )
}

export default LoadPage

import { useQuery } from "@tanstack/react-query"
import { getUser } from "../api/project_report"

const LoadPage = () => {

  const { data } = useQuery ({
    queryKey: ['user'],
    queryFn: () => getUser()
  })
  


  return (
    <div>
      <h1>Loading</h1>
      
    </div>
  )
}

export default LoadPage

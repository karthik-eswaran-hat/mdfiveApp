import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Button, Table, Spinner, Alert, Pagination } from "react-bootstrap"
import { getValidReport } from "../api/project_report"
import SideBar from "./sideBar"

const LoadPage = () => {
  const [enabled, setEnabled] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const {
    data: reports,
    refetch,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ["validReport"],
    queryFn: async () => {
      const response = await getValidReport()
      return response.data.data
    },
    enabled: enabled,
  })

  const handleGetReport = () => {
    setEnabled(true)
    refetch()
    setCurrentPage(1) // Reset to first page every time data is refreshed
  }

  const totalPages = reports ? Math.ceil(reports.length / itemsPerPage) : 0
  const paginatedReports = reports
    ? reports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : []

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    let pages = []
    for (let number = 1; number <= totalPages; number++) {
      pages.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      )
    }

    return <Pagination className="mt-3">{pages}</Pagination>
  }

  return (
    <>
    <SideBar />
      <div className="container mt-5">
      <h2 className="mb-4">Report Viewer</h2>

      <Button onClick={handleGetReport} variant="primary" disabled={isFetching}>
        {isFetching ? <Spinner size="sm" animation="border" /> : "Get New Report"}
      </Button>
      {!isFetching && reports?.length > 0 && (
        <div className="alert alert-success alert-dismissible fade show mt-3" role="alert">
          Successfully fetched the new report
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}
    

      {isError && (
        <Alert variant="danger" className="mt-3">
          Error: {error.message}
        </Alert>
      )}
      <div className="mt-4">
        <strong>Total Reports: {reports?.length || 0}</strong>
      </div>

      <Table striped bordered hover responsive className="mt-4">
        <thead className="table-dark">
          <tr>
            <th>S.NO</th>
            <th>Sample Report ID</th>
            <th>Report Count</th>
          </tr>
        </thead>
        <tbody>
          {paginatedReports?.length > 0 ? (
            paginatedReports.map((report, index) => (
              <tr key={index}>
                <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td>{report.sample_report_id}</td>
                <td>{report.report_count}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="text-center">
                {isFetching ? "Loading..." : "No reports available"}
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {paginatedReports?.length > 0 && renderPagination()}

      </div>
    </>

  )
}

export default LoadPage

import { useQuery, useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { Button, Table, Spinner, Alert, Pagination, Row, Col } from "react-bootstrap"
import { getValidReport, loadTestData } from "../api/project_report"
import SideBar from "./SideBar"

const LoadPage = () => {
  const [enabled, setEnabled] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [loadDataSuccess, setLoadDataSuccess] = useState(false)
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
    enabled: false,
  })

  const loadDataMutation = useMutation({
    mutationFn: loadTestData,
    onSuccess: (data) => {
      console.log('Load data success:', data)
      setLoadDataSuccess(true)
      setTimeout(() => setLoadDataSuccess(false), 5000)
      if (enabled) {
        refetch()
      }
    },
    onError: (error) => {
      console.error('Load data error:', error)
    },
  })

  const handleGetReport = () => {
    setEnabled(true)
    refetch()
    setCurrentPage(1) 
  }

  const handleLoadData = () => {
    loadDataMutation.mutate()
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
    <Row>
      <Col md={2}>
        <SideBar />
      </Col>
      <Col>
        <div className="container mt-5">
          <h2 className="mb-4">Report Viewer</h2>

          <div className="d-flex gap-2 mb-3">
            <Button onClick={handleGetReport} variant="primary" disabled={isFetching}>
              {isFetching ? <Spinner size="sm" animation="border" /> : "Get New Report"}
            </Button>
            
            <Button 
              onClick={handleLoadData} 
              variant="success" 
              disabled={loadDataMutation.isPending || !reports}
            >
              {loadDataMutation.isPending ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Loading Data...
                </>
              ) : (
                "Load Data"
              )}
            </Button>
          </div>

          {!isFetching && reports?.length > 0 && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              Successfully fetched the new report
              <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
          )}

          {loadDataSuccess && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              Data loaded successfully to the database!
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setLoadDataSuccess(false)}
                aria-label="Close"
              ></button>
            </div>
          )}

          {isError && (
            <Alert variant="danger" className="mt-3">
              Error: {error.message}
            </Alert>
          )}

          {loadDataMutation.isError && (
            <Alert variant="danger" className="mt-3">
              Load Data Error: {loadDataMutation.error.message}
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
      </Col>

    </Row>
    
    </>

  )
}

export default LoadPage
import { Col, Row, Table, Spinner, Alert } from "react-bootstrap";
import SideBar from "./SideBar";
import { getReportCombination } from "../api/project_report";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const {
    data: chartData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["reportCombination"],
    queryFn: async () => {
      const response = await getReportCombination();
      return response.data.data;
    },
  });

  return (
    <>
      <Row>
        <Col md={2}>
          <SideBar />
        </Col>
        <Col md={10}>
          <div className="container mt-5">
            <h2 className="mb-4">Report Combination Summary</h2>

            {isLoading && (
              <div className="d-flex justify-content-center my-4">
                <Spinner animation="border" variant="primary" />
              </div>
            )}

            {isError && (
              <Alert variant="danger" className="mt-3">
                Error: {error.message}
              </Alert>
            )}

            {!isLoading && chartData?.length > 0 && (
              <Table striped bordered hover responsive className="mt-4">
                <thead className="table-dark">
                  <tr>
                    <th>S.NO</th>
                    <th>Report Combination</th>
                    <th>Report Count</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((report, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{report.report_combination}</td>
                      <td>{report.report_count}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}

            {!isLoading && chartData?.length === 0 && (
              <Alert variant="info">No data available</Alert>
            )}
          </div>
        </Col>
      </Row>
    </>
  );
};

export default Dashboard;

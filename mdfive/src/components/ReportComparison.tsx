import { useQuery } from "@tanstack/react-query";
import { Col, Row, Table, Card, Form, Button, Spinner } from "react-bootstrap";
import SideBar from "./SideBar";
import { compareReport } from "../api/project_report";
import { useState } from "react";

const ReportComparison = () => {
  const [reportId1, setReportId1] = useState<number>();
  const [reportId2, setReportId2] = useState<number>();
  const [submittedIds, setSubmittedIds] = useState(null);

  const {
    data: reports,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["reportComparison", reportId1, reportId2],
    queryFn: async () => {
      const response = await compareReport(reportId1, reportId2);
      return response.data.data;
    },
    enabled: false,
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reportId1 || !reportId2) return;
    setSubmittedIds({ reportId1, reportId2 });
    refetch();
  };

  return (
    <>
      <Row>
        <Col md={2}>
          <SideBar />
        </Col>

        <Col md={10} style={{ padding: "20px" }}>
          <Card className="mb-4">
            <Card.Header>
              <h5>Enter Comparison Details</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="reportId1">
                  <Form.Label>Report ID 1</Form.Label>
                  <Form.Control
                    type="number"
                    value={reportId1}
                    onChange={(e) => setReportId1(Number(e.target.value))}
                    placeholder="Enter report id 1"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="reportId2">
                  <Form.Label>Report ID 2</Form.Label>
                  <Form.Control
                    type="number"
                    value={reportId2}
                    onChange={(e) => setReportId2(Number(e.target.value))}
                    placeholder="Enter report id 2"
                    required
                  />
                </Form.Group>
                <Button variant="primary" type="submit" disabled={isFetching}>
                  {isFetching ? "Loading..." : "Compare Reports"}
                </Button>
              </Form>
            </Card.Body>
          </Card>

          {!isFetching && reports?.length > 0 && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              Successfully fetched the new report
              <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
          )}

           
          {isFetching ? <Spinner size="sm" animation="border" /> : "Get New Report"}

          <>
            <h2 className="d-flex justify-content-center">📊 Report Comparison</h2>
            <div style={{ marginBottom: "1rem" }}>
              <p><strong>Report ID 1:</strong> {submittedIds?.reportId1}</p>
              <p><strong>Report ID 2:</strong> {submittedIds?.reportId2}</p>
              <p><strong>Total Differences Found:</strong> {reports &&reports.length}</p>
            </div>

            <div style={{ maxHeight: "500px", overflowY: "auto", border: "1px solid #ccc" }}>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Difference Path</th>
                    <th>Value (Report 1)</th>
                    <th>Value (Report 2)</th>
                  </tr>
                </thead>
                <tbody>
                  {reports &&reports.map((diff, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{diff.diff_key_path}</td>
                      <td>{diff.value_1}</td>
                      <td>{diff.value_2}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </>
        </Col>
      </Row>
    </>
  );
};

export default ReportComparison;

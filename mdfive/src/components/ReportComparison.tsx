import { useQuery } from "@tanstack/react-query";
import { Col, Row, Table, Card, Form, Button, Spinner } from "react-bootstrap";
import SideBar from "./SideBar";
import { compareReport } from "../api/project_report";
import { useState } from "react";

const ReportComparison = () => {
  const [reportId1, setReportId1] = useState<number>();
  const [reportId2, setReportId2] = useState<number>();
  const [projectReportStageId1, setProjectReportStageId1] = useState<number>();
  const [projectReportStageId2, setProjectReportStageId2] = useState<number>();
  const [submittedIds, setSubmittedIds] = useState(null);
  const [insertFlag, setInsertFlag] = useState<boolean>(false);

  const {
    data: reports,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["reportComparison", reportId1, reportId2, projectReportStageId1, projectReportStageId2, insertFlag],
    queryFn: async () => {
      const response = await compareReport(reportId1, reportId2, projectReportStageId1, projectReportStageId2, insertFlag);
      return response.data.data;
    },
    enabled: false,
  });

  const handleSubmit = (e, shouldInsert = false) => {
    e.preventDefault();
    if (!reportId1 || !reportId2) return;
    setInsertFlag(shouldInsert);
    setSubmittedIds({ reportId1, reportId2, projectReportStageId1, projectReportStageId2, insertFlag: shouldInsert });
    refetch();
  };

  const handleReset = () => {
    setReportId1(undefined);
    setReportId2(undefined);
    setProjectReportStageId1(undefined);
    setProjectReportStageId2(undefined);
    setSubmittedIds(null);
    setInsertFlag(false);
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
              <Form onSubmit={(e) => handleSubmit(e, false)}>
                
                {/* Row for Report 1 & Stage 1 */}
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="reportId1">
                      <Form.Label>
                        Report ID 1 <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="number"
                        value={reportId1 ?? ""}
                        onChange={(e) => setReportId1(Number(e.target.value))}
                        placeholder="Enter report id 1"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="projectReportStageId1">
                      <Form.Label>Stage ID 1</Form.Label>
                      <Form.Control
                        type="number"
                        value={projectReportStageId1 ?? ""}
                        onChange={(e) => setProjectReportStageId1(Number(e.target.value))}
                        placeholder="Enter stage id 1"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Row for Report 2 & Stage 2 */}
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="reportId2">
                      <Form.Label>
                        Report ID 2 <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="number"
                        value={reportId2 ?? ""}
                        onChange={(e) => setReportId2(Number(e.target.value))}
                        placeholder="Enter report id 2"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="projectReportStageId2">
                      <Form.Label>Stage ID 2</Form.Label>
                      <Form.Control
                        type="number"
                        value={projectReportStageId2 ?? ""}
                        onChange={(e) => setProjectReportStageId2(Number(e.target.value))}
                        placeholder="Enter stage id 2"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex gap-2">
                  <Button variant="primary" type="submit" disabled={isFetching}>
                    {isFetching && !insertFlag ? "Comparing..." : "Compare Reports"}
                  </Button>
                  <Button 
                    variant="success" 
                    type="button" 
                    onClick={(e) => handleSubmit(e, true)}
                    disabled={isFetching}
                  >
                    {isFetching && insertFlag ? "Comparing & Inserting..." : "Compare & Insert"}
                  </Button>
                  <Button variant="secondary" type="button" onClick={handleReset}>
                    Reset
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {!isFetching && reports?.length > 0 && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              Successfully fetched the new report
              {submittedIds?.insertFlag && " and inserted into database"}
              <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
          )}

          {isFetching ? (
            <Spinner size="sm" animation="border" />
          ) : (
            <p>Get New Report</p>
          )}

          <>
            <h2 className="d-flex justify-content-center">📊 Report Comparison</h2>
            <div style={{ marginBottom: "1rem" }}>
              <p><strong>Report ID 1:</strong> {submittedIds?.reportId1}</p>
              <p><strong>Report ID 2:</strong> {submittedIds?.reportId2}</p>
              {submittedIds?.projectReportStageId1 && (
                <p><strong>Project Report Stage ID 1:</strong> {submittedIds.projectReportStageId1}</p>
              )}
              {submittedIds?.projectReportStageId2 && (
                <p><strong>Project Report Stage ID 2:</strong> {submittedIds.projectReportStageId2}</p>
              )}
              <p><strong>Total Differences Found:</strong> {reports && reports.length}</p>
              {submittedIds?.insertFlag && (
                <p><strong>Action:</strong> <span className="badge bg-success">Compared & Inserted</span></p>
              )}
              {submittedIds?.insertFlag === false && (
                <p><strong>Action:</strong> <span className="badge bg-primary">Compared Only</span></p>
              )}
            </div>

            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Difference Path</th>
                  <th>
                    Value (
                    {submittedIds?.reportId1}
                    {submittedIds?.projectReportStageId1
                      ? `_${submittedIds.projectReportStageId1}`
                      : ""}
                    )
                  </th>
                  <th>
                    Value (
                    {submittedIds?.reportId2}
                    {submittedIds?.projectReportStageId2
                      ? `_${submittedIds.projectReportStageId2}`
                      : ""}
                    )
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports && reports.map((diff, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{diff.diff_key_path}</td>
                    <td>{diff.value_1}</td>
                    <td>{diff.value_2}</td>
                  </tr>
                ))}
              </tbody>
            </Table>

          </>
        </Col>
      </Row>
    </>
  );
};

export default ReportComparison;
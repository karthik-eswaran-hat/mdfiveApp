import { useState } from 'react';
import {
  Button,
  Table,
  Spinner,
  Alert,
  Form,
  Row,
  Col,
  Card
} from 'react-bootstrap';
import { useMutation, useQuery } from '@tanstack/react-query';
import SideBar from './SideBar';
import service from '../lib/axios';

interface ProcessedReport {
  report_name: string;
  report_id: number;
  status: string;
}

interface ReportData {
  processed_count: number;
  failed_count: number;
  processed_reports: ProcessedReport[];
  failed_reports: any[];
}

const ProcessReports = () => {
  const [singleReportName, setSingleReportName] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null); // Track which report is downloading

  // Query to fetch all processed reports
  const {
    data: allReports,
    isLoading: reportsLoading,
    refetch: refetchReports
  } = useQuery({
    queryKey: ['allReports'],
    queryFn: async () => {
      const response = await service({ url: 'api/reports', method: 'get' });
      return response.data.data;
    },
    enabled: false // Only fetch when manually triggered
  });

  // Mutation for processing a single report
  const processSingleMutation = useMutation({
    mutationFn: async (reportName: string) => {
      const response = await service({
        url: 'api/process-single-report',
        method: 'post',
        data: { report_name: reportName }
      });
      return response.data;
    },
    onSuccess: () => {
      setSingleReportName('');
      refetchReports();
    }
  });

  // Mutation for downloading a report
  const downloadMutation = useMutation({
    mutationFn: async (reportId: number) => {
      setDownloadingId(reportId); // Set which report is being downloaded
      const response = await service({
        url: 'api/download-report',
        method: 'post',
        data: { report_id: reportId }
      });
      return response.data;
    },
    onSuccess: () => {
      setDownloadingId(null); // Reset downloading state
    },
    onError: () => {
      setDownloadingId(null); // Reset downloading state on error
    }
  });

  const handleProcessSingle = () => {
    if (singleReportName.trim()) {
      processSingleMutation.mutate(singleReportName.trim());
    }
  };

  const handleDownload = (reportId: number) => {
    downloadMutation.mutate(reportId);
  };

  const handleGetAllReports = () => {
    refetchReports();
  };

  return (
    <Row>
      <Col md={2}>
        <SideBar />
      </Col>
      <Col md={10}>
        <div className="container mt-5">
          <h2 className="mb-4">Process Reports</h2>

          {/* Process a Single Report */}
          <Card className="mb-4">
            <Card.Header>
              <h5>Process Single Report</h5>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Report Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Report_1366_latest"
                  value={singleReportName}
                  onChange={(e) => setSingleReportName(e.target.value)}
                />
              </Form.Group>
              <Button
                onClick={handleProcessSingle}
                disabled={
                  processSingleMutation.isPending || !singleReportName.trim()
                }
                variant="primary"
              >
                {processSingleMutation.isPending ? (
                  <>
                    <Spinner size="sm" animation="border" className="me-2" />
                    Processing...
                  </>
                ) : (
                  'Process Report'
                )}
              </Button>
            </Card.Body>
          </Card>

          {/* Alerts */}
          {processSingleMutation.isSuccess && (
            <Alert variant="success" className="mb-3">
              Report processed successfully! ID:{' '}
              {processSingleMutation.data?.data?.report_id}
            </Alert>
          )}

          {processSingleMutation.isError && (
            <Alert variant="danger" className="mb-3">
              Error: {processSingleMutation.error?.message}
            </Alert>
          )}

          {downloadMutation.isSuccess && (
            <Alert variant="success" className="mb-3">
              Report downloaded successfully!
            </Alert>
          )}

          {downloadMutation.isError && (
            <Alert variant="danger" className="mb-3">
              Download Error: {downloadMutation.error?.message}
            </Alert>
          )}

          {/* All Reports Table */}
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5>All Processed Reports</h5>
              <Button onClick={handleGetAllReports} disabled={reportsLoading}>
                {reportsLoading ? (
                  <Spinner size="sm" animation="border" />
                ) : (
                  'Refresh'
                )}
              </Button>
            </Card.Header>
            <Card.Body>
              {allReports && allReports.length > 0 ? (
                <Table striped bordered hover responsive>
                  <thead className="table-dark">
                    <tr>
                      <th>Report ID</th>
                      <th>Bank</th>
                      <th>Loan Scheme</th>
                      <th>Fresh TL</th>
                      <th>OD Enhancement</th>
                      <th>Takeover</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allReports.map((report: any) => (
                      <tr key={report.id}>
                        <td>{report.id}</td>
                        <td>{report.bank_name || 'N/A'}</td>
                        <td>{report.loan_scheme_name || 'N/A'}</td>
                        <td>{report.is_fresh_term_loan ? 'Yes' : 'No'}</td>
                        <td>{report.is_od_enhancement ? 'Yes' : 'No'}</td>
                        <td>{report.is_takeover ? 'Yes' : 'No'}</td>
                        <td>
                          {report.created_at
                            ? new Date(report.created_at).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td>
                          <Button
                            size="sm"
                            onClick={() => handleDownload(report.id)}
                            disabled={downloadingId !== null} // Disable all buttons when any download is in progress
                            variant="outline-primary"
                          >
                            {downloadingId === report.id ? ( // Only show spinner for the specific report being downloaded
                              <>
                                <Spinner size="sm" animation="border" className="me-1" />
                                Downloading...
                              </>
                            ) : (
                              'Download'
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="info">
                  No reports found. Click "Refresh" to load reports.
                </Alert>
                )}
            </Card.Body>
          </Card>
        </div>
      </Col>
    </Row>
  );
};

export default ProcessReports;

import { useState } from 'react';
import {
  Button,
  Table,
  Spinner,
  Alert,
  Form,
  Row,
  Col,
  Card,
  Pagination
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

const REPORTS_PER_PAGE = 10;

const ProcessReports = () => {
  const [singleReportName, setSingleReportName] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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
    enabled: false
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
      const response = await service({
        url: 'api/download-report',
        method: 'post',
        data: { report_id: reportId }
      });
      return response.data;
    },
    onMutate: (reportId: number) => {
      setDownloadingId(reportId);
    },
    onSettled: () => {
      setDownloadingId(null);
    }
  });

  const handleProcessSingle = () => {
    if (singleReportName.trim()) {
      processSingleMutation.mutate(singleReportName.trim());
    }
  };

  const handleDownload = (reportId: number) => {
    if (!downloadingId) {
      downloadMutation.mutate(reportId);
    }
  };

  const handleGetAllReports = () => {
    refetchReports();
  };

  // Calculate total pages and current page reports
  const totalReports = allReports?.length || 0;
  const totalPages = Math.ceil(totalReports / REPORTS_PER_PAGE);
  const currentReports = allReports?.slice(
    (currentPage - 1) * REPORTS_PER_PAGE,
    currentPage * REPORTS_PER_PAGE
  );

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Render pagination items dynamically but limit displayed pages to a reasonable number
  const renderPaginationItems = () => {
    let items = [];

    // Show a max of 5 pages in pagination for better UX
    const maxPageItems = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPageItems / 2));
    let endPage = startPage + maxPageItems - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPageItems + 1);
    }

    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </Pagination.Item>
      );
    }

    return items;
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
              <Button onClick={() => { setCurrentPage(1); handleGetAllReports(); }} disabled={reportsLoading}>
                {reportsLoading ? (
                  <Spinner size="sm" animation="border" />
                ) : (
                  'Refresh'
                )}
              </Button>
            </Card.Header>
            <Card.Body>
              {allReports && allReports.length > 0 ? (
                <>
                  <Table striped bordered hover responsive>
                    <thead className="table-dark">
                      <tr>
                        <th>Report ID</th>
                        <th>Bank</th>
                        <th>Fresh TL</th>
                        <th>OD Enhancement</th>
                        <th>Takeover</th>
                        <th>Created At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentReports?.map((report: any) => (
                        <tr key={report.id}>
                          <td>{report.id}</td>
                          <td>{report.bank_name || 'N/A'}</td>
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
                              disabled={
                                downloadingId === report.id && downloadMutation.isPending
                              }
                              variant="outline-primary"
                            >
                              {downloadingId === report.id && downloadMutation.isPending ? (
                                <Spinner size="sm" animation="border" />
                              ) : (
                                'Download'
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  {/* Pagination controls */}
                  <Pagination>
                    <Pagination.First
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    />
                    <Pagination.Prev
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    />
                    {renderPaginationItems()}
                    <Pagination.Next
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    />
                    <Pagination.Last
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                </>
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

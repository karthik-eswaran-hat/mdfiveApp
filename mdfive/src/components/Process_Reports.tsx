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
  Pagination,
  Nav,
  Tab,
  Badge,
  Accordion
} from 'react-bootstrap';
import { useMutation, useQuery } from '@tanstack/react-query';
import SideBar from './SideBar';
import service from '../lib/axios';

interface ProcessedReport {
  report_name: string;
  report_id: number;
  status: string;
}

interface ReportMapping {
  id: number;
  original_report_name: string;
  inserted_report_id: number;
  created_at: string;
  status: string;
}

interface BulkResult {
  report_name: string;
  status: string;
  report_id?: number;
  error?: string;
}

const REPORTS_PER_PAGE = 10;

const ProcessReports = () => {
  const [singleReportName, setSingleReportName] = useState('');
  const [bulkReportNames, setBulkReportNames] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [mappingCurrentPage, setMappingCurrentPage] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('process');
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);

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

  const {
    data: reportMappings,
    isLoading: mappingsLoading,
    refetch: refetchMappings
  } = useQuery({
    queryKey: ['reportMappings'],
    queryFn: async () => {
      const response = await service({ url: 'api/report-mappings', method: 'get' });
      return response.data.data;
    },
    enabled: false
  });

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
      refetchMappings();
    }
  });

  const processBulkMutation = useMutation({
    mutationFn: async (reportNames: string[]) => {
      const response = await service({
        url: 'api/process-bulk-reports',
        method: 'post',
        data: { report_names: reportNames }
      });
      return response.data;
    },
    onSuccess: (data) => {
      setBulkReportNames('');
      setBulkResults([]);
      refetchReports();
      refetchMappings();
      
      // Poll for bulk results
      if (data.data?.batch_id) {
        pollBulkStatus(data.data.batch_id);
      }
    }
  });

  const downloadMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const response = await service({
        url: 'api/download-report',
        method: 'post',
        data: { report_id: reportId, email, password },
        responseType: 'blob'
      });

      if (response.headers['content-type'] !== 'application/pdf') {
        throw new Error('Failed to download PDF. Please check credentials.');
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      const filename = response.headers['content-disposition']?.split('filename=')[1]?.replace(/"/g, '') || `Report_${reportId}.pdf`;
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    onMutate: (reportId: number) => setDownloadingId(reportId),
    onSettled: () => setDownloadingId(null)
  });

  const downloadAllMutation = useMutation({
    mutationFn: async (reportIds: number[]) => {
      const response = await service({
        url: 'api/download-bulk-reports',
        method: 'post',
        data: { 
          report_ids: reportIds,
          email,
          password 
        },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      const filename = response.headers['content-disposition']?.split('filename=')[1]?.replace(/"/g, '') || `BulkReports_${Date.now()}.zip`;
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    onMutate: () => setDownloadingAll(true),
    onSettled: () => setDownloadingAll(false)
  });

  const pollBulkStatus = async (batchId: string) => {
    const maxPolls = 60; // 5 minutes max (5 second intervals)
    let polls = 0;

    const poll = async () => {
      try {
        const response = await service({
          url: `api/bulk-status/${batchId}`,
          method: 'get'
        });

        const status = response.data.data;
        
        if (status.status === 'completed') {
          setBulkResults(status.results || []);
          return;
        }

        polls++;
        if (polls < maxPolls && status.status === 'processing') {
          setTimeout(poll, 5000); // Poll every 5 seconds
        }
      } catch (error) {
        console.error('Error polling bulk status:', error);
      }
    };

    setTimeout(poll, 2000); // Start polling after 2 seconds
  };

  const handleProcessSingle = () => {
    if (singleReportName.trim()) {
      processSingleMutation.mutate(singleReportName.trim());
    }
  };

  const handleProcessBulk = () => {
    const reportNames = bulkReportNames
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    if (reportNames.length > 0) {
      processBulkMutation.mutate(reportNames);
    }
  };

  const handleDownload = (reportId: number) => {
    console.log('Download clicked for ID:', reportId);
    if (!downloadingId && email && password) {
      downloadMutation.mutate(reportId);
    }
  };

  const handleDownloadAll = () => {
    const successfulReportIds = bulkResults
      .filter(result => result.status === 'success' && result.report_id)
      .map(result => result.report_id!);

    if (successfulReportIds.length > 0 && email && password && !downloadingAll) {
      downloadAllMutation.mutate(successfulReportIds);
    }
  };

  const handleGetAllReports = () => {
    refetchReports();
  };

  const handleGetReportMappings = () => {
    refetchMappings();
  };

  // Pagination for main reports
  const totalReports = allReports?.length || 0;
  const totalPages = Math.ceil(totalReports / REPORTS_PER_PAGE);
  const currentReports = allReports?.slice(
    (currentPage - 1) * REPORTS_PER_PAGE,
    currentPage * REPORTS_PER_PAGE
  );

  // Pagination for report mappings
  const totalMappings = reportMappings?.length || 0;
  const totalMappingPages = Math.ceil(totalMappings / REPORTS_PER_PAGE);
  const currentMappings = reportMappings?.slice(
    (mappingCurrentPage - 1) * REPORTS_PER_PAGE,
    mappingCurrentPage * REPORTS_PER_PAGE
  );

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleMappingPageChange = (pageNumber: number) => {
    setMappingCurrentPage(pageNumber);
  };

  const renderPaginationItems = (currentPage: number, totalPages: number, onPageChange: (page: number) => void) => {
    let items = [];
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
          onClick={() => onPageChange(page)}
        >
          {page}
        </Pagination.Item>
      );
    }

    return items;
  };

  const successfulBulkReports = bulkResults.filter(result => result.status === 'success');
  const failedBulkReports = bulkResults.filter(result => result.status === 'failed');

  return (
    <Row>
      <Col md={2}>
        <SideBar />
      </Col>
      <Col md={10}>
        <div className="container mt-5">
          <h2 className="mb-4">Process Reports</h2>

          <Tab.Container activeKey={activeTab} onSelect={(key) => setActiveTab(key || 'process')}>
            <Nav variant="tabs" className="mb-4">
              <Nav.Item>
                <Nav.Link eventKey="process">Process Reports</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="mappings">Report Mappings</Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              <Tab.Pane eventKey="process">
                <Accordion defaultActiveKey="0" className="mb-4">
                  
                  {/* Login Credentials Section */}
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>
                      <strong>Login Credentials for Download</strong>
                    </Accordion.Header>
                    <Accordion.Body>
                      <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter email"
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter password"
                        />
                      </Form.Group>
                      {email && password && (
                        <Alert variant="success" className="mb-0">
                          Credentials configured - Ready for downloads
                        </Alert>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>

                  {/* Single Report Processing */}
                  <Accordion.Item eventKey="1">
                    <Accordion.Header>
                      <strong>Process Single Report</strong>
                    </Accordion.Header>
                    <Accordion.Body>
                      <Form.Group className="mb-3">
                        <Form.Label>Report Name</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g., Report_1366_latest"
                          value={singleReportName}
                          onChange={(e) => setSingleReportName(e.target.value)}
                        />
                        <Form.Text className="text-muted">
                          Enter the exact report name from your database
                        </Form.Text>
                      </Form.Group>
                      <Button
                        onClick={handleProcessSingle}
                        disabled={processSingleMutation.isPending || !singleReportName.trim()}
                        variant="primary"
                        size="lg"
                      >
                        {processSingleMutation.isPending ? (
                          <>
                            <Spinner size="sm" animation="border" className="me-2" />
                            Processing...
                          </>
                        ) : (
                          ' Process Report'
                        )}
                      </Button>

                      {/* Single Report Status */}
                      {processSingleMutation.isSuccess && (
                        <Alert variant="success" className="mt-3">
                          Report processed successfully
                        </Alert>
                      )}
                      {processSingleMutation.isError && (
                        <Alert variant="danger" className="mt-3">
                          Error: {processSingleMutation.error?.message}
                        </Alert>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>

                  {/* Bulk Report Processing */}
                  <Accordion.Item eventKey="2">
                    <Accordion.Header>
                      <strong>Process Multiple Reports (Bulk)</strong>
                      {bulkResults.length > 0 && (
                        <Badge bg="info" className="ms-2">
                          {successfulBulkReports.length}/{bulkResults.length} Success
                        </Badge>
                      )}
                    </Accordion.Header>
                    <Accordion.Body>
                      <Form.Group className="mb-3">
                        <Form.Label>Report Names(one per line)</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={6}
                          placeholder="Report_1366_latest&#10;Report_1367_latest&#10;Report_1368_latest"
                          value={bulkReportNames}
                          onChange={(e) => setBulkReportNames(e.target.value)}
                        />
                        <Form.Text className="text-muted">
                          Enter one report name per line. Maximum 50 reports per batch.
                        </Form.Text>
                      </Form.Group>
                      
                      <div className="d-flex gap-2 mb-3">
                        <Button
                          onClick={handleProcessBulk}
                          disabled={processBulkMutation.isPending || !bulkReportNames.trim()}
                          variant="success"
                          size="lg"
                        >
                          {processBulkMutation.isPending ? (
                            <>
                              <Spinner size="sm" animation="border" className="me-2" />
                              Processing Bulk Reports...
                            </>
                          ) : (
                            'Process All Reports'
                          )}
                        </Button>

                        {bulkResults.length > 0 && successfulBulkReports.length > 0 && (
                          <Button
                            onClick={handleDownloadAll}
                            disabled={downloadingAll || !email || !password}
                            variant="info"
                            size="lg"
                          >
                            {downloadingAll ? (
                              <>
                                <Spinner size="sm" animation="border" className="me-2" />
                                Creating ZIP...
                              </>
                            ) : (
                              `Download All (${successfulBulkReports.length} files)`
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Bulk Processing Status */}
                      {processBulkMutation.isSuccess && (
                        <Alert variant="success" className="mb-3">
                          Bulk processing started Results will appear below when completed.
                        </Alert>
                      )}
                      {processBulkMutation.isError && (
                        <Alert variant="danger" className="mb-3">
                          Bulk Error:{processBulkMutation.error?.message}
                        </Alert>
                      )}

                      {/* Bulk Processing Results */}
                      {bulkResults.length > 0 && (
                        <Accordion className="mt-4">
                          <Accordion.Item eventKey="bulk-results">
                            <Accordion.Header>
                              <strong> Bulk Processing Results</strong>
                              <div className="ms-3">
                                <Badge bg="success" className="me-2">
                                  Success: {successfulBulkReports.length}
                                </Badge>
                                <Badge bg="danger" className="me-2">
                                  Failed: {failedBulkReports.length}
                                </Badge>
                                <Badge bg="secondary">
                                  Total:{bulkResults.length}
                                </Badge>
                              </div>
                            </Accordion.Header>
                            <Accordion.Body>
                              <Table striped bordered hover responsive>
                                <thead className="table-dark">
                                  <tr>
                                    <th>Report Name</th>
                                    <th>Status</th>
                                    <th>Report ID</th>
                                    <th> Error</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {bulkResults.map((result, index) => (
                                    <tr key={index}>
                                      <td>
                                        <code>{result.report_name}</code>
                                      </td>
                                      <td>
                                        <Badge bg={result.status === 'success' ? 'success' : 'danger'}>
                                          {result.status === 'success' ? ' Success' : 'Failed'}
                                        </Badge>
                                      </td>
                                      <td>
                                        {result.report_id ? (
                                          <Badge bg="info" className="fs-6">
                                            {result.report_id}
                                          </Badge>
                                        ) : (
                                          <span className="text-muted">N/A</span>
                                        )}
                                      </td>
                                      <td>
                                        <div className="text-danger" style={{maxWidth: '300px', fontSize: '0.9rem'}}>
                                          {result.error || '-'}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </Accordion.Body>
                          </Accordion.Item>
                        </Accordion>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>

                  {/* Download Status */}
                  <Accordion.Item eventKey="3">
                    <Accordion.Header>
                      <strong>Download Status & Messages</strong>
                    </Accordion.Header>
                    <Accordion.Body>
                      {downloadMutation.isSuccess && (
                        <Alert variant="success">
                          Single report downloaded successfully!
                        </Alert>
                      )}

                      {downloadAllMutation.isSuccess && (
                        <Alert variant="success">
                          All reports downloaded successfully as ZIP file!
                        </Alert>
                      )}

                      {(downloadMutation.isError || downloadAllMutation.isError) && (
                        <Alert variant="danger">
                          Download Error: {downloadMutation.error?.message || downloadAllMutation.error?.message}
                        </Alert>
                      )}

                      {!downloadMutation.isSuccess && !downloadAllMutation.isSuccess && 
                       !downloadMutation.isError && !downloadAllMutation.isError && (
                        <Alert variant="info">
                          Download status messages will appear here
                        </Alert>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>

                  {/* All Processed Reports */}
                  <Accordion.Item eventKey="4">
                    <Accordion.Header>
                      <strong>All Processed Reports Database</strong>
                      {allReports && (
                        <Badge bg="primary" className="ms-2">
                          {allReports.length} Reports
                        </Badge>
                      )}
                    </Accordion.Header>
                    <Accordion.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0">Recent Reports from Database</h6>
                        <Button 
                          onClick={() => { setCurrentPage(1); handleGetAllReports(); }} 
                          disabled={reportsLoading}
                          variant="outline-primary"
                        >
                          {reportsLoading ? (
                            <>
                              <Spinner size="sm" animation="border" className="me-2" />
                              Loading...
                            </>
                          ) : (
                            'Refresh'
                          )}
                        </Button>
                      </div>

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
                                  <td>
                                    <Badge bg="secondary">{report.id}</Badge>
                                  </td>
                                  <td>{report.bank_name || 'N/A'}</td>
                                  <td>
                                    <Badge bg={report.is_fresh_term_loan ? 'success' : 'secondary'}>
                                      {report.is_fresh_term_loan ? 'Yes' : 'No'}
                                    </Badge>
                                  </td>
                                  <td>
                                    <Badge bg={report.is_od_enhancement ? 'success' : 'secondary'}>
                                      {report.is_od_enhancement ? 'Yes' : 'No'}
                                    </Badge>
                                  </td>
                                  <td>
                                    <Badge bg={report.is_takeover ? 'success' : 'secondary'}>
                                      {report.is_takeover ? 'Yes' : 'No'}
                                    </Badge>
                                  </td>
                                  <td>
                                    {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td>
                                    <Button
                                      size="sm"
                                      onClick={() => handleDownload(report.id)}
                                      disabled={downloadingId === report.id && downloadMutation.isPending}
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

                          {totalPages > 1 && (
                            <Pagination className="justify-content-center">
                              <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                              <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                              {renderPaginationItems(currentPage, totalPages, handlePageChange)}
                              <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                              <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
                            </Pagination>
                          )}
                        </>
                      ) : (
                        <Alert variant="info">
                           No reports found. Click "Refresh" to load reports from database.
                        </Alert>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>

                </Accordion>
              </Tab.Pane>

              <Tab.Pane eventKey="mappings">
                <Accordion defaultActiveKey="0">
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>
                      <strong>Report Processing History & Mappings</strong>
                      {reportMappings && (
                        <Badge bg="info" className="ms-2">
                          {reportMappings.length} Records
                        </Badge>
                      )}
                    </Accordion.Header>
                    <Accordion.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0">Original Report Names → Inserted Report IDs</h6>
                        <Button 
                          onClick={() => { setMappingCurrentPage(1); handleGetReportMappings(); }} 
                          disabled={mappingsLoading}
                          variant="outline-primary"
                        >
                          {mappingsLoading ? (
                            <>
                              <Spinner size="sm" animation="border" className="me-2" />
                              Loading...
                            </>
                          ) : (
                            'Refresh'
                          )}
                        </Button>
                      </div>

                      {reportMappings && reportMappings.length > 0 ? (
                        <>
                          <Table striped bordered hover responsive>
                            <thead className="table-dark">
                              <tr>
                                <th>Log ID</th>
                                <th>Original Report Name</th>
                                <th>Inserted Report ID</th>
                                <th>Status</th>
                                <th>Created At</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentMappings?.map((mapping: ReportMapping) => (
                                <tr key={mapping.id}>
                                  <td>
                                    <Badge bg="secondary">{mapping.id}</Badge>
                                  </td>
                                  <td>
                                    <code>{mapping.original_report_name}</code>
                                  </td>
                                  <td>
                                    {mapping.inserted_report_id ? (
                                      <Badge bg="success" className="fs-6">
                                        {mapping.inserted_report_id}
                                      </Badge>
                                    ) : (
                                      <Badge bg="secondary">N/A</Badge>
                                    )}
                                  </td>
                                  <td>
                                    <Badge bg={
                                      mapping.status === 'success' ? 'success' : 
                                      mapping.status === 'failed' ? 'danger' : 'warning'
                                    }>
                                      {mapping.status === 'success' ? 'Success' : 
                                       mapping.status === 'failed' ? 'Failed' : 'Processing'}
                                    </Badge>
                                  </td>
                                  <td>
                                    {mapping.created_at ? new Date(mapping.created_at).toLocaleDateString() : 'N/A'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>

                          {totalMappingPages > 1 && (
                            <Pagination className="justify-content-center">
                              <Pagination.First onClick={() => handleMappingPageChange(1)} disabled={mappingCurrentPage === 1} />
                              <Pagination.Prev onClick={() => handleMappingPageChange(mappingCurrentPage - 1)} disabled={mappingCurrentPage === 1} />
                              {renderPaginationItems(mappingCurrentPage, totalMappingPages, handleMappingPageChange)}
                              <Pagination.Next onClick={() => handleMappingPageChange(mappingCurrentPage + 1)} disabled={mappingCurrentPage === totalMappingPages} />
                              <Pagination.Last onClick={() => handleMappingPageChange(totalMappingPages)} disabled={mappingCurrentPage === totalMappingPages} />
                            </Pagination>
                          )}
                        </>
                      ) : (
                        <Alert variant="info">
                          No report mappings found. Click "Refresh"to load processing history.
                        </Alert>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </div>
      </Col>
    </Row>
  );
};

export default ProcessReports;

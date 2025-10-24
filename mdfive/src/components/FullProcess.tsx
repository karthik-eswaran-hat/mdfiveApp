import React, { useState, useRef } from 'react';
import { 
  Card, 
  Col, 
  Container, 
  Row, 
  Button, 
  Form, 
  Alert, 
  Spinner,
  Modal,
  ListGroup,
  Badge,
  ProgressBar
} from 'react-bootstrap';
import { 
  FaFolder, 
  FaFile, 
  FaUpload, 
  FaDownload, 
  FaPlay, 
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaFileCode,
  FaTrash,
  FaEye
} from 'react-icons/fa';
import SideBar from './SideBar';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modified?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}

interface ProcessOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface UploadedJsonFile {
  id: string;
  name: string;
  size: number;
  content: any;
  uploadTime: string;
}

const FullProcess: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(false);
  const [processResults, setProcessResults] = useState<any[]>([]);
  const [uploadedJsonFiles, setUploadedJsonFiles] = useState<UploadedJsonFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadedJsonFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock file data - in real implementation, this would come from API
  const mockFiles: FileItem[] = [
    { id: '1', name: 'Report_1366_latest.pdf', type: 'file', size: 2048576, modified: '2024-01-15' },
    { id: '2', name: 'Report_1367_latest.pdf', type: 'file', size: 1536000, modified: '2024-01-14' },
    { id: '3', name: 'Report_1368_latest.pdf', type: 'file', size: 3072000, modified: '2024-01-13' },
    { id: '4', name: 'Batch_Reports', type: 'folder', modified: '2024-01-12' },
    { id: '5', name: 'Report_1369_latest.pdf', type: 'file', size: 1024000, modified: '2024-01-11' },
  ];

  const processOptions: ProcessOption[] = [
    {
      id: 'fresh-term-loan',
      name: 'Fresh Term Loan',
      description: 'Process fresh term loan applications',
      icon: '🏦',
      color: 'primary'
    },
    {
      id: 'fresh-od',
      name: 'Fresh OD',
      description: 'Process fresh overdraft applications',
      icon: '💳',
      color: 'success'
    },
    {
      id: 'od-renewal',
      name: 'OD Renewal',
      description: 'Process overdraft renewal applications',
      icon: '🔄',
      color: 'info'
    },
    {
      id: 'od-enhancement',
      name: 'OD Enhancement',
      description: 'Process overdraft enhancement applications',
      icon: '📈',
      color: 'warning'
    },
    {
      id: 'takeover',
      name: 'Takeover',
      description: 'Process loan takeover applications',
      icon: '🔄',
      color: 'secondary'
    },
    {
      id: 'fresh-term-loan-enhancement',
      name: 'Fresh Term Loan + Enhancement',
      description: 'Process fresh term loan with enhancement',
      icon: '🏦📈',
      color: 'primary'
    },
    {
      id: 'fresh-term-loan-od-enhancement-takeover',
      name: 'Fresh Term Loan + OD Enhancement + Takeover',
      description: 'Process complex multi-product application',
      icon: '🏦💳🔄',
      color: 'dark'
    },
    {
      id: 'fresh-od-fresh-term-loan',
      name: 'Fresh OD + Fresh Term Loan',
      description: 'Process both fresh OD and term loan',
      icon: '💳🏦',
      color: 'success'
    },
    {
      id: 'fresh-term-loan-enhancement',
      name: 'Fresh Term Loan + Enhancement',
      description: 'Process fresh term loan with enhancement',
      icon: '🏦📈',
      color: 'primary'
    }
  ];

  const handleFileSelect = (file: FileItem) => {
    if (file.type === 'file') {
      setSelectedFiles(prev => {
        const exists = prev.find(f => f.id === file.id);
        if (exists) {
          return prev.filter(f => f.id !== file.id);
        } else {
          return [...prev, file];
        }
      });
    }
  };

  const handleJsonFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    setUploadProgress(0);

    const fileArray = Array.from(files);
    const jsonFiles: UploadedJsonFile[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      
      // Validate JSON file
      if (!file.name.toLowerCase().endsWith('.json')) {
        alert(`File "${file.name}" is not a JSON file. Please select only JSON files.`);
        continue;
      }

      try {
        const content = await new Promise<any>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const jsonContent = JSON.parse(e.target?.result as string);
              resolve(jsonContent);
            } catch (error) {
              reject(new Error(`Invalid JSON in file "${file.name}"`));
            }
          };
          reader.onerror = () => reject(new Error(`Error reading file "${file.name}"`));
          reader.readAsText(file);
        });

        const uploadedFile: UploadedJsonFile = {
          id: `json_${Date.now()}_${i}`,
          name: file.name,
          size: file.size,
          content,
          uploadTime: new Date().toISOString()
        };

        jsonFiles.push(uploadedFile);
        setUploadProgress(((i + 1) / fileArray.length) * 100);
      } catch (error) {
        alert(`Error processing file "${file.name}": ${error}`);
      }
    }

    setUploadedJsonFiles(prev => [...prev, ...jsonFiles]);
    setIsUploading(false);
    setUploadProgress(0);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveJsonFile = (fileId: string) => {
    setUploadedJsonFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handlePreviewJsonFile = (file: UploadedJsonFile) => {
    setPreviewFile(file);
    setShowJsonPreview(true);
  };

  const handleProcessStart = async () => {
    if (!selectedProcess || (selectedFiles.length === 0 && uploadedJsonFiles.length === 0)) {
      alert('Please select a process and at least one file (from explorer or upload JSON files)');
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing with both selected files and uploaded JSON files
    setTimeout(() => {
      const fileResults = selectedFiles.map(file => ({
        file: file.name,
        type: 'explorer',
        process: selectedProcess,
        status: Math.random() > 0.2 ? 'completed' : 'failed',
        timestamp: new Date().toISOString()
      }));

      const jsonResults = uploadedJsonFiles.map(file => ({
        file: file.name,
        type: 'uploaded_json',
        process: selectedProcess,
        status: Math.random() > 0.1 ? 'completed' : 'failed',
        timestamp: new Date().toISOString()
      }));
      
      setProcessResults([...fileResults, ...jsonResults]);
      setIsProcessing(false);
    }, 3000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <FaCheckCircle className="text-success" />;
      case 'failed': return <FaTimesCircle className="text-danger" />;
      case 'processing': return <FaClock className="text-warning" />;
      default: return <FaClock className="text-muted" />;
    }
  };

  return (
    <Row>
      <Col md={2}>
        <SideBar />
      </Col>
      <Col md={10}>
        <Container fluid className="py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4>Full Process Automation</h4>
            <Button 
              variant="outline-primary" 
              onClick={() => setShowFileExplorer(true)}
            >
              <FaFolder className="me-2" />
              File Explorer
            </Button>
          </div>

          {/* Process Selection */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Select Process Type</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                {processOptions.map((option) => (
                  <Col md={4} key={option.id} className="mb-3">
                    <Card 
                      className={`h-100 cursor-pointer ${selectedProcess === option.id ? 'border-primary' : ''}`}
                      onClick={() => setSelectedProcess(option.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Card.Body className="text-center">
                        <div style={{ fontSize: '2rem' }}>{option.icon}</div>
                        <h6 className="mt-2">{option.name}</h6>
                        <small className="text-muted">{option.description}</small>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>

          {/* Selected Files */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Selected Files ({selectedFiles.length})</h5>
            </Card.Header>
            <Card.Body>
              {selectedFiles.length === 0 ? (
                <Alert variant="info">
                  No files selected. Click "File Explorer" to select files.
                </Alert>
              ) : (
                <ListGroup>
                  {selectedFiles.map((file) => (
                    <ListGroup.Item key={file.id} className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <FaFile className="me-2 text-primary" />
                        <span>{file.name}</span>
                        <Badge bg="secondary" className="ms-2">
                          {formatFileSize(file.size || 0)}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleFileSelect(file)}
                      >
                        Remove
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>

          {/* JSON File Upload */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <FaFileCode className="me-2" />
                Upload JSON Files ({uploadedJsonFiles.length}/3)
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <Form.Group>
                  <Form.Label>Select JSON Files (2-3 files recommended)</Form.Label>
                  <div className="d-flex gap-2 align-items-center">
                    <Form.Control
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      multiple
                      onChange={handleJsonFileUpload}
                      disabled={isUploading || uploadedJsonFiles.length >= 3}
                    />
                    <Button
                      variant="outline-primary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || uploadedJsonFiles.length >= 3}
                    >
                      <FaUpload className="me-1" />
                      Upload
                    </Button>
                  </div>
                  <Form.Text className="text-muted">
                    Upload 2-3 JSON files for processing. Maximum 3 files allowed.
                  </Form.Text>
                </Form.Group>
              </div>

              {isUploading && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>Uploading files...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <ProgressBar now={uploadProgress} animated />
                </div>
              )}

              {uploadedJsonFiles.length > 0 && (
                <div>
                  <h6 className="mb-3">Uploaded JSON Files:</h6>
                  <ListGroup>
                    {uploadedJsonFiles.map((file) => (
                      <ListGroup.Item key={file.id} className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <FaFileCode className="me-2 text-success" />
                          <div>
                            <div className="fw-semibold">{file.name}</div>
                            <small className="text-muted">
                              {formatFileSize(file.size)} • {new Date(file.uploadTime).toLocaleString()}
                            </small>
                          </div>
                        </div>
                        <div className="d-flex gap-1">
                          <Button
                            size="sm"
                            variant="outline-info"
                            onClick={() => handlePreviewJsonFile(file)}
                            title="Preview JSON content"
                          >
                            <FaEye />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleRemoveJsonFile(file.id)}
                            title="Remove file"
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
              )}

              {uploadedJsonFiles.length === 0 && !isUploading && (
                <Alert variant="info">
                  <FaFileCode className="me-2" />
                  No JSON files uploaded yet. Upload 2-3 JSON files to process.
                </Alert>
              )}
            </Card.Body>
          </Card>

          {/* Process Controls */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Process Controls</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex gap-2">
                <Button
                  variant="success"
                  size="lg"
                  onClick={handleProcessStart}
                  disabled={!selectedProcess || (selectedFiles.length === 0 && uploadedJsonFiles.length === 0) || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaPlay className="me-2" />
                      Start Process ({selectedFiles.length + uploadedJsonFiles.length} files)
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setSelectedFiles([]);
                    setUploadedJsonFiles([]);
                    setSelectedProcess('');
                    setProcessResults([]);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  Clear All
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Process Results */}
          {processResults.length > 0 && (
            <Card>
              <Card.Header>
                <h5 className="mb-0">Process Results</h5>
              </Card.Header>
              <Card.Body>
                <ListGroup>
                  {processResults.map((result, index) => (
                    <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        {getStatusIcon(result.status)}
                        <span className="ms-2">{result.file}</span>
                        <Badge 
                          bg={result.type === 'uploaded_json' ? 'info' : 'secondary'} 
                          className="ms-2"
                        >
                          {result.type === 'uploaded_json' ? 'JSON' : 'Explorer'}
                        </Badge>
                        <Badge 
                          bg={result.status === 'completed' ? 'success' : 'danger'} 
                          className="ms-2"
                        >
                          {result.status}
                        </Badge>
                      </div>
                      <small className="text-muted">
                        {new Date(result.timestamp).toLocaleString()}
                      </small>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          )}

          {/* File Explorer Modal */}
          <Modal show={showFileExplorer} onHide={() => setShowFileExplorer(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>
                <FaFolder className="me-2" />
                File Explorer
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <ListGroup>
                {mockFiles.map((file) => (
                  <ListGroup.Item 
                    key={file.id}
                    className={`d-flex justify-content-between align-items-center cursor-pointer ${
                      selectedFiles.find(f => f.id === file.id) ? 'bg-light' : ''
                    }`}
                    onClick={() => handleFileSelect(file)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center">
                      {file.type === 'folder' ? (
                        <FaFolder className="me-2 text-warning" />
                      ) : (
                        <FaFile className="me-2 text-primary" />
                      )}
                      <span>{file.name}</span>
                      {file.size && (
                        <Badge bg="secondary" className="ms-2">
                          {formatFileSize(file.size)}
                        </Badge>
                      )}
                    </div>
                    <small className="text-muted">{file.modified}</small>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowFileExplorer(false)}>
                Close
              </Button>
              <Button 
                variant="primary" 
                onClick={() => setShowFileExplorer(false)}
                disabled={selectedFiles.length === 0}
              >
                Select Files ({selectedFiles.length})
              </Button>
            </Modal.Footer>
          </Modal>
          {/* JSON Preview Modal */}
          <Modal show={showJsonPreview} onHide={() => setShowJsonPreview(false)} size="xl">
            <Modal.Header closeButton>
              <Modal.Title>
                <FaFileCode className="me-2" />
                JSON File Preview: {previewFile?.name}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {previewFile && (
                <div>
                  <div className="mb-3">
                    <Row>
                      <Col md={6}>
                        <strong>File Name:</strong> {previewFile.name}
                      </Col>
                      <Col md={6}>
                        <strong>File Size:</strong> {formatFileSize(previewFile.size)}
                      </Col>
                    </Row>
                    <Row className="mt-2">
                      <Col>
                        <strong>Upload Time:</strong> {new Date(previewFile.uploadTime).toLocaleString()}
                      </Col>
                    </Row>
                  </div>
                  
                  <div style={{ 
                    maxHeight: '500px', 
                    overflowY: 'auto', 
                    border: '1px solid #dee2e6', 
                    borderRadius: '0.375rem',
                    padding: '1rem',
                    backgroundColor: '#f8f9fa'
                  }}>
                    <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                      {JSON.stringify(previewFile.content, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowJsonPreview(false)}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </Container>
      </Col>
    </Row>
  );
};

export default FullProcess;

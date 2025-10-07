import { Nav } from "react-bootstrap";
import { useState, useEffect } from "react";
import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaChartBar, 
  FaFolder, 
  FaChartLine, 
  FaRobot, 
  FaSignInAlt, 
  FaUserPlus, 
  FaKey, 
  FaQuestionCircle,
  FaUser,
  FaChevronDown,
  FaChevronRight,
  FaTh,
  FaBars,
  FaArrowLeft
} from 'react-icons/fa';

type FolderKey = 'automation';

function SideBar() {
  const location = useLocation();
  const [activeKey, setActiveKey] = useState<string>("dashboard");
  const [expandedFolders, setExpandedFolders] = useState<Record<FolderKey, boolean>>({
    automation: false,
  });
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith('/automation')) {
      setExpandedFolders(prev => ({ ...prev, automation: true }));
      if (location.pathname === '/automation/signin') {
        setActiveKey('automation-signin');
      } else if (location.pathname === '/automation/signup') {
        setActiveKey('automation-signup');
      } else if (location.pathname === '/automation/forgot') {
        setActiveKey('automation-forgot');
      } else {
        setActiveKey('automation-root');
      }
    } else {
      const pathToKey: Record<string, string> = {
        '/dashboard': 'dashboard',
        '/': 'profile',
        '/processed_reports': 'projects',
        '/ReportComparison': 'settings',
      };
      const key = pathToKey[location.pathname] || 'dashboard';
      setActiveKey(key);
      setExpandedFolders(prev => ({ ...prev, automation: false }));
    }
  }, [location]);

  const handleSelect = (eventKey: string) => {
    setActiveKey(eventKey);
  };

  const toggleFolder = (folderKey: FolderKey) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderKey]: !prev[folderKey]
    }));
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const renderBackButton = (folderKey: FolderKey) => (
    <Nav.Link
      onClick={() => toggleFolder(folderKey)}
      className="sidebar-back-button d-flex align-items-center"
      style={{
        cursor: 'pointer',
        padding: '6px 16px',
        borderRadius: '6px',
        margin: '0 8px 8px 8px',
        backgroundColor: '#f1f3f5',
        color: '#495057',
        fontWeight: '500',
        fontSize: '13px',
        userSelect: 'none',
      }}
      title="Back"
    >
      <FaArrowLeft size={14} className="me-2" /> Back
    </Nav.Link>
  );

  interface FolderItemProps {
    folderKey: FolderKey;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    children?: React.ReactNode;
  }

  const FolderItem = ({ folderKey, icon: IconComponent, label, children }: FolderItemProps) => {
    const isExpanded = expandedFolders[folderKey];

    return (
      <>
        <Nav.Item className="mb-1">
          <Nav.Link
            onClick={() => toggleFolder(folderKey)}
            className="sidebar-folder-item d-flex align-items-center"
            style={{
              cursor: 'pointer',
              padding: '10px 16px',
              borderRadius: '6px',
              margin: '0 8px',
              transition: 'background-color 0.25s ease, color 0.25s ease',
              backgroundColor: isExpanded ? 'rgba(13, 110, 253, 0.12)' : 'transparent',
              color: isExpanded ? '#0d6efd' : '#6c757d',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              userSelect: 'none',
            }}
            aria-expanded={isExpanded}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                toggleFolder(folderKey);
              }
            }}
          >
            <IconComponent size={18} className="me-3 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-grow-1">{label}</span>
                {isExpanded ? (
                  <FaChevronDown size={12} className="text-muted" />
                ) : (
                  <FaChevronRight size={12} className="text-muted" />
                )}
              </>
            )}
          </Nav.Link>
        </Nav.Item>
        {isExpanded && !isCollapsed && (
          <div className="ps-4 mb-3">
            {renderBackButton(folderKey)}
            {children}
          </div>
        )}
      </>
    );
  };

  interface FileItemProps {
    eventKey: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    to: string;
    isChild?: boolean;
  }

  const FileItem = ({ eventKey, icon: IconComponent, label, to, isChild = false }: FileItemProps) => {
    const isActive = activeKey === eventKey;
    
    return (
      <Nav.Item className="mb-1">
          <Nav.Link 
          eventKey={eventKey} 
          as={Link} 
          to={to}
          onSelect={() => handleSelect(eventKey)}
          className="sidebar-nav-item d-flex align-items-center"
          style={{ 
            padding: isChild ? '8px 16px' : '10px 16px',
            borderRadius: '6px',
            margin: isChild ? '0' : '0 8px',
            fontSize: isChild ? '13px' : '14px',
            fontWeight: isActive ? '600' : '500',
            color: isActive ? '#fff' : '#6c757d',
            backgroundColor: isActive ? '#0d6efd' : 'transparent',
            border: 'none',
            transition: 'all 0.2s ease',
            textDecoration: 'none',
            userSelect: 'none',
          }}
          title={isCollapsed ? label : ''}
        >
          <IconComponent 
            size={isChild ? 14 : 16} 
            className={`flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'me-3'}`}
          />
          {!isCollapsed && <span>{label}</span>}
        </Nav.Link>
      </Nav.Item>
    );
  };

  const sidebarWidth = isCollapsed ? '70px' : '220px';

  return (
    <div 
      className="sidebar-container d-flex flex-column"
      style={{ 
        width: sidebarWidth,
        minWidth: sidebarWidth,
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: '#fff',
        borderRight: '1px solid #e9ecef',
        boxShadow: '2px 0 6px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        zIndex: 1000
      }}
    >
      {/* Header */}
      <div 
        className="sidebar-header d-flex align-items-center justify-content-between"
        style={{ 
          background: 'linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%)',
          color: 'white',
          padding: '16px',
          minHeight: '70px',
          userSelect: 'none',
        }}
      >
        {!isCollapsed ? (
          <div className="d-flex align-items-center">
            <FaTh size={20} className="me-2" />
            <div>
              <h6 className="mb-0 fw-bold">Systemisers</h6>
              <small style={{ opacity: 0.9, fontSize: '11px' }}>
                MD5 Testing
              </small>
            </div>
          </div>
        ) : (
          <FaTh size={20} className="mx-auto" />
        )}
        <button
          onClick={toggleSidebar}
          className="btn btn-link text-white p-1"
          style={{ border: 'none', fontSize: '14px' }}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <FaBars />
        </button>
      </div>
      
      {/* Navigation */}
      <div className="flex-grow-1 py-3" role="navigation" aria-label="Sidebar navigation">
        <Nav className="flex-column">
          {/* Main Menu */}
          {!isCollapsed && (
            <div 
              className="px-3 mb-2"
              style={{ 
                fontSize: '10px',
                fontWeight: '600',
                color: '#adb5bd',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                userSelect: 'none',
              }}
            >
              MAIN MENU
            </div>
          )}
          
          <FileItem 
            eventKey="dashboard" 
            icon={FaHome} 
            label="Dashboard" 
            to="/dashboard" 
          />
          
          <FileItem 
            eventKey="profile" 
            icon={FaUser} 
            label="Reports Viewer" 
            to="/" 
          />
          
          <FileItem 
            eventKey="projects" 
            icon={FaFolder} 
            label="Projects" 
            to="/processed_reports" 
          />
          
          <FileItem 
            eventKey="settings" 
            icon={FaChartLine} 
            label="Report Comparison" 
            to="/ReportComparison" 
          />
          
          <FileItem 
            eventKey="reports" 
            icon={FaChartBar} 
            label="Reports" 
            to="/dashboard" 
          />

          {/* Automation Section */}
          {!isCollapsed && (
            <>
              <hr className="mx-3 my-3" style={{ opacity: 0.1 }} />
              <div 
                className="px-3 mb-2"
                style={{ 
                  fontSize: '10px',
                  fontWeight: '600',
                  color: '#adb5bd',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  userSelect: 'none',
                }}
              >
                AUTOMATION
              </div>
            </>
          )}
          
          <FolderItem 
            folderKey="automation" 
            icon={FaRobot} 
            label="Automation Tools"
          >
            <FileItem 
              eventKey="automation-root" 
              icon={FaTh} 
              label="Overview" 
              to="/automation" 
              isChild={true}
            />
            
            <FileItem 
              eventKey="automation-signin" 
              icon={FaSignInAlt} 
              label="Sign-In" 
              to="/automation/signin" 
              isChild={true}
            />
            
            <FileItem 
              eventKey="automation-signup" 
              icon={FaUserPlus} 
              label="Sign-Up" 
              to="/automation/signup" 
              isChild={true}
            />
            
            <FileItem 
              eventKey="automation-forgot" 
              icon={FaKey} 
              label="Forgot Password" 
              to="/automation/forgot" 
              isChild={true}
            />
          </FolderItem>
          
          {/* Support Section */}
          {!isCollapsed && (
            <>
              <hr className="mx-3 my-3" style={{ opacity: 0.1 }} />
              <div 
                className="px-3 mb-2"
                style={{ 
                  fontSize: '10px',
                  fontWeight: '600',
                  color: '#adb5bd',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  userSelect: 'none',
                }}
              >
                SUPPORT
              </div>
            </>
          )}
          
          <FileItem 
            eventKey="help" 
            icon={FaQuestionCircle} 
            label="Help & Support" 
            to="/dashboard" 
          />
        </Nav>
      </div>
      
      <style>{`
        .sidebar-container::-webkit-scrollbar {
          width: 6px;
        }
        
        .sidebar-container::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .sidebar-container::-webkit-scrollbar-thumb {
          background: #dee2e6;
          border-radius: 3px;
        }
        
        .sidebar-nav-item:hover:not(.active) {
          background-color: rgba(0, 0, 0, 0.06) !important;
          color: #495057 !important;
        }
        
        .sidebar-folder-item:hover {
          background-color: rgba(0, 0, 0, 0.06) !important;
          color: #495057 !important;
        }

        .sidebar-back-button:hover {
          background-color: #e9ecef;
          color: #0d6efd;
        }
      `}</style>
    </div>
  );
}

export default SideBar;

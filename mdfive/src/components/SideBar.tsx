import { Nav } from "react-bootstrap";
import { useState } from "react";
import { Link } from 'react-router-dom'; // For routing


function SideBar() {
  const [activeKey, setActiveKey] = useState("dashboard");

  const handleSelect = (eventKey) => {
    setActiveKey(eventKey);
    // Add your navigation logic here
    console.log("Selected:", eventKey);
  };

  return (
    <div className="sideBar" style={{ 
      width: '250px', 
      height: '105vh', 
      backgroundColor: '#f8f9fa', 
      borderRight: '1px solid #dee2e6'
    }}>
    <h1
      style={{
        marginBottom: "30px",
        fontSize: "2rem",
        fontWeight: "600",
        color: "#2d3436",
        textAlign: "center",
        position: "relative",
        paddingBottom: "12px",
      }}
      className="mt-2"
    >
      MD5 Comparison
      <span
        style={{
          content: "''",
          position: "absolute",
          bottom: "0",
          left: "50%",
          transform: "translateX(-50%)",
          width: "60px",
          height: "3px",
          background: "linear-gradient(90deg, #0984e3, #00cec9)",
          borderRadius: "2px",
        }}
      />
    </h1>
      <Nav 
        className="flex-column"
        activeKey={activeKey}
        onSelect={handleSelect}
      >
        <Nav.Item>
          <Nav.Link eventKey="dashboard" as={Link} to="/dashboard">
            📊 Dashboard
          </Nav.Link>
        </Nav.Item>
        
        <Nav.Item>
          <Nav.Link eventKey="profile" as={Link} to="/">
            👤 Reports Viewer
          </Nav.Link>
        </Nav.Item>
        
        <Nav.Item>
          <Nav.Link eventKey="projects" as={Link} to="/processed_reports">
            📁 Projects
          </Nav.Link>
        </Nav.Item>
        
        <Nav.Item>
          <Nav.Link eventKey="settings" as={Link} to="/ReportComparison">
            📈 Report Comparison
          </Nav.Link>
        </Nav.Item>
        
        {/* <Nav.Item>
          <Nav.Link eventKey="reports" as={Link} to="/dashboard">
           ⚙️  Reports
          </Nav.Link>
        </Nav.Item>
        
        <Nav.Item>
          <Nav.Link eventKey="help" as={Link} to="/dashboard">
            ❓ Help
          </Nav.Link>
        </Nav.Item> */}
      </Nav>
    </div>
  );
}

export default SideBar;
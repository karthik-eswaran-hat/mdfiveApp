import { useState } from 'react';
import { Link } from 'react-router-dom'; // For routing
import Button from 'react-bootstrap/Button';
import Offcanvas from 'react-bootstrap/Offcanvas';
import Nav from 'react-bootstrap/Nav';
import { CiMenuBurger } from "react-icons/ci";


function SideBar() {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <Button variant="primary" onClick={handleShow}>
        <CiMenuBurger />

      </Button>

      <Offcanvas show={show} onHide={handleClose} placement="start"> {/* Left side */}
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Navigation</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column">
            <Nav.Link as={Link} to="/dashboard" onClick={handleClose}>Dashboard</Nav.Link>
            <Nav.Link as={Link} to="/reports" onClick={handleClose}>Reports</Nav.Link>
            <Nav.Link as={Link} to="/settings" onClick={handleClose}>Settings</Nav.Link>
            <Nav.Link as={Link} to="/support" onClick={handleClose}>Support</Nav.Link>
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}

export default SideBar;

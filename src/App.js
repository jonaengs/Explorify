import './App.css';
import D3BarChart from "./D3BarChart";
import CalendarHeatmap from "./CalendarHeatmap";
import logo from "./logo/logo1.png"
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useRef } from "react";
import { DropdownSelect } from "./DropdownSelect"
import { Navbar, Container, Form, Nav, Row, Col, Card, InputGroup, ButtonGroup, Button } from "react-bootstrap";
import { BsQuestionCircle } from 'react-icons/bs';

const options = [
    { value: 'listening-history', label: 'Listening History' },
    { value: 'popularity', label: 'Popularity' },
    { value: 'alphabetical', label: 'Alphabetical' },
];


function App() {
    let selectedOption = useRef(options[0]);

    const handleChange = (selected) => {
        selectedOption = selected;
    };

    return (
        <>
            <Navbar bg="dark" variant="dark">
                <Nav className="container-fluid">
                    <Navbar.Brand class>
                        <img alt="" src={logo}
                             width="100%"
                             height="70"
                             className="d-inline-block align-top"
                             style={{"margin-left": "40px"}}
                        />
                    </Navbar.Brand>
                    <Navbar.Toggle />
                    <Navbar.Collapse className="justify-content-end">
                        <Form.Group controlId="formFileSm" className="ms-auto">
                            <Form.Control type="file" size="sm" />
                        </Form.Group>
                    </Navbar.Collapse>
                </Nav>
            </Navbar>

            <Container fluid className="custom-container">
                <Row xl={12} className={"row-col-pad"}>
                    <Col xl={9} md={6}>
                            <Row xl={9} className={"row-col-pad"}>
                                <Card className={"display-card"}>
                                    <Row xl={9}>
                                        <Col xl={2}>
                                            <Card className={"filter-panel"}>
                                                <Card.Header>
                                                    <h5>
                                                        <a> Filter Panel</a>
                                                        <BsQuestionCircle/>
                                                    </h5>
                                                </Card.Header>
                                                <Card className={"filter-panel"} style={{height: "50%"}}>
                                                    <Card.Body>
                                                        <Card.Title> Genre </Card.Title>
                                                        <DropdownSelect/>
                                                    </Card.Body>
                                                </Card>
                                                <Card className={"filter-panel"} style={{height: "15%"}}>
                                                    <Card.Body>
                                                        <Card.Title> Popularity </Card.Title>
                                                        <InputGroup>
                                                            <Form.Control style={{width: "40%"}} type="number" min="0" max="100" placeholder="min" />
                                                            <InputGroup.Text >-</InputGroup.Text>
                                                            <Form.Control style={{width: "40%"}} type="number" min="0" max="100" placeholder="max" />
                                                        </InputGroup>
                                                    </Card.Body>
                                                </Card>
                                                <Card className={"filter-panel"} style={{height: "35%"}}>
                                                    <Card.Body>
                                                        <Card.Title> Legend </Card.Title>
                                                    </Card.Body>
                                                </Card>
                                            </Card>
                                        </Col>
                                        <Col xl={10}>
                                            <Card style={{background: "#f8f8f8"}}>
                                                <Card.Header>
                                                    <h5>
                                                        <a>Artist-Genre Network</a>
                                                        <BsQuestionCircle/>
                                                    </h5>
                                                </Card.Header>
                                                <div id="edge-map" style={{"width": "75%", "height" : "820px"}}></div>
                                            </Card>
                                        </Col>
                                    </Row>
                                </Card>
                            </Row>
                            <Row className={"row-col-pad"}>
                                <Card className={"display-card"}>
                                    <Card.Header className={"card-header-dark headingOne"}>
                                        <h4>
                                            Daily Listening Pattern
                                            <BsQuestionCircle/>
                                        </h4>
                                    </Card.Header>
                                    <CalendarHeatmap/>
                                </Card>
                            </Row>
                    </Col>
                    <Col xl={3} md={6} className={"row-col-pad"}>
                        <Card className={"display-card"}>
                            <Card.Header className={"card-header-dark"}>
                                <h4>
                                    Top 20 Artists
                                    <BsQuestionCircle/>
                                </h4>
                            </Card.Header>
                            <br/>
                            <Card.Header className={"card-header-dark"}>
                                <h5 style={{paddingBottom: "10px"}}>Sorting Criteria</h5>
                                <div className={"button-span"}>
                                    <Button variant="info" style={{width: "30%"}}>Streaming Time</Button>{' '}
                                    <Button variant="info" style={{width: "30%"}}>Artist Popularity</Button>{' '}
                                    <Button variant="info" style={{width: "30%"}}>Alphabetical</Button>
                                </div>
                            </Card.Header>
                            <br/>
                            <D3BarChart/>
                        </Card>
                    </Col>
                </Row>

                <Row lg={12} className={"row-pad"}>
                    <Card className={"display-card headingOne"}>
                        <Card.Header className={"card-header-dark"}>
                            <h4>
                               Track Features Distribution
                                <BsQuestionCircle/>
                            </h4>
                        </Card.Header>
                        <div id="distribution-map" style={{"width": "100%", "height" : "500px"}}></div>
                    </Card>
                </Row>

            </Container>
        </>

    );
}

export default App;
import './App.css';
import  D3BarChart, { sortByName, sortByStream, sortByPopularity } from "./D3BarChart";
import CalendarHeatmap from "./CalendarHeatmap";
import D3Timeline from "./D3Timeline";
import logo from "./logo/logo1.png"
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useRef, useState } from "react";
import { DropdownSelect } from "./DropdownSelect"
import { Navbar, Container, Form, Nav, Row, Col, Card, InputGroup, Button } from "react-bootstrap";
import { BsQuestionCircle } from 'react-icons/bs';
import { Edgemap } from './edgemap/Edgemap';
import topArtistsData from "./data/Jonatan_data/top_artists.json";
import {EdgemapView} from "./edgemap/edgemap_functions";

const options = [
    { value: 'listening-history', label: 'Listening History' },
    { value: 'popularity', label: 'Popularity' },
    { value: 'alphabetical', label: 'Alphabetical' },
];

const sortAlpha = () => sortByName();
const sortStream = () => sortByStream();
const sortPopularity = () => sortByPopularity();

function App() {
    const colourArtist = () => {
        const elem = document.getElementById("colour-map");
        elem.value = "genrePos";
        const ev = new Event('change',  { bubbles: true});
        elem.dispatchEvent(ev)
    }

    const colourFeatures = () => {
        const elem = document.getElementById("colour-map");
        elem.value = "featurePos";
        const ev = new Event('change',  { bubbles: true});
        elem.dispatchEvent(ev)
    }

    const colourTimeline = () => {
        const elem = document.getElementById("colour-map");
        elem.value = "timelinePos";
        const ev = new Event('change',  { bubbles: true});
        elem.dispatchEvent(ev)
    }

    const positionArtist = () => {
        const elem = document.getElementById("position");
        elem.value = "genreSimilarity";
        var ev = new Event('change',  { bubbles: true});
        elem.dispatchEvent(ev)
    }

    const positionFeatures = () => {
        const elem = document.getElementById("position");
        elem.value = "featureSimilarity";
        var ev = new Event('change',  { bubbles: true});
        elem.dispatchEvent(ev)
    }

    const positionTimeline = () => {
        const elem = document.getElementById("position");
        elem.value = "timeline";
        var ev = new Event('change',  { bubbles: true});
        elem.dispatchEvent(ev)
    }

    const nodeRedraw = (selected) => {
        console.log("Here")
        const elem = document.getElementById("nodes-number");
        elem.value = selected.target.value;
        let ev = new Event('change',  { bubbles: true});
        // ev.target = selected.target
        elem.dispatchEvent(ev)
    }

    const displayAttr = (selected) => {
        const elem = document.getElementById("attributes");
        if (selected.target.checked) elem.checked = true;
        else elem.checked = false;
        var ev = new Event('click',  { bubbles: true});
        elem.dispatchEvent(ev)
    }

    // IDs of artists to include in the edgemap
    const [edgemapArtists, setEdgemapArtists] = useState(undefined);
    console.log(edgemapArtists)

    let fullData = require("./data/Jonatan_data/processed_filtered_dataset.json");

    const topArtistsData = require("./data/Jonatan_data/top_artists.json");
    const streamingData = new Map(Object.entries(fullData));
    const timelineData = require("./data/Jonatan_data/timeline_data.json");

    return (
        <>
            <Navbar bg="dark" variant="dark">
                <Nav className="container-fluid">
                    <Navbar.Brand class>
                        <img alt="" src={logo}
                             width="100%"
                             height="70"
                             className="d-inline-block align-top"
                             style={{marginLeft: "40px"}}
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
                <Row md={12} className={"row-col-pad"}>
                    <Col md={9} s={6}>
                            <Row md={9} className={"row-col-pad"}>
                                <Card className={"display-card"}>
                                    <Row md={9}>
                                        <Col md={2}>
                                            <Card className={"filter-panel"}>
                                                <Card.Header>
                                                    <h5>
                                                        <a> Control Panel</a>
                                                        <BsQuestionCircle/>
                                                    </h5>
                                                </Card.Header>
                                                <Card className={"filter-panel"} style={{height: "15%"}}>
                                                    <Card.Body>
                                                        <Card.Title> Colour By </Card.Title>
                                                        <Form id={"colour-by"}>
                                                            <Form.Check inline label=" Artist Genres" name="colour-by" type={"radio"} onChange={colourArtist}/>
                                                            <Form.Check inline label=" Artist Features" name="colour-by" type={"radio"} onChange={colourFeatures}/>
                                                            <Form.Check inline label="Artist Timeline" name="colour-by" type={"radio"} onChange={colourTimeline}/>
                                                        </Form>
                                                    </Card.Body>
                                                </Card>
                                                <Card className={"filter-panel"} style={{height: "15%"}}>
                                                    <Card.Body>
                                                        <Card.Title> Position By </Card.Title>
                                                            <Form id={"position-by"}>
                                                                <Form.Check inline label=" Artist Genres" name="position-by" type={"radio"} onChange={positionArtist}/>
                                                                <Form.Check inline label=" Artist Features" name="position-by" type={"radio"} onChange={positionFeatures}/>
                                                                <Form.Check inline label="Artist Timeline" name="position-by" type={"radio"} onChange={positionTimeline}/>
                                                            </Form>
                                                    </Card.Body>
                                                </Card>
                                                <Card className={"filter-panel"} style={{height: "16%"}}>
                                                    <Card.Body>
                                                        <Card.Title> Number of Artists to Display</Card.Title>
                                                            <InputGroup>
                                                                <InputGroup.Text >nodes</InputGroup.Text>
                                                                <Form.Control style={{width: "70%"}} type="number" min="1" max={topArtistsData.length} placeholder={"eg. 10, 20, 50"} onChange={nodeRedraw}/>
                                                            </InputGroup>
                                                    </Card.Body>
                                                </Card>
                                                <Card className={"filter-panel"} style={{height: "10%"}}>
                                                    <Card.Body>
                                                        <Card.Title> Display Attributes</Card.Title>
                                                        <Form id={"display-attr"}>
                                                            <Form.Check inline label=" Artist Names" type={"checkbox"} onChange={displayAttr} selected/>
                                                        </Form>
                                                    </Card.Body>
                                                </Card>
                                                <Card className={"filter-panel"} style={{height: "40%"}}>
                                                    <Card.Body>
                                                        <Card.Title> Legend </Card.Title>
                                                    </Card.Body>
                                                </Card>
                                            </Card>
                                        </Col>
                                        <Col md={10}>
                                            <Card className={"display-card"}>
                                                <Card.Header>
                                                    <h5>
                                                        <a>Artist-Genre Network</a>
                                                        <BsQuestionCircle/>
                                                    </h5>
                                                </Card.Header>
                                                <div id="edgemap-container" style={{"width": "100%", "height" : "900px"}}>
                                                    <Edgemap artistIDs={edgemapArtists}/>
                                                </div>
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
                                    <CalendarHeatmap
                                        streamingData = { streamingData }
                                        topArtistsData = { topArtistsData }
                                        timelineData = { timelineData }
                                        setEdgemapArtists = { setEdgemapArtists }
                                    />
                                </Card>
                            </Row>
                    </Col>
                    <Col md={3} s={6} className={"row-col-pad"}>
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
                                    <Button variant="info" style={{width: "30%"}} onClick={sortStream}>
                                        Streaming Time
                                    </Button>
                                    {' '}
                                    <Button variant="info" style={{width: "30%"}} onClick={sortPopularity}>
                                        Artist Popularity
                                    </Button>
                                    {' '}
                                    <Button variant="info" style={{width: "30%"}} onClick={sortAlpha}>
                                        Alphabetic
                                    </Button>
                                </div>
                            </Card.Header>
                            <br/>
                            <D3BarChart
                                topArtistsData = { topArtistsData }
                            />
                        </Card>
                    </Col>
                </Row>

                <Row md={12} className={"row-pad"}>
                    <Card className={"display-card headingOne"}>
                        <Card.Header className={"card-header-dark"}>
                            <h4>
                                Detailed Listening History per Day
                                <BsQuestionCircle/>
                            </h4>
                        </Card.Header>
                        <D3Timeline
                            data = { timelineData }
                        />
                    </Card>
                </Row>

            </Container>
        </>

    );
}

export default App;
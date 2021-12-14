import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { artistStreamTimes } from "./derived_data";
import { autoPlayInterval } from "./constants";
import { EdgemapView, NodePositionKey, setNodeColorKey, setShowLabels, setupEdgemap, updateEdgemap } from "./edgemap_functions";
import * as utils from './utils';
import { ArtistID } from "./data";

import './edgemap.css'
import { Card, Col, Form, Row } from "react-bootstrap";
import { BsFillPauseCircleFill, BsFillPlayCircleFill, BsQuestionCircle } from "react-icons/bs";


export type EdgemapProps = {
    artistIDs: ArtistID[]
    autoPlay: boolean,
}


const valuesOrdered = (() => {
    const topValues = [50, 100, 150];
    const viewValues: EdgemapView[] = ["genreSimilarity", "featureSimilarity", "timeline"];
    const colorValues: NodePositionKey[] = ["genrePos", "featurePos", "timelinePos"];
    const displayValues = [false, true];
    
    return [
        topValues,
        viewValues,
        colorValues,
        displayValues
    ]
})();

const allValueCombinations: (number | EdgemapView | NodePositionKey | boolean)[][] = 
    valuesOrdered.slice(1).reduce((acc, arr) => utils.cartesianProduct(acc, arr), valuesOrdered[0]);
    
const sortedArtistIDs = Array.from(artistStreamTimes.keys())
const debouncedUpdateEdgemap = utils.debounce(updateEdgemap, 300);
let autoPlayTimeout = null;
export const Edgemap = ({ artistIDs }: EdgemapProps) => {
    const [autoPlay, setAutoPlay] = useState(true);
    const [autoPlayCounter, setAutoPlayCounter] = useState(0);

    const [top, setTop] = useState(50);
    const topArtists = Array.from(artistIDs || sortedArtistIDs).slice(0, top);    
    
    const [view, setView] = useState<EdgemapView>("genreSimilarity");
    const [colorKey, setColorKey] = useState<NodePositionKey>("genrePos");
    const [displayLabels, setDisplayLabels] = useState(false);

    const edgemapRef = useRef<SVGSVGElement>();
    
    useEffect(() => 
        setupEdgemap(edgemapRef.current, topArtists),
        []
    );
    useEffect(() => 
        top && debouncedUpdateEdgemap(topArtists, view),
        [view, top, artistIDs]
    );
    useEffect(() => 
        setNodeColorKey(colorKey),
        [colorKey]
    );
    useEffect(() => 
        setShowLabels(displayLabels),
        [displayLabels]
    );

    if (autoPlay && !autoPlayTimeout) {
        const prevViewIndex = utils.mod(autoPlayCounter - 2, allValueCombinations.length);
        const viewChanged = allValueCombinations[prevViewIndex][1] !== view;
        autoPlayTimeout = setTimeout(() => {
            autoPlayTimeout = null;
            // NB! Must match valuesOrdered order
            const [autoTop, autoView, autoColor, autoDisplay] = allValueCombinations[autoPlayCounter];
            
            ReactDOM.unstable_batchedUpdates(() => {
                setAutoPlayCounter((autoPlayCounter + 1) % allValueCombinations.length);
                setTop(autoTop as number);
                setView(autoView as EdgemapView);
                setColorKey(autoColor as NodePositionKey);
                setDisplayLabels(autoDisplay as boolean);
            })
        },
        autoPlayInterval * (+viewChanged + 1)
        )
    } else if (!autoPlay && autoPlayTimeout) {
        clearTimeout(autoPlayTimeout);
    }

    return (
    <Row md={9}>
        <Col md={2}>
            <Card className={"filter-panel"}>
                <Card.Header>
                    <h5>
                        <a>Control Panel</a>
                        <BsQuestionCircle/>
                    </h5>
                </Card.Header>
                <Card className={"filter-panel"} style={{height: "15%"}}>
                    <Card.Body>
                        <Card.Title>Colour By </Card.Title>
                        <Form id={"colour-by"} onChange={e => setColorKey(e.target.value as NodePositionKey)}>
                            <Form.Check inline label="Artist Genres" name="colour-by" type={"radio"} checked={colorKey === "genrePos"}  value={"genrePos"}/>
                            <Form.Check inline label="Artist Features" name="colour-by" type={"radio"} checked={colorKey === "featurePos"} value={"featurePos"}/>
                            <Form.Check inline label="Artist Timeline" name="colour-by" type={"radio"} checked={colorKey === "timelinePos"} value={"timelinePos"}/>
                        </Form>
                    </Card.Body>
                </Card>
                <Card className={"filter-panel"} style={{height: "15%"}}>
                    <Card.Body>
                        <Card.Title>Position By </Card.Title>
                            <Form onChange={e => setView(e.target.value as EdgemapView)} id={"position"}>
                                <Form.Check inline label="Artist Genres" name="position-by" type={"radio"} checked={view === "genreSimilarity"} value={"genreSimilarity"}/>
                                <Form.Check inline label="Artist Features" name="position-by" type={"radio"} checked={view === "featureSimilarity"} value={"featureSimilarity"}/>
                                <Form.Check inline label="Artist Timeline" name="position-by" type={"radio"} checked={view === "timeline"} value={"timeline"}/>
                            </Form>
                    </Card.Body>
                </Card>
                <Card className={"filter-panel"} style={{height: "16%"}}>
                    <Card.Body>
                        <Card.Title>Number of Artists to Display</Card.Title>
                            <Form onChange={e => setTop(parseInt(e.target.value))}>
                                {/*<InputGroup.Text>nodes</InputGroup.Text>*/}
                                <Form.Control style={{width: "70%"}} type="number" min="1" max={500} value={top}/>
                            </Form>
                    </Card.Body>
                </Card>
                <Card className={"filter-panel"} style={{height: "10%"}}>
                    <Card.Body>
                        <Card.Title>Display Attributes</Card.Title>
                        <Form id={"display-attr"}>
                            <Form.Check inline label="Artist Names" type={"checkbox"} checked={displayLabels} onClick={_ => setDisplayLabels(!displayLabels)}/>
                        </Form>
                    </Card.Body>
                </Card>
                <Card className={"filter-panel"} style={{height: "40%"}}>
                    <Card.Body>
                        <Card.Title>Legend</Card.Title>
                        <Card.Text>
                            <p>Node color: </p>
                            <p>Node position: </p>
                            <p>Node size: Artist streaming time</p>
                            <p>Edges: Common genres</p>
                            <p>Edges lightness: Proportion of genres in common</p>
                            <p>Edges thickness: Number of genres in common</p>
                        </Card.Text>
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
                    <span id="edgemap-autoplay-toggle" onClick={() => setAutoPlay(!autoPlay)}>
                        {autoPlay ? <BsFillPauseCircleFill />: <BsFillPlayCircleFill />}
                    </span>
                    <svg id="edgemap" ref={edgemapRef}></svg>
                </div>
            </Card>
        </Col>
    </Row>
    );
}
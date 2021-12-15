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
                            <svg id="legend-svg" style={{width: "100%", height: "100%"}} viewBox="0 0 100 100">
                                <g>
                                    <circle cx="4" cy="11" r="1"/>
                                    <circle cx="8" cy="9.5" r="2"/>
                                    <circle cx="15" cy="7" r="4"/>
                                    <text x="25" y="11">
                                        Artist streaming time
                                    </text>
                                </g>
                                <line x1="0" x2="100" y1="13" y2="13" stroke="#bcb5dd"/>
                                <g>
                                    <circle cx="5" cy="20" r="4.5" fill={colorKey === "timelinePos" ? "#27426e" : "#5c8c26"}/>
                                    <circle cx="15" cy="20" r="4.5" fill={colorKey === "timelinePos" ? "#e4cd5a" : "#932520"}/>
                                    <text x="25" y="25">
                                        Artist {colorKey === 'featurePos' ? "musical qualities" : 
                                                colorKey === 'genrePos' ? "genres" : "date of first stream"}
                                    </text>
                                </g>
                                <line x1="0" x2="100" y1="27" y2="27" stroke="#bcb5dd"/>
                                <g>
                                    <path 
                                        d="M 0 35 C 7 28, 15 28, 22 35"
                                        fill="none" stroke-width="2" stroke={colorKey === "timelinePos" ? "#f4dd6a" : "#2d7185"}
                                    />
                                    <text x="25" y="38">
                                        Genres in common
                                    </text>
                                </g>
                                <line x1="0" x2="100" y1="40" y2="40" stroke="#bcb5dd"/>
                                <g>
                                    <path 
                                            d="M 0 46 C 7 40, 15 40, 22 46"
                                            fill="none" stroke-width="1"
                                            stroke="white"
                                    />
                                    <path 
                                            d="M 0 48 C 7 42, 15 42, 22 48"
                                            fill="none" stroke-width="1"
                                            stroke="grey"
                                    />
                                    <path 
                                            d="M 0 50 C 7 44, 15 44, 22 50"
                                            fill="none" stroke-width="1"
                                            stroke="black"
                                    />
                                    <text x="25" y="51">
                                        Proportion of genres shared
                                    </text>
                                </g>
                                <line x1="0" x2="100" y1="53" y2="53" stroke="#bcb5dd"/>
                                <g>
                                    <path 
                                            d="M 0 59 C 7 54, 15 54, 22 59"
                                            fill="none" stroke="black"
                                            stroke-width="3"
                                    />
                                    <path 
                                            d="M 0 63 C 7 58, 15 58, 22 63"
                                            fill="none" stroke="black"
                                            stroke-width="2"
                                    />
                                    <path 
                                            d="M 0 65 C 7 61, 15 61, 22 65"
                                            fill="none" stroke="black"
                                            stroke-width="1"
                                    />
                                    <text x="25" y="64">
                                        Number of genres shared
                                    </text>
                                </g>
                                <line x1="0" x2="100" y1="66" y2="66" stroke="#bcb5dd"/>
                                <g>
                                    {/* Arrow from: http://thenewcode.com/1068/Making-Arrows-in-SVG */}
                                    <defs>
                                        <marker id="arrowhead" markerWidth="2" markerHeight="3" 
                                        refX="0" refY="1.5" orient="auto">
                                        <polygon points="0 0, 2 1.5, 0 3" />
                                        </marker>
                                    </defs>
                                    <line x1="0" x2="22" y1="70" y2="70" stroke="gray" stroke-width="0.6" />
                                    <line x1="0" x2="22" y1="75" y2="75" stroke="gray" stroke-width="0.6" />
                                    <line x1="6" x2="6" y1="67" y2="78" stroke="gray" stroke-width="0.6" />
                                    <line x1="16" x2="16" y1="67" y2="78" stroke="gray" stroke-width="0.6" />
                                    
                                    <circle cx="4" cy="70" r="2"/>
                                    <circle cx="18" cy="75" r="2"/>

                                    <line x1="7" x2="13.5" y1="71" y2="73.5" 
                                        stroke="black"
                                        stroke-width="1" marker-end="url(#arrowhead)"
                                    />
                                    
                                    <text x="25" y="77">
                                        {view === "timeline" ? "Artist date of first stream" 
                                        : "Similarity by " + (view === "genreSimilarity" ? "genre" : "musical qualities")}
                                    </text>
                                </g>
                                <line x1="0" x2="100" y1="79" y2="79" stroke="#bcb5dd" stroke-width="0.5"/>
                            </svg>
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
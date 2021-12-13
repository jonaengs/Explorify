import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { artistStreamTimes } from "./derived_data";
import { autoPlayInterval } from "./constants";
import { EdgemapView, NodePositionKey, setNodeColorKey, setShowLabels, setupEdgemap, updateEdgemap } from "./edgemap_functions";
import * as utils from './utils';
import { artistID } from "./data";

import './edgemap.css'


export type EdgemapProps = {
    autoPlay: boolean,
    artistIDs: artistID[]
}


const valuesOrdered = (() => {
    const topValues = [50, 100, 150];
    const viewValues: EdgemapView[] = ["genreSimilarity", "featureSimilarity", "timeline"];
    const colorValues: NodePositionKey[] = ["genrePos", "featurePos", "timelinePos"];
    const displayValues = [false, true, false];
    
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
let autoPlayTimer = null;
export const Edgemap = ({autoPlay = false, artistIDs = sortedArtistIDs}: EdgemapProps) => {
    const [autoPlayCounter, setAutoPlayCounter] = useState(0);

    const [top, setTop] = useState(50);
    const topArtists = Array.from(artistIDs).slice(0, top);    
    
    const [view, setView] = useState<EdgemapView>("genreSimilarity");
    const [colorKey, setColorKey] = useState<NodePositionKey>("genrePos");
    const [displayLabels, setDisplayLabels] = useState(true);    

    const edgemapRef = useRef<SVGSVGElement>();
    
    useEffect(() => 
        setupEdgemap(edgemapRef.current, topArtists),
        []
    );
    useEffect(() => 
        top && debouncedUpdateEdgemap(topArtists, view),
        [view, top]
    );
    useEffect(() => 
        setNodeColorKey(colorKey),
        [colorKey]
    );
    useEffect(() => 
        setShowLabels(displayLabels),
        [displayLabels]
    );

    if (autoPlay && !autoPlayTimer) {
        autoPlayTimer = setTimeout(() => {
            autoPlayTimer = null;
            // TODO: Must match valuesOrdered order
            const [autoTop, autoView, autoColor, autoDisplay] = allValueCombinations[autoPlayCounter];
            console.log(autoTop, autoView, autoColor, autoDisplay);
            
            ReactDOM.unstable_batchedUpdates(() => {
                setAutoPlayCounter((autoPlayCounter + 1) % allValueCombinations.length);
                setTop(autoTop as number);
                setView(autoView as EdgemapView);
                setColorKey(autoColor as NodePositionKey);
                setDisplayLabels(autoDisplay as boolean);

            })
        },
        autoPlayInterval
        )
    }
    
    return <div id="edgemap-container">
        <div id="edgemap-controls-container">
            <select onChange={e => setView(e.target.value as EdgemapView)} value={view}>
                <option value="genreSimilarity">genre</option>
                <option value="timeline">time</option>
                <option value="featureSimilarity">feature</option>
            </select>
            <select onChange={e => setColorKey(e.target.value as NodePositionKey)} value={colorKey}>
                <option value="genrePos">genre</option>
                <option value="timelinePos">time</option>
                <option value="featurePos">feature</option>
            </select>
            <input type="number" value={top} onChange={e => setTop(parseInt(e.target.value))}/>
            <input type="checkbox" checked={displayLabels} onClick={_ => setDisplayLabels(!displayLabels)} onChange={() => null}/>
        </div>
        <svg id="edgemap" ref={edgemapRef}></svg>
    </div>
}
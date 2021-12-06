import { utcMilliseconds } from "d3";
import React, { useEffect, useRef, useState } from "react";
import { artistStreamTimes } from "./derived_data";
import { Edgemap, EdgemapView, NodePositionKey, setNodeColorKey, setupEdgemap, updateEdgemap } from "./edgemap";
import * as utils from './utils';


const update = utils.debounce(updateEdgemap, 300);
export const App = () => {
    const [top, setTop] = useState(50);
    const topArtists = Array.from(artistStreamTimes.keys()).slice(0, top);    
    
    const [view, setView] = useState<EdgemapView>("genreSimilarity");
    const [colorKey, setColorKey] = useState<NodePositionKey>("genrePos");
    
    const edgemapRef = useRef();
    useEffect(() => 
        setupEdgemap(edgemapRef.current, topArtists),
        []
    );
    useEffect(() => 
        top && update(topArtists, view),
        [view, topArtists]
    );
    useEffect(() => 
        setNodeColorKey(colorKey),
        [colorKey]
    );
    
    return <>
        <select onChange={e => setView(e.target.value as EdgemapView)}>
            <option value="genreSimilarity">genre</option>
            <option value="timeline">time</option>
            <option value="featureSimilarity">feature</option>
        </select>
        <select onChange={e => setColorKey(e.target.value as NodePositionKey)}>
            <option value="genrePos">genre</option>
            <option value="timelinePos">time</option>
            <option value="featurePos">feature</option>
        </select>
        <input type="number" value={top} onChange={e => setTop(e.target.value)}/>
        <svg id="edgemap" ref={edgemapRef}></svg>
    </>
}
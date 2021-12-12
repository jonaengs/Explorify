import React, { useEffect, useRef, useState } from "react";
import { artistStreamTimes } from "../derived_data";
import { EdgemapView, NodePositionKey, setNodeColorKey, setShowLabels, setupEdgemap, updateEdgemap } from "./edgemap_functions";
import * as utils from './utils';


const debouncedUpdateEdgemap = utils.debounce(updateEdgemap, 300);
export const Edgemap = () => {
    const [top, setTop] = useState(50);
    const topArtists = Array.from(artistStreamTimes.keys()).slice(0, top);    
    
    const [view, setView] = useState<EdgemapView>("genreSimilarity");
    const [colorKey, setColorKey] = useState<NodePositionKey>("genrePos");
    const [displayLabels, setdisplayLabels] = useState(true);    

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
        <input type="number" value={top} onChange={e => setTop(parseInt(e.target.value))}/>
        <input type="checkbox" checked={displayLabels} onClick={_ => setdisplayLabels(!displayLabels)} onChange={() => null}/>
        <svg id="edgemap" ref={edgemapRef}></svg>
    </>
}
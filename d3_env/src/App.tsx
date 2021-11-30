import { utcMilliseconds } from "d3";
import React, { useEffect, useRef, useState } from "react";
import { getStreamTimes } from "./derived_data";
import { Edgemap, setupEdgemap, updateEdgemap } from "./edgemap";
import * as utils from './utils';


export const App = () => {
    const [top, setTop] = useState(150);
    const topArtists = Array.from(getStreamTimes().keys()).slice(0, top);    
    console.log(top);
    
    const edgemapRef = useRef();
    useEffect(() => {
        setupEdgemap(edgemapRef.current, topArtists);
        // Cleanup needed?
        return () => null;
    }, []);
    useEffect(() => top && updateEdgemap(topArtists), [topArtists]);
    
    return <>
        <input type="number" value={top} onChange={e => setTop(e.target.value)}/>
        <svg id="edgemap" ref={edgemapRef}></svg>
    </>

    // return <>
    //     <input type="number" value={top} onChange={e => setTop(e.target.value)}/>
    //     <Edgemap artists={topArtists} />
    // </>
}
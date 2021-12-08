import React, {useRef, useEffect, useState} from "react";
import * as d3 from 'd3';

const D3Timeline = (props) => {

    const timeline = useRef()
    const timelineZoom = useRef()


    return (
        <div id="timeline-zoom">
            <svg ref={timelineZoom}></svg>
        </div>
        <div id="timeline">
            <svg ref={timeline}></svg>
        </div>
    )
}

export default D3Timeline;
import React, {useRef, useEffect, useState} from "react";
import * as d3 from 'd3';
import { msToTime } from "./helpers"
import { getArtistColor } from "./edgemap/edgemap_functions";

const margin = {
    top: 40,
    right: 10,
    bottom: 10,
    left: 10
};

const w = 2300 - margin.left - margin.right;
const h = 250 - margin.top - margin.bottom;

const barHeight = 100;

const toolDate = d3.timeFormat("%d %b %Y");

const extractYMD = function (s){
    s = s.split("-")
    return [parseInt(s[0]), parseInt(s[1]), parseInt(s[2])]
}

export function updateColours(){
    const svg = d3.select("#timeline")
        .select("svg");

    let rect = svg.selectAll("rect")

    rect.transition(2000)
        .style("fill", function(d) {
            return getArtistColor(d.artist_id)
        })
}

export function updateTimeline(date, dateData) {
    const svg = d3.select("#timeline")
        .select("svg")
        .style("display", "flex");
    svg.selectAll("g > *").remove();

    svg.append("g")
        .append("text")
        .attr("class","date-title")
        .attr("x", w / 2)
        .attr("y", margin.top)
        .text("Details for Date: " + toolDate(new Date(extractYMD(date))))

    const chartStart = dateData[0].start
    const chartEnd = dateData[dateData.length - 1].end

    const xScale = d3.scaleLinear()
        .domain([chartStart, chartEnd])
        .range([margin.left, w - margin.right])

    const xScaleTicks = d3.scaleTime()
        .domain([new Date(chartStart), new Date(chartEnd)])
        .range([margin.left, w - margin.right])

    const xAxis = d3.axisBottom(xScaleTicks);

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${margin.top * 3 + barHeight - 20})`)
        .call(xAxis);

    let rect = svg.selectAll("rect")
        .data(dateData)
        .enter()
        .append("g")

    rect.append("rect")
        .attr("class", "timeline-bar")
        .attr("transform", `translate(0, ${margin.top * 2})`)
        .style("fill", function(d) {
            return getArtistColor(d.artist_id)
        })

    svg.selectAll("rect")
        .data(dateData)
        .transition()
        .duration(1000)
        .attr("x", function(d) {
            return xScale(d.start)
        })
        .attr("y", margin.bottom)
        .attr("width", function(d) {
            return xScale(d.end) - xScale(d.start)
        })
        .attr("height", barHeight)



    let div = d3.select("body").append("div").attr("class", "toolTip");
    let timelineBars = svg.selectAll(".timeline-bar")

    timelineBars.on("mousemove", function(event, d) {
        d3.select(this).classed("hover", true);
        div.style("left", event.pageX+10+"px");
        div.style("top", event.pageY-25+"px");
        div.style("display", "inline-block");
        div.html((d.artist_name)+"<br>"+(msToTime(d.end - d.start)));
    }).on("mouseout", function (d) {
        d3.select(this).classed("hover", false)
        div.style("display", "none");
    })

}

export function hideTimeline(){
    d3.select("#timeline").select("svg").style("display", "none");
}

const D3Timeline = (props) => {

    const timeline = useRef();
    const timelineZoom = useRef();
    const data = props.data;

    useEffect(() => {
        const svg = d3.select(timeline.current)
            .attr("width", w + margin.left + margin.right)
            .attr("height", h + margin.top + margin.bottom)
            .style("margin", "40 10 10 10")
            .style("display", "none")
            // .attr("viewBox", "0 0 " + dimensions.width + " " + dimensions.height)
    })

    return (
        <>
            {/*<div id="timeline-zoom">*/}
            {/*    <svg ref={timelineZoom}></svg>*/}
            {/*</div>*/}
            <div id="timeline">
                <svg ref={timeline}></svg>
            </div>
        </>
)
}

export default D3Timeline;
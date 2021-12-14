import React, {useRef, useEffect, useState} from "react";
import * as d3 from 'd3';
import { groupBy, msToTime, comparator} from "./helpers"
import { setEMHighlighted } from "./edgemap/edgemap_functions";

const margin = {
    top: 20,
    right: 30,
    bottom: 10,
    left: 200
};

const w = 530 - margin.left - margin.right;
const h = 1100 - margin.top - margin.bottom;

export function updateEmpty(){
    d3.select("#bar-chart").select("svg").style("display", "none");
}

export function updateBar(artistsForDay){

    const top20ArtistsForDay = artistsForDay.slice(0, 20);

    const maxDuration = d3.max(top20ArtistsForDay, d => d.artist_duration)

    let yScale = d3.scaleBand()
        .domain(d3.range(top20ArtistsForDay.length))
        .rangeRound([0, h])
        .padding(0.2);

    let yScaleTicks = d3.scaleBand()
        .domain(d3.range(top20ArtistsForDay.length))
        .rangeRound([0, h])
        .padding(0.05);

    let xScale = d3.scaleLinear()
        .range([0, w])
        .domain([0, maxDuration])

    let yAxis = d3.axisLeft(yScaleTicks)
        .tickFormat(function (d){
            let artist = top20ArtistsForDay[d].name
            if (artist.length < 20)
                return artist
            else
                return artist.slice(0, 15) + "..."
        });

    let svg = d3.select("#bar-chart")
        .select("svg")
        .style("display", "flex");

    svg.selectAll(".bar")
        .data(top20ArtistsForDay)
        .transition()
        .duration(2000) // 2 seconds
        .attr("x", function (d) {
            return w - xScale(d.artist_duration)
        })
        .attr("y", function (d, i) {
            return yScale(i)
        })
        .attr("x", margin.left)
        .attr("height", yScale.bandwidth())
        .attr("width", function (d) {
            return xScale(d.artist_duration);
        })

    svg.selectAll(".label")
        .data(top20ArtistsForDay)
        .transition()
        .duration(2000)
        .attr("x", function (d) {
            return xScale(d.artist_duration) + margin.left + 10;
        })
        .attr("y", function (d, i){
            return yScale(i) + margin.top;
        })
        .text(function (d, i){
            if (d.artist_duration != 0){
                return "#" + d.rank
            }
        })

    svg.selectAll(".y-axis")
        .transition()
        .duration(2000)
        .call(yAxis)

}

export function sortByName() {
    const compareFn = (first, second) => {
        if (first[0].name > second[0].name || first[0].name == "") return 1;
        return -1;
    }

    const compareFn1 = (first, second) => {
        if (first.name > second.name || first.name == "") return 1;
        return -1;
    }

    let svg = d3.select("#bar-chart")
        .select("svg")
        .style("display", "flex");

    let rect = svg.selectAll(".bar")

    let sortedNames = []
    rect.data().forEach(function (entry, i) {
        sortedNames.push([entry, i]);
    })

    sortedNames.sort(compareFn)

    let inedxMap = new Map()
    sortedNames.forEach(function (entry, i){
        inedxMap.set(entry[1], i)
    })

    let yScale = d3.scaleBand()
        .domain(d3.range(rect.data().length))
        .rangeRound([0, h])
        .padding(0.2);

    let yScaleTicks = d3.scaleBand()
        .domain(d3.range(rect.data().length))
        .rangeRound([0, h])
        .padding(0.05);

    let yAxis = d3.axisLeft(yScaleTicks)
        .tickFormat(function (d, i) {
            let artist = sortedNames[i][0].name
            if (artist.length < 20)
                return artist
            else
                return artist.slice(0, 15) + "..."
        });

    rect.transition()
        .duration(2000)
        .attr("y", function (d, i) {
            return yScale(inedxMap.get(i));
        })

    svg.selectAll(".label")
        .transition()
        .duration(2000)
        .attr("y", function (d, i) {
            return yScale(inedxMap.get(i)) + margin.top;
        })

    svg.selectAll(".y-axis")
        .transition()
        .call(yAxis)

    rect.data().sort(compareFn1)
}

export function sortByPopularity(){
    const compareFn = (first, second) => {
        if (first[0].popularity < second[0].popularity || second[0].popularity == 0) return 1;
        return -1;
    }

    const compareFn1 = (first, second) => {
        if (first.popularity < second.popularity || second.popularity == 0) return 1;
        return -1;
    }

    let svg = d3.select("#bar-chart")
        .select("svg")
        .style("display", "flex");

    let rect = svg.selectAll(".bar")

    let sortedNames = []
    rect.data().forEach(function (entry, i) {
        sortedNames.push([entry, i]);
    })

    sortedNames.sort(compareFn)

    let inedxMap = new Map()
    sortedNames.forEach(function (entry, i){
        inedxMap.set(entry[1], i)
    })

    let yScale = d3.scaleBand()
        .domain(d3.range(rect.data().length))
        .rangeRound([0, h])
        .padding(0.2);

    let yScaleTicks = d3.scaleBand()
        .domain(d3.range(rect.data().length))
        .rangeRound([0, h])
        .padding(0.05);

    let yAxis = d3.axisLeft(yScaleTicks)
        .tickFormat(function (d, i) {
            let artist = sortedNames[i][0].name
            if (artist.length < 20)
                return artist
            else
                return artist.slice(0, 15) + "..."
        });

    rect.transition()
        .duration(2000)
        .attr("y", function (d, i) {
            return yScale(inedxMap.get(i));
        })

    svg.selectAll(".label")
        .transition()
        .duration(2000)
        .attr("y", function (d, i) {
            return yScale(inedxMap.get(i)) + margin.top;
        })

    svg.selectAll(".y-axis")
        .transition()
        .call(yAxis)

    rect.data().sort(compareFn1)
}

export function sortByStream(){
    const compareFn = (first, second) => {
        if (first[0].artist_duration < second[0].artist_duration || second[0].artist_duration == 0) return 1;
        return -1;
    }

    const compareFn1 = (first, second) => {
        if (first.artist_duration < second.artist_duration || second.artist_duration == 0) return 1;
        return -1;
    }

    let svg = d3.select("#bar-chart")
        .select("svg")
        .style("display", "flex");

    let rect = svg.selectAll(".bar")

    let sortedNames = []
    rect.data().forEach(function (entry, i) {
        sortedNames.push([entry, i]);
    })

    sortedNames.sort(compareFn)

    let inedxMap = new Map()
    sortedNames.forEach(function (entry, i){
        inedxMap.set(entry[1], i)
    })

    let yScale = d3.scaleBand()
        .domain(d3.range(rect.data().length))
        .rangeRound([0, h])
        .padding(0.2);

    let yScaleTicks = d3.scaleBand()
        .domain(d3.range(rect.data().length))
        .rangeRound([0, h])
        .padding(0.05);

    let yAxis = d3.axisLeft(yScaleTicks)
        .tickFormat(function (d, i) {
            let artist = sortedNames[i][0].name
            if (artist.length < 20)
                return artist
            else
                return artist.slice(0, 15) + "..."
        });

    rect.transition()
        .duration(2000)
        .attr("y", function (d, i) {
            return yScale(inedxMap.get(i));
        })

    svg.selectAll(".label")
        .transition()
        .duration(2000)
        .attr("y", function (d, i) {
            return yScale(inedxMap.get(i)) + margin.top;
        })

    svg.selectAll(".y-axis")
        .transition()
        .call(yAxis)

    rect.data().sort(compareFn1)
}


const D3BarChart = (props) => {
    const topArtistsData = props.topArtistsData;
    const top20Artists = topArtistsData.slice(0, 20);

    // const data = require("./data/StreamingHistoryD.json");
    const barChart = useRef()

    useEffect(() => {
        let yScale = d3.scaleBand()
            .domain(d3.range(top20Artists.length))
            .rangeRound([0, h])
            .padding(0.2);

        let yScaleTicks = d3.scaleBand()
            .domain(top20Artists.map(function (d) { return d.name; }))
            .rangeRound([0, h])
            .padding(0.05);

        let xScale = d3.scaleLinear()
            .range([0, w])
            .domain([0, top20Artists[0].artist_duration])

        let yAxis = d3.axisLeft(yScaleTicks)
            .tickFormat(function (d){
                if (d.length < 20)
                    return d
                else
                    return d.slice(0, 15) + "..."
            });

        let svg = d3.select(barChart.current)
            .attr("width", w + margin.left + margin.right)
            .attr("height", h + margin.top + margin.bottom)
            .style("margin", "40 0 0 10")


        let rect = svg.selectAll("rect")
            .data(top20Artists)
            .enter()
            .append("g")

        rect.append("rect")
            .attr("class", "bar")
            .attr("x", function (d) {
                return w - xScale(d.artist_duration)
            })
            .attr("y", function (d, i) {
                return yScale(i)
            })
            .attr("x", margin.left)
            .attr("height", yScale.bandwidth())
            .attr("width", function (d) {
                return xScale(d.artist_duration);
            })

        rect.append("text")
            .attr("class", "label")
            .attr("x", function (d) {
                return xScale(d.artist_duration) + margin.left + 10;
            })
            .attr("y", function (d, i){
                return yScale(i) + margin.top;
            })
            .text(function (d){
                if (d.artist_duration != 0){
                    return "#" + d.rank
                }
            })

        svg.append("g")
            .attr("class","y-axis")
            .attr("transform", "translate(" + margin.left + ",0)")//magic number, change it at will
            .call(yAxis);


        let div = d3.select("body").append("div").attr("class", "toolTip");

        let bar = svg.selectAll(".bar")
            .data(top20Artists);

        bar.on("mousemove", function(event, d) {
            d3.select(this).classed("hover", true);
            div.style("left", event.pageX+10+"px");
            div.style("top", event.pageY-25+"px");
            div.style("display", "inline-block");
            div.html((d.name)+"<br>"+(msToTime(d.artist_duration)));
        }).on("mouseout", function (d) {
            d3.select(this).classed("hover", false)
            div.style("display", "none");
        }).on("click", function(event, d) {
            if(!d3.select(this).classed("selected")){
                d3.selectAll(".bar").classed("selected", false)
                d3.select(this).classed("selected", true);
                setEMHighlighted(d.id);
            } else {
                d3.select(this).classed("selected", false)
                setEMHighlighted(null);
            }
        });

    })

    return (
        <div id="bar-chart">
            <svg ref={barChart}></svg>
        </div>
    )
}

export function setBarchartHighlighted(id) {
    d3.selectAll("#bar-chart .bar").classed("selected", d => d.id === id);
}

export default D3BarChart;
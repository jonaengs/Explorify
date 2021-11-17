import React, {useRef, useEffect, useState} from "react";
import * as d3 from 'd3';
import { groupBy, msToTime, comparator} from "./helpers"

const margin = {
    top: 15,
    right: 25,
    bottom: 15,
    left: 80
};

const w = 450 - margin.left - margin.right;
const h = 550 - margin.top - margin.bottom;

export function updateBar(dataset){

    let yScale = d3.scaleBand()
        .domain(d3.range(dataset.length))
        .rangeRound([0, h])
        .padding(0.05);

    let yScaleTicks = d3.scaleBand()
        .domain(d3.range(dataset.length))
        .rangeRound([0, h])
        .padding(0.05);

    let xScale = d3.scaleLinear()
        .range([0, w])
        .domain([0, dataset[0][1]])

    let yAxis = d3.axisLeft(yScaleTicks)
        .tickFormat(function (d){
            let artist = dataset[d][0]
            if (artist.length < 12)
                return artist
            else
                return artist.slice(0, 10) + "..."
        });

    let svg = d3.select("#bar-chart").select("svg")

    svg.selectAll(".bar")
        .data(dataset)
        .transition()
        .duration(2000) // 2 seconds
        .attr("x", function (d) {
            return w - xScale(d[1])
        })
        .attr("y", function (d, i) {
            return yScale(i)
        })
        .attr("x", margin.left)
        .attr("height", yScale.bandwidth())
        .attr("width", function (d) {
            return xScale(d[1]);
        })

    svg.selectAll(".y-axis")
        .transition()
        .duration(2500)
        .call(yAxis)
}

const D3BarChart = () => {
    const data = require("./data/StreamingHistoryD.json");
    const barChart = useRef()
    const rawData = data.map(function (elem) {
        let entry = {}
        entry.date = elem.endTime.split(" ")[0];
        entry.msPlayed = elem.msPlayed;
        entry.artistName = elem.artistName;
        return entry;
    });


    let filteredData = Object.values(groupBy(rawData, "date"));

    let streamingData = filteredData.map(function (day) {
        let date = day[0]["date"];
        day = day.reduce(function (prev, cur) {
            prev.msPlayed = prev.msPlayed + cur.msPlayed;
            prev.artists[cur.artistName] = (prev.artists[cur.artistName] || 0) + cur.msPlayed;
            return prev;
        }, {"msPlayed": 0, "artists": {}});
        day.date = date;
        return day;
    });

    streamingData = streamingData.map(function (entry) {
        let artists = Object.keys(entry.artists).map(function (artist) {
            return [artist, entry.artists[artist]];
        });
        entry.artists = (artists.sort(comparator).concat(Array(19).fill([" ", 0]))).slice(0, 20)
        return entry
    })

    let allArtists = rawData.reduce(function (prev, cur) {
        prev[cur.artistName] = (prev[cur.artistName] || 0) + cur.msPlayed;
        return prev;
    }, {})

    allArtists = Object.keys(allArtists).map(function (artist) {
        return [artist, allArtists[artist]];
    });

    const top20Artists = allArtists.sort(comparator).slice(0, 20)
    const [datasetOnClick, changeDataset] = useState(top20Artists)

    console.log("chart", streamingData)

    useEffect(() => {
        let yScale = d3.scaleBand()
            .domain(d3.range(top20Artists.length))
            .rangeRound([0, h])
            .padding(0.05);

        let yScaleTicks = d3.scaleBand()
            .domain(top20Artists.map(function (d) { return d[0]; }))
            .rangeRound([0, h])
            .padding(0.05);

        let xScale = d3.scaleLinear()
            .range([0, w])
            .domain([0, top20Artists[0][1]])

        let yAxis = d3.axisLeft(yScaleTicks)
            .tickFormat(function (d){
                if (d.length < 12)
                    return d
                else
                    return d.slice(0, 10) + "..."
            });

        let svg = d3.select(barChart.current)
            .attr("width", w)
            .attr("height", h);

        svg.selectAll("rect")
            .data(top20Artists)
            // .transition()
            // .duration(2000)
            .enter()
            .append("g")
            .append("rect")
            .attr("class", "bar")
            .attr("x", function (d) {
                return w - xScale(d[1])
            })
            .attr("y", function (d, i) {
                return yScale(i)
            })
            .attr("x", margin.left)
            .attr("height", yScale.bandwidth())
            .attr("width", function (d) {
                return xScale(d[1]);
            })
            .attr("fill", "rgb(29,132,192)")

        svg.append("g")
            .attr("class","y-axis")
            .attr("transform", "translate(" + margin.left + ",0)")//magic number, change it at will
            .call(yAxis);

        let div = d3.select("body").append("div").attr("class", "toolTip");

        let bar = svg.selectAll(".bar")
            .data(top20Artists);

        bar.on("mousemove", function(event, d) {
            d3.select(this).style("fill", "rgb(19,107,154)");
            div.style("left", event.pageX+10+"px");
            div.style("top", event.pageY-25+"px");
            div.style("display", "inline-block");
            div.html((d[0])+"<br>"+(msToTime(d[1])));
        }).on("mouseout", function (d) {
            d3.select(this).style("fill", "rgb(29,132,192)");
            div.style("display", "none");
        });

        // bar.on("click", function (){
        //     updateBar(streamingData[Math.floor(Math.random() * 220)].artists);
        //     console.log("click")
        // })

    })

    return (
        <div id="bar-chart">
            <svg ref={barChart}></svg>
        </div>
    )
}

export default D3BarChart;
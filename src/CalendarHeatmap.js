import React, {useEffect, useRef, useState} from "react";
import * as d3 from "d3";
import {comparator, groupBy, msToTime} from "./helpers";
import { updateBar, updateEmpty } from "./D3BarChart";
// import {color, range} from "d3";

const cellSize = 30;
const cellMargin = 1;
const xOffset= 60;
const yOffset= 60;
const parseDate = d3.timeFormat("%Y-%m-%d");
const format = d3.timeFormat("%d-%m-%Y");
const toolDate = d3.timeFormat("%d %b %Y");

const CalendarHeatmap = () => {
    const data = require("./data/StreamingHistoryD.json");
    const calendarHeatmap = useRef();

    const rawData = data.map(function (elem) {
        let entry = {}
        entry.date = elem.endTime.split(" ")[0];
        entry.msPlayed = elem.msPlayed;
        entry.artistName = elem.artistName;
        return entry;
    });

    const extractYMD = function (s){
        s = s.split("-")
        return [parseInt(s[0]), parseInt(s[1]), parseInt(s[2])]
    }

    const minDate = new Date(extractYMD(rawData[0].date))
    const maxDate = new Date(extractYMD(rawData[rawData.length - 1].date))

    const dateRange = d3.timeDays(minDate, maxDate)

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

    streamingData = new Map(streamingData.map(value => [value.date, value]))
    dateRange.forEach(function (day){
        let date = parseDate(day)
        if (!streamingData.has(date)){
            streamingData.set(date, {"date": date, "msPlayed": 0, "artists" : Array(20).fill([" ", 0])})
        }
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

    const weeksInMonth = function(month){
        let m = d3.timeMonth.floor(month)
        return d3.timeWeeks(d3.timeWeek.floor(m), d3.timeMonth.offset(m,1)).length;
    }

    useEffect(() => {

        let scale = d3.scaleSequentialSqrt()
            .domain(d3.extent(streamingData.values(), function(d) { return parseInt(d.msPlayed); }))
            .range([0.05, 1]);

        const totalWeeks = d3.timeWeek.count(minDate, maxDate)

        let svg = d3.select(calendarHeatmap.current)
            .attr("width", ((cellSize + cellMargin) * (totalWeeks + 1) + xOffset))
            .attr("height", ((cellSize * 7) + (cellMargin * 8) + yOffset))
            .style("display", "block")
            .style("margin", "10 15 50 15")


        let rect = svg.append("g")
            .attr("id", "all-days")
            .selectAll(".day")
            .data(streamingData)
            .enter()
            .append("rect")
            .attr("id", function (d){
                return d[0];  // key
            })
            .attr("class", "day")
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("x", function (d){
                return xOffset + (d3.timeWeek.count(minDate, new Date(extractYMD(d[0]))) * (cellSize + cellMargin));
            })
            .attr("y", function (d){
                return yOffset + (new Date(extractYMD(d[0])).getDay() * (cellSize + cellMargin))
            })
            .attr("fill", function (d){
                return d3.interpolateBlues(scale(d[1].msPlayed))
            })

        let div = d3.select("body").append("div").attr("class", "toolTip");

        rect
            .on("mouseover", function(event, d) {
            let date = toolDate(new Date(extractYMD(d[0])))
            d3.select(this).classed('hover', true);
            div.style("left", event.pageX+10+"px");
            div.style("top", event.pageY-25+"px");
            div.style("display", "inline-block");
            div.html(`On ${date} listened <br> for ${(msToTime(d[1].msPlayed))}`);
        })
            .on("mouseout", function(event, d) {
                d3.select(this).classed('hover', false);
                div.style("display", "none");
            })
            .on("click", function(event, d) {
                d3.select("#bar-chart").selectAll(".bar").classed("selected", false);
                if(!d3.select(this).classed("selected")){
                    d3.selectAll(".day").classed("selected", false)
                    d3.select(this).classed('hover', true);
                    d3.select(this).classed("selected", true);
                    if (d[1].msPlayed != 0)
                        updateBar(d[1].artists)
                    else
                        updateEmpty()
                } else {
                    d3.select(this).classed('hover', false);
                    d3.select(this).classed("selected", false)
                    updateBar(top20Artists)
                }
            })

        let weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        let dayLabels = svg.append("g").attr("id","dayLabels");

        weekDays.forEach(function (day, i){
            dayLabels.append("text")
                .attr("class", "day-label")
                .attr("x", xOffset - (cellSize * 2))
                .attr("y", function (day){return yOffset + (i * (cellSize + cellMargin))})
                .attr("dy", "0.93em")
                .text(day)
        })

        function monthPath(pair) {
          let   t0 = pair[0],
                t1 = pair[1],
                d0 = t0.getDay(),
                w0 = d3.timeWeek.count(minDate, t0),
                d1 = t1.getDay(),
                w1 = d3.timeWeek.count(minDate, t1),
                fullCell = cellSize + cellMargin;

            return "M " + (w0 + 1) * fullCell + ", " + d0 * fullCell
                + " H " + w0 * fullCell + " V " + 7 * fullCell
                + " H " + w1 * fullCell + " V " + d1  * fullCell
                + " H " + (w1 + 1) * fullCell + " V " + 0
                + " H " + (w0 + 1) * fullCell + " Z ";
        }


        const m1 = [minDate, ...d3.timeMonths(minDate, maxDate)]
        const m2 = [...d3.timeMonths(minDate, maxDate), maxDate]
        const months = m1.map(function (entry, i){
            return [entry, m2[i]]
        })



        svg.append("g")
            .attr("id", "month-outline")
            .selectAll(".month")
            .data(months)
            .enter()
            .append("path")
            .attr("class", "month")
            .attr("transform", `translate(${xOffset}, ${yOffset})`)
            .attr("d", monthPath)


        let BB = new Array();
        let mp = document.getElementById("month-outline").childNodes;
        for (let i=0; i<mp.length; i++){
            BB.push(mp[i].getBBox());
        }

        let monthX = new Array();
        BB.forEach(function(d, i){
            let boxCentre = d.width/2;
            monthX.push(d.x + boxCentre + xOffset);
        })

        let monthLabels = svg.append("g").attr("id","month-label")
        const allMonths = [minDate, ...d3.timeMonths(minDate, maxDate)]
        allMonths.forEach(function(m,i)    {
            monthLabels.append("text")
                .attr("class","month-label")
                .attr("x",monthX[i])
                .attr("y",yOffset/1.2)
                .text(d3.timeFormat("%b")(m));
        })
    })


    return(
        <div id="calendar-heatmap">
            <svg ref={calendarHeatmap}></svg>
        </div>
    )

}

export default CalendarHeatmap;
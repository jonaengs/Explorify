import React, {useEffect, useRef, useState} from "react";
import * as d3 from "d3";
import {comparator, groupBy, msToTime} from "../helpers";
import { updateBar } from "../D3BarChart";

const D3CalendarHeatmap = () => {
    const data = require("../data/StreamingHistoryD.json");
    const calendarHeatmap = useRef()
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

    const weeksInMonth = function(month){
        let m = d3.timeMonth.floor(month)
        return d3.timeWeeks(d3.timeWeek.floor(m), d3.timeMonth.offset(m,1)).length;
    }

    const minDate = new Date(streamingData[0].date)
    const maxDate = new Date(streamingData[streamingData.length - 1].date)

    useEffect(() => {
        let weeksInMonth = function(month){
            let m = d3.timeMonth.floor(month)
            return d3.timeWeeks(d3.timeWeek.floor(m), d3.timeMonth.offset(m,1)).length;
        }


        const cellMargin = 1,
            cellSize = 20;

        let day = d3.timeFormat("%w"),
            week = d3.timeFormat("%U"),
            format = d3.timeFormat("%Y-%m-%d"),
            titleFormat = d3.utcFormat("%a, %d-%b"),
            monthName = d3.timeFormat("%B"),
            months= d3.timeMonth.range(d3.timeMonth.floor(minDate), maxDate);

        let svg = d3.select(calendarHeatmap.current).selectAll("svg")
            .data(months)
            .enter().append("svg")
            .attr("class", "month")
            .attr("height", ((cellSize * 7) + (cellMargin * 8) + 20) ) // the 20 is for the month labels
            .attr("width", function(d) {
                let columns = weeksInMonth(d);
                return ((cellSize * columns) + (cellMargin * (columns + 1)));
            })
            .append("g")

        svg.append("text")
            .attr("class", "month-name")
            .attr("y", (cellSize * 7) + (cellMargin * 8) + 15 )
            .attr("x", function(d) {
                var columns = weeksInMonth(d);
                return (((cellSize * columns) + (cellMargin * (columns + 1))) / 2);
            })
            .attr("text-anchor", "middle")
            .text(function(d) { return monthName(d); })

        let div = d3.select("body").append("div").attr("class", "toolTip");

        let rect = svg.selectAll("rect.day")
            .data(function(d, i) { return d3.timeDays(d, new Date(d.getFullYear(), d.getMonth()+1, 1)); })
            .enter().append("rect")
            .attr("class", "day")
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("rx", 3).attr("ry", 3) // rounded corners
            .attr("fill", '#eaeaea') // default light grey fill
            .attr("y", function(d) { return (day(d) * cellSize) + (day(d) * cellMargin) + cellMargin; })
            .attr("x", function(d) { return ((week(d) - week(new Date(d.getFullYear(),d.getMonth(),1))) * cellSize) + ((week(d) - week(new Date(d.getFullYear(),d.getMonth(),1))) * cellMargin) + cellMargin ; })


        const lookup = new Map(streamingData.map(function (entry){
                return [entry.date, [entry.msPlayed, entry.artists]]
            })
        );

        rect
            .on("mouseover", function(event, d) {
                let msTime = 0
                if (lookup.has(d))
                    msTime = lookup.get(d)[0]
                d3.select(this).classed('hover', true);
                div.style("left", event.pageX+10+"px");
                div.style("top", event.pageY-25+"px");
                div.style("display", "inline-block");
                div.html((d)+"<br>"+(msToTime(msTime)));
            })
            .on("mouseout", function(event, d) {
                d3.select(this).classed('hover', false);
                div.style("display", "none");
            })
            .on("click", function(event, d) {
                if(!d3.select(this).classed("selected")){
                    d3.selectAll(".day").classed("selected", false)
                    d3.select(this).classed('hover', true);
                    d3.select(this).classed("selected", true);
                    if (lookup.has(d))
                        updateBar(lookup.get(d)[1])
                } else {
                    d3.select(this).classed('hover', false);
                    d3.select(this).classed("selected", false)
                    updateBar(top20Artists)
                }
            })
            .datum(format);

        // rect.append("title")
        //     .text(function(d) { return titleFormat(new Date(d)); });

        let scale = d3.scaleSequentialSqrt()
            .domain(d3.extent(streamingData, function(d) { return parseInt(d.msPlayed); }))
            .range([0.05, 1]);

        rect.style("fill", function(d) {
                let color = function(d) {
                    if (lookup.get(d))
                        return scale(lookup.get(d)[0]);
                    else
                        return scale(0)
                }
                return d3.interpolateBlues(color(d));
            })

    })


    return(
        <div id="calendar-heatmap" ref={calendarHeatmap}>
        </div>
    )

}

export default D3CalendarHeatmap;
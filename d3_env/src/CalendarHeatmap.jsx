import React, {useEffect, useRef, useState} from "react";
import * as d3 from "d3";
import {comparator, groupBy, msToTime} from "./helpers";
import { updateBar, updateEmpty } from "./D3BarChart";
import { updateTimeline, hideTimeline } from "./D3Timeline";

const cellSize = 30;
const cellMargin = 1;
const xOffset= 60;
const yOffset= 60;
const parseDate = d3.timeFormat("%Y-%m-%d");
const format = d3.timeFormat("%d-%m-%Y");
const toolDate = d3.timeFormat("%d %b %Y");

const extractYMD = function (s){
    s = s.split("-")
    return [parseInt(s[0]), parseInt(s[1]), parseInt(s[2])]
}

const weeksInMonth = function(month){
    let m = d3.timeMonth.floor(month)
    return d3.timeWeeks(d3.timeWeek.floor(m), d3.timeMonth.offset(m,1)).length;
}

const CalendarHeatmap = ({streamingData, topArtistsData, timelineData, setEdgemapArtists}) => {
    const calendarHeatmap = useRef();

    const [selected, setSelected] = useState(null);
    if (selected) {
        const d = selected;
        if (d.full_day_duration != 0) {
            updateBar(d.artists);
            updateTimeline(d.date, timelineData[d.date]);
        }
        else {
            updateEmpty();
            hideTimeline();
        }
    } else {
        updateBar(topArtistsData);
    }



    const MIN_MAX = d3.extent(streamingData.keys())
    const minDate = new Date(extractYMD(MIN_MAX[0]))
    const maxDate = new Date(extractYMD(MIN_MAX[1]))

    const dateRange = d3.timeDays(minDate, maxDate)

    useEffect(() => {

        let scale = d3.scaleSequentialSqrt()
            .domain(d3.extent(streamingData.values(), function(d) {
                return parseInt(d.full_day_duration); }))
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
            .data(streamingData.values())
            .enter()
            .append("rect")
            .attr("id", function (d){
                return d.date;
            })
            .attr("class", d => "day test" + (d === selected && " selected hover"))
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("x", function (d){
                return xOffset + (d3.timeWeek.count(minDate, new Date(extractYMD(d.date))) * (cellSize + cellMargin));
            })
            .attr("y", function (d){
                return yOffset + (new Date(extractYMD(d.date)).getDay() * (cellSize + cellMargin))
            })
            .attr("fill", function (d){
                return d3.interpolateBlues(scale(d.full_day_duration))
            })

        let div = d3.select("body").append("div").attr("class", "toolTip");

        rect
            .on("mouseover", function(event, d) {
            let date = toolDate(new Date(extractYMD(d.date)))
            d3.select(this).classed('hover', true);
            div.style("left", event.pageX+10+"px");
            div.style("top", event.pageY-25+"px");
            div.style("display", "inline-block");
            div.html(`On ${date} listened <br> for ${(msToTime(d.full_day_duration))}`);
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
                    if (d.full_day_duration != 0) {
                        updateBar(d.artists);
                        setEdgemapArtists(d.artists.map(a => a.id));
                        updateTimeline(d.date, timelineData[d.date]);
                    }
                    else {
                        updateEmpty();
                        hideTimeline();
                        setEdgemapArtists([]);
                    }
                    setSelected(d);
                } else {
                    d3.select(this).classed('hover', false);
                    d3.select(this).classed("selected", false)
                    updateBar(topArtistsData);
                    hideTimeline();
                    setEdgemapArtists(null);
                    setSelected(null);
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
    }, [])


    return(
        <div id="calendar-heatmap">
            <svg ref={calendarHeatmap}></svg>
        </div>
    )

}

export default CalendarHeatmap;
import React, {useRef, useState} from "react";
import CalendarHeatmap from "./calendar-heatmap/index";
import ReactTooltip from "react-tooltip";
import './calendar-heatmap/styles.css';
import * as d3 from 'd3';
import { groupBy, msToTime, comparator} from "./helpers"
import {updateBar} from "./D3BarChart";

const ReactCalendarHeatmap = () => {
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
            prev.count = prev.count + cur.msPlayed;
            prev.artists[cur.artistName] = (prev.artists[cur.artistName] || 0) + cur.msPlayed;
            return prev;
        }, {"count": 0, "artists": {}});
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

    const startDate = streamingData[1].date;
    const endDate = streamingData[streamingData.length - 1].date;


    const allDates = d3.timeDays(new Date(startDate), new Date(endDate)).map(function (d){
        return d.toISOString().split("T")[0]
    })

    let lookup = new Map(streamingData.map(function (entry){
            return [entry.date, entry]
        })
    );

    allDates.forEach(function (entry){
        if (!lookup.has(entry)){
            lookup.set(entry, {"count": 0, "artists": [], "date": entry})
        }
    })

    streamingData = Array.from(lookup.values());

    const minMax = d3.extent(streamingData, function(d) { return d.count})
    const binSize = Math.floor((minMax[1] - minMax[0]) / 7)
    streamingData = streamingData.map(function (entry){
        entry.color = Math.floor(entry.count / binSize) + 1
        if (entry.count == 0)
            entry.color = 0
        return entry;
    })

    return(
        <>
            <CalendarHeatmap
                values={streamingData}
                classForValue={(value) => {
                    if (!value || value.count == 0) {
                        return "color-empty";
                    }
                    return `color-scale-${value.color}`;
                }}
                onClick={(value) => {
                    if (value.count > 0)
                        updateBar(value.artists)
                }}
                startDate={startDate}
                endDate={endDate}
                showWeekdayLabels={true}
                tooltipDataAttrs={value => {
                    return {
                        'data-tip': `Listened for ${msToTime(value.count)} on ${value.date}`,
                    };
                }}
            />
            <ReactTooltip></ReactTooltip>
        </>


    )

}
export default ReactCalendarHeatmap;
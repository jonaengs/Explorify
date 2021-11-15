import React from "react";
import CalendarHeatmap from "./calendar-heatmap/index";
import ReactTooltip from "react-tooltip";
import 'react-calendar-heatmap/dist/styles.css';
import * as d3 from 'd3';

function groupBy(rawData, key) {
    return rawData.reduce(function(previousVal, currentVal) {
        (previousVal[currentVal[key]] = previousVal[currentVal[key]] || []).push(currentVal);
        return previousVal;
    }, {});
};

function msToTime(duration) {
    let milliseconds = Math.floor((duration % 1000) / 100),
        seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
}

const PlainCalendarHeatmap = () => {
    const data = require("./data/StreamingHistoryJ.json");
    const rawData = data.map(function (elem) {
        let entry = {}
        entry.date = elem.endTime.split(" ")[0];
        entry.msPlayed = elem.msPlayed;
        return entry;
    });


    let filteredData = Object.values(groupBy(rawData, "date"));

    let streamingData = filteredData.map(function (day) {
        let date = day[0]["date"];
        day = day.reduce(function (prev, cur) {
            prev["totalTracks"] = prev["totalTracks"] + 1;
            prev["count"] = prev["count"] + cur["msPlayed"];
            return prev;
        }, {"totalTracks": 0, "count": 0});
        day.date = date;
        return day;
    });
    const startDate = streamingData[1].date;
    const endDate = streamingData[streamingData.length - 1].date;

    const minMax = d3.extent(streamingData, function(d) { return d.count})
    const binSize = Math.floor((minMax[1] - minMax[0]) / 7)
    streamingData = streamingData.map(function (entry){
        entry.color = Math.floor(entry.count / binSize) + 1
        entry.listeningHours = msToTime(entry.count)
        return entry;
    })

    return(
        <>
            <CalendarHeatmap
                values={streamingData}
                classForValue={(value) => {
                    if (!value) {
                        return "color-empty";
                    }
                    return `color-scale-${value.color}`;
                }}
                onClick={(value) => {
                    if (value) {
                        console.log(`Clicked on value with count: ${value.count}, ${value.color}`)
                    }
                }}
                startDate={startDate}
                endDate={endDate}
                showWeekdayLabels={true}
                tooltipDataAttrs={value => {
                    return {
                        'data-tip': `${value.date} has count: ${
                            value.count
                        }`,
                    };
                }}
            />
            <ReactTooltip></ReactTooltip>
        </>


    )

}
export default PlainCalendarHeatmap;
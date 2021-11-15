import CalendarHeatmap  from 'reactjs-calendar-heatmap';

function groupBy(rawData, key) {
    return rawData.reduce(function(previousVal, currentVal) {
        (previousVal[currentVal[key]] = previousVal[currentVal[key]] || []).push(currentVal);
        return previousVal;
    }, {});
};

const CalendarHeatmapBroken = ()  => {
    const red = "#8a0d0d";
    const overview = "year";
    const printFn = function (val) {
        // console.log(val);
    };

    const data = require("./data/StreamingHistoryJ.json");
    const rawData = data.map(function (elem) {
        let entry = {}
        entry.date = elem.endTime.split(" ")[0];
        entry.msPlayed = elem.msPlayed / 1000;
        return entry;
    });

    let filteredData = Object.values(groupBy(rawData, "date"));

    const streamingData = filteredData.map(function (day) {
        let date = day[0]["date"];
        day = day.reduce(function (prev, cur) {
            prev["totalTracks"] = prev["totalTracks"] + 1;
            prev["total"] = prev["total"] + cur["msPlayed"];
            return prev;
        }, {"totalTracks": 0, "total": 0, "details": [], "summary": [{"name": "test"}]});
        day.date = date;
        return day;
    });

    return (
        <CalendarHeatmap
            data={streamingData}
            color={red}
            overview={overview}
            handler={printFn}>
        </CalendarHeatmap>
    )
}

export default CalendarHeatmapBroken;
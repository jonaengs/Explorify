import * as d3 from "d3";
import * as utils from './utils.mjs';
import * as trackFeatures from '../../data/track_feature_data.json';
import * as streamingHistory from '../../data/merged_history.json';
import {margin, width, height} from './constants.mjs';


function groupby(arr, groupKey) {
    const keys = new Set(arr.map(i => i[groupKey]).filter(e => e !== null));
    const map = Object.fromEntries(Array.from(keys).map(k => [k, []]));
    for (const obj of arr) {
        if (obj[groupKey] !== null)
            map[obj[groupKey]].push(obj);
    }
    return map;
}

function groupbyMultiple(arr, groupKeys) {
    function getKeysVal(o) {
        return JSON.stringify(groupKeys.map(k => o[k]))
    }
    const keys = new Set(arr.map(getKeysVal));
    const map = Object.fromEntries(Array.from(keys).map(k => [k, []]));
    for (const obj of arr) {
        map[getKeysVal(obj)].push(obj);
    }
    return map;
}

function skippedScatterPlot() {
    const trackStreams = groupby(streamingHistory, "track_id");
    const skippedTracks = Object.entries(trackStreams).map(
        ([trackId, trackStreams]) => ({
            id: trackId,
            trackName: trackStreams[0].trackName,
            artistName: trackStreams[0].artistName,
            totalStreams: trackStreams.length,
            skippedStreams: trackStreams.filter(stream => stream.msPlayed < 10_000).length
        })
    ).filter(o => o.skippedStreams > 0);

    const svg = utils.getSvg("skippedScatter");
      
    // number of streams per track
    const x = d3.scaleLinear()
        .domain([0, d3.max(skippedTracks, d => d.totalStreams)])
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // number of skips per track
    const y = d3.scaleLinear()
        .domain([d3.max(skippedTracks, d => d.skippedStreams), 0])
        .range([0, height]);
    svg.append("g")
        .call(d3.axisLeft(y));

    const div = utils.createTooltip();

    svg.append('g')
        .selectAll("dots")
        .data(skippedTracks)
        .enter()
        .append("circle")
            .attr("cx", (data) => x(data.totalStreams))
            .attr("cy", (data) => y(data.skippedStreams))
            .attr("r", 10)
            .style("fill", "#a269b3")
            .style("opacity", 0.7)
        .on("mouseover", utils.onMouseover(div, d => `<b>${d.artistName}</b> <br> ${d.trackName}`))
        .on("mousemove", utils.onMousemove(div))
        .on("mouseout", utils.onMouseout(div));
}

function skippedScatterPlot2() {
    const trackStreams = groupby(streamingHistory, "track_id");
    const skippedTracks = Object.entries(trackStreams).map(
        ([trackId, trackStreams]) => ({
            id: trackId,
            trackName: trackStreams[0].trackName,
            artistName: trackStreams[0].artistName,
            totalStreams: trackStreams.length,
            skippedStreams: trackStreams.filter(stream => stream.msPlayed < 10_000).length
        })
    ).filter(o => o.skippedStreams > 0);

    const groupedByPosition = groupbyMultiple(skippedTracks, ["totalStreams", "skippedStreams"])

    const svg = utils.getSvg("skippedScatter2");
      
    // number of streams per track
    const x = d3.scaleLinear()
        .domain([0, d3.max(skippedTracks, d => d.totalStreams)])
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // number of skips per track
    const y = d3.scaleLinear()
        .domain([d3.max(skippedTracks, d => d.skippedStreams), 0])
        .range([0, height]);
    svg.append("g")
        .call(d3.axisLeft(y));

    const div = utils.createTooltip();

    svg.append('g')
        .selectAll("dots")
        .data(Object.values(groupedByPosition))
        .enter()
        .append("circle")
            .attr("cx", (data) => x(data[0].totalStreams))
            .attr("cy", (data) => y(data[0].skippedStreams))
            .attr("r", 10)
            .style("fill", "#10aacb")
            .style("opacity", 1)
        .on("mouseover", utils.onMouseover(div, tracks => tracks.map(t => `<b>${t.artistName}</b> - ${t.trackName}`).join("<br>")))
        .on("mousemove", utils.onMousemove(div))
        .on("mouseout", utils.onMouseout(div));
}

function scatterPlot(id, data) {
    const svg = utils.getSvg(id);
      
    const x = d3.scaleLinear()
        .domain([0, 1])
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    const y = d3.scaleLinear()
        .domain([1, 0])
        .range([0, height]);
    svg.append("g")
        .call(d3.axisLeft(y));

    svg.append('g')
        .selectAll("dots")
        .data(data)
        .enter()
        .append("circle")
            .attr("cx", (item) => x(item[0]))
            .attr("cy", (item) => y(item[1]))
            .attr("r", 3)
            .style("fill", "#69b3a2")
            .style("opacity", 0.6)   
}

skippedScatterPlot();
skippedScatterPlot2();
scatterPlot("a", Object.values(trackFeatures).map(e => [e[0].danceability, e[0].energy]));
scatterPlot("b", Object.values(trackFeatures).map(e => [e[0].danceability, e[0].acousticness]));
scatterPlot("c", Object.values(trackFeatures).map(e => [e[0].energy, e[0].acousticness]));
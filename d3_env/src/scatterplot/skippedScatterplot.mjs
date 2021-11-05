import * as d3 from "d3";
import * as utils from '../utils.mjs';
import {margin, width, height} from '../constants.mjs';

export function skippedScatterPlot(streamingHistory) {
    const trackStreams = utils.groupby(streamingHistory, "track_id");
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

export function skippedScatterPlot2(streamingHistory) {
    const trackStreams = utils.groupby(streamingHistory, "track_id");
    const skippedTracks = Object.entries(trackStreams).map(
        ([trackId, trackStreams]) => ({
            id: trackId,
            trackName: trackStreams[0].trackName,
            artistName: trackStreams[0].artistName,
            totalStreams: trackStreams.length,
            skippedStreams: trackStreams.filter(stream => stream.msPlayed < 10_000).length
        })
    ).filter(o => o.skippedStreams > 0);

    const groupedByPosition = utils.groupbyMultiple(skippedTracks, ["totalStreams", "skippedStreams"])

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
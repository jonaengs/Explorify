import * as drResults from '../../data/dr_results.json'
import * as d3 from "d3";
import * as utils from './utils';
import {margin, width, height, maxDistance} from './constants.mjs';
import {DefaultMap} from './map_extensions';
import './map_extensions.ts';
import {streamingHistory, genre, artistName, StreamInstance, artistData, streamingHistoryNoSkipped, artistID, artistMap} from './data'
import { getStreamTimes } from './derived_data';
import React, { Ref, useEffect, useRef } from 'react';

/**
 * A feature vector reduced to 2 dimensions. Must be mapped to fit within chart.
 */
type DRCoordinate = [number, number];
type Node = {
    id: string,
    name: string,
    r: number,
    firstStream: Date,
    timelinePos: number,
    similarityPos: {x: number, y: number}
    
    // shorthand for similarity view equivalents
    x: number,
    y: number,
};
type Link = {
    source: Node["id"],
    target: Node["id"],
    count: number,
    proportion: number
}
type Network = {
    nodes: Node[], 
    links: Link[]
};

type d3Node = Node & d3.SimulationNodeDatum;
type d3Link = Link & {
    index: number,
    source: d3Node,
    target: d3Node
}

const sessions = getSessions();
const sessionArtists = sessions.map(sesh => sesh.map(stream => stream.artistID));
const sessionOccurrences = new Map(
    artistData.map(artist => 
        [artist.id, sessionArtists.reduce((count, as) => count + as.includes(artist.id), 0)]
    )
);
const firstStream = streamingHistoryNoSkipped.reduce(
    (acc, stream) => acc.update(stream.artistID, t => t || stream.endTime),
    new Map()
);

const artistStreamTimes: Map<artistName, number> = getStreamTimes();

/*
 * Important decisions:
 *      Value of maxPause: how long a pause in a session can be.
 *      Use streamingHistory vs streamingHistoryNoSkipped
 */
function getSessions(): StreamInstance[][] {
    function inSession(stream: StreamInstance, session: StreamInstance[]): boolean {
        const lastStreamTime = session[session.length - 1].endTime.getTime();
        const sessionEndTime = lastStreamTime + stream.msPlayed + maxPause
        return  stream.endTime.getTime() <= sessionEndTime;
    }

    const streams = streamingHistoryNoSkipped.slice().sort((s1, s2) => s2.endTime.getTime() - s1.endTime.getTime());
    const maxPause = 2 * 60_000; // 60_000ms is one minute
    const sessions = [];
    let currentSesh = [streams.pop()];
    
    // Consider using streamingHistoryNoSkip instead
    for (const stream of streams.reverse()) {
        if (inSession(stream, currentSesh))
            currentSesh.push(stream);
        else {
            sessions.push(currentSesh);
            currentSesh = [stream];
        }
    }
    sessions.push(currentSesh);
    return sessions
}

/**
 * Returns a map from artist id to another map.
 * The inner map is a mapping from all artists which the original artist
 * has occurred in a session with to the number of sessions in which they occurred together. 
 * 
 * Note: Edges are kinda directed. Always in pairs, but values may not be equal
 */
function computeSessionLinks(): Link[] {  
    const coPlays = new DefaultMap<artistID, artistID[]>([]);
    for (const artists of sessionArtists) {
        const artistSet = new Set(artists);
        artistSet.forEach(a1 => 
            artistSet.forEach(a2 => {
                    if (a1 !== a2)
                        coPlays.update(a1, s => s.concat(a2))
                })
        );
    }

    const coPlayCounts: [artistID, Map<artistID, number>][] = Array.from(coPlays).map(
        ([a1, as]) => [a1, utils.count(as)]
    );

    const links = coPlayCounts.flatMap(([a1, neighbors]) => 
        Array.from(neighbors).map(([a2, count]) => ({
            source: a1,
            target: a2,
            count: count,
            proportion: count / sessionOccurrences.get(a1)
        }))
    )

    return links;
}

function toPolar(x: number, y: number): [number, number] {
    const [cx, cy] = [x - width/2, y - height/2];  // center coordinates
    const distance = Math.sqrt(cx*cx + cy*cy);
    const distNormalized = distance / maxDistance;
    const radians = Math.atan2(cy, cx);
    const degrees = (radians * (180 / Math.PI)) % 360;
    return [distNormalized, degrees];
}

/**
 * 
 * @param param0 x and y coordinates of a point, normalized to fit inside svg coordinates 
 */
function getHSL({x, y}) {
    const [dist, deg] = toPolar(x, y);
    return d3.hsl(deg, dist, 0.6, 1)
}


const completeNetwork: Network = createNetwork();

function createNetwork(): Network {
    const data: Map<artistID, DRCoordinate> = new Map(drResults.map(
        res => [res.artist_id, res.tsne_genre_no_outliers as DRCoordinate]
    ));
    const values = Array.from(data.values()).filter(v => v !== null);
    const xAxis = d3.scaleLinear().domain(d3.extent(values.map(([x,]) => x))).range([0, width]);
    const yAxis = d3.scaleLinear().domain(d3.extent(values.map(([, y]) => y)).reverse()).range([0, height]);
    const timelineAxis = d3.scaleTime().domain(d3.extent(firstStream.values())).range([0, width])
    const nodeSizes = d3.scaleSqrt().domain(d3.extent(getStreamTimes().values())).range([5, 20])

    const nodes = Array.from(data)
        .map(([aid, pos]) => pos && ({
            id: aid,
            name: artistMap.get(aid),
            r: nodeSizes(getStreamTimes().get(aid)),
            similarityPos: {x: xAxis(pos[0]), y: yAxis(pos[1])},
            firstStream: firstStream.get(aid),
            timelinePos: timelineAxis(firstStream.get(aid)),

            x: xAxis(pos[0]),
            y: yAxis(pos[1]),
        }))
        .filter(v => v !== null);

    const links = computeSessionLinks().filter(
        l => data.get(l.source) !== null && data.get(l.target) !== null
    ); 

    return {
        nodes: nodes,
        links: links
    }
}

/*
 * Important decisions:
 *      which DR result to use
 * TODO: 
 *      Link thickness by session co-occurrences
 *      Link color by proportion of co-occurrences
 *      Link color is gradient interpolated from source and target colors
 *          See: https://stackoverflow.com/questions/20706603/d3-path-gradient-stroke
 */
const top150 = Array.from(getStreamTimes().keys()).slice(0, 150);
export function renderEdgemap(ref: Ref<undefined>, artists: artistID[]) {    
    const artistSet = new Set(artists);
    const nodes = completeNetwork.nodes.filter(n => artistSet.has(n.id));
    const links = completeNetwork.links.filter(l => artistSet.has(l.source) && artistSet.has(l.target));

    const simulation = d3.forceSimulation(nodes) // @ts-ignore
        .force("link", d3.forceLink(links).id(d => d.id).strength(0))
        .force("collide", d3.forceCollide(n => n.r +2))
        // .force("charge", d3.forceManyBody().strength(-10).distanceMax(n => n.r + 5))
        .on("tick", ticked);

    const svg = utils.createSVG(ref);
    const background = svg.append("rect").attr("width", width).attr("height", height).style("opacity", 0);

    // @ts-ignore
    // const getLinkColor = (color) => d3.scaleLinear().range([{...color, opacity: 0.2}, color])
    // const getLinkColor = (color) => d3.scaleLinear().range([color, d3.hsl(color.h, color.s, 0.1)])
    const getLinkColor = (color) => d3.scaleLinear().range([color, "black"])
    const link = svg
        .selectAll("path")
        .data(links as d3Link[])
        .join("path")
        .style("fill", "none")
        .style("opacity", 0.9)
        .style("stroke", link => getLinkColor(getHSL(link.target))(link.proportion))
        .style("stroke-width", link => Math.log2(link.count) + 1)
        .style("visibility", "hidden")
        ;

    const node = svg
        .selectAll("node")
        .data(nodes as d3Node[])
        .enter()
        .append("g")
    node
        .append("circle")
            .attr("id", n => n.name.replace(" ", "_"))
            .attr("r", n => n.r)  // @ts-ignore
            .style("fill", getHSL)
        .on("mouseover", (_e, node) => console.log(artistMap.get(node.id)))
        .on("click", (_event: PointerEvent, n) => {
            link.style("visibility", l => l.source.id === n.id ? "visible" : "hidden")
            const neighbors = new Set(links.filter((l: d3Link) => l.source.id === n.id).map(l => l.target.id));
            neighbors.add(n.id);
            // @ts-ignore
            node
                .selectChildren("circle") 
                .style("fill", n => neighbors.has(n.id) ? getHSL(n) : d3.hsl(0.5, 0.5, 0.2, 0.2));
            node
                .selectChildren("text") 
                .style("visibility", // @ts-ignore
                n => neighbors.has(n.id) ? 
                    "visible" : "hidden"
            );
            // event.stopPropagation(); // stop event from triggering background click event
        }
        );
    node.append("text")
        .text((d: Node) => d.name)
        .attr("class", "unselectable")
        .attr("visibility", "hidden");

    background.on("click", () => {
        link.style("visibility", "hidden");
        node.selectChildren("text").style("visibility", "hidden");
        node.selectChildren("circle").style("fill", getHSL);
    });
    
    
    function ticked() {
        // link
        //     .attr("x1", (d: d3Link) => d.source.x)
        //     .attr("y1", (d: d3Link) => d.source.y)
        //     .attr("x2", (d: d3Link) => d.target.x)
        //     .attr("y2", (d: d3Link) => d.target.y);
        link
            .attr("d", d => {
                const [dx, dy] = [d.target.x - d.source.x, d.target.y - d.source.y];
                const dr = Math.sqrt(dx*dx + dy*dy);
                const curveRight = (d.target.x < d.source.x) + 0;
                return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,${curveRight} ${d.target.x},${d.target.y}`
            });
            node
                .attr("transform", (d: d3Node) => 
                    `translate(${utils.clampX(d.x)}, ${utils.clampY(d.y)})`
                )
    }
}

export function Edgemap(
    {artists = top150, type = "similarity"}: {artists: artistID[], type: "similarity" | "timeline"}) {    
    const ref = useRef();
    // TODO: return cleanup function?
    useEffect(() => renderEdgemap(ref.current, artists), [artists]);
    return <svg ref={ref}></svg>
}

/*
    TODO:
    1. force away from vertical center, so timeline is cleared
    2. Change how edges are calculated by adding a third invisible intermediate node between neighbors and going through those.
        Maybe scale the y position of this node with the distance between the neighbors. 
        Example: https://bl.ocks.org/mbostock/4600693
*/
function timeline(artists: artistID[] = top150) {
    const artistSet = new Set(artists);
    const nodes = completeNetwork.nodes.filter(n => artistSet.has(n.id)).map(n => ({...n, x: n.timelinePos, y: height/2}));
    const links = completeNetwork.links.filter(l => artistSet.has(l.source) && artistSet.has(l.target));

    const repositioning = d3.scaleTime().domain(d3.extent(nodes.map(n => n.firstStream))).range([0, width]);
    nodes.forEach(n => n.x = repositioning(n.firstStream));

    const svg = utils.getSvg("pcaNetwork");
    const background = svg.append("rect").attr("width", width).attr("height", height).style("opacity", 0);

    const simulation = d3.forceSimulation(nodes) // @ts-ignore
        .force("link", d3.forceLink(links).id(d => d.id).strength(0))
        .force("collide", d3.forceCollide(n => n.r + 1))
        .force("anchor", d3.forceX(n => n.x).strength(5))
        .on("tick", ticked);

    // @ts-ignore
    const linkColor = d3.scaleLinear().range(["grey", "black"]);
    const link = svg
        .selectAll("path")
        .data(links as d3Link[])
        .join("path")
        .style("fill", "none")
        .style("opacity", 0.7)
        .style("stroke", link => linkColor(link.proportion))
        .style("stroke-width", link => Math.log2(link.count) + 1)
        .style("visibility", "hidden")
        ;

    const node = svg
        .selectAll("node")
        .data(nodes as d3Node[])
        .enter()
        .append("circle")
            .attr("id", n => n.name.replace(" ", "_"))
            .attr("r", n => n.r) // @ts-ignore
            .style("fill", n => getHSL(n.similarityPos))
        .on("mouseover", (_e, node) => console.log(artistMap.get(node.id)))
        .on("click", (_event: PointerEvent, n) => {
            link.style("visibility", l => l.source.id === n.id ? "visible" : "hidden")
            const neighbors = new Set(links.filter((l: d3Link) => l.source.id === n.id).map(l => l.target.id));
            neighbors.add(n.id);
            node.style("fill", n => neighbors.has(n.id) ? getHSL(n.similarityPos) : d3.hsl(0.5, 0.5, 0.2, 0.2));
        });

    background.on("click", () => {
        link.style("visibility", "hidden");
        node.style("fill", n => getHSL(n.similarityPos));
    });
    svg.append("g")
        .attr("transform", `translate(0, ${height/2})`)
        .call(d3.axisBottom(repositioning));
    
    function ticked() {
        link
            .attr("d", d => {
                const [dx, dy] = [d.target.x - d.source.x, d.target.y - d.source.y];
                const dr = Math.sqrt(dx*dx + dy*dy);
                const curveRight = (d.target.x < d.source.x) + 0;
                return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,${curveRight} ${d.target.x},${d.target.y}`
            });
        node
            .attr("cx", d => utils.clampX(d.x))
            .attr("cy", d => d.y)
    }
}
import * as d3 from "d3";
import * as utils from './utils';
import * as artistData from '../../data/artist_data.json'
import * as trackFeatures from '../../data/track_feature_data.json';
import * as streamingHistory from '../../data/merged_history.json';
import {margin, width, height} from './constants.mjs';
import './map_extensions.ts';
import {DefaultMap} from './map_extensions.ts';
import {genre, artistName} from './data'

type Node = {
    id: string,
    name: string
};
type Link = {
    source: Node["id"],
    target: Node["id"],
    label?: string,
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

function drag(simulation: d3.Simulation<d3Node, d3Link>) {    
    type event = d3.D3DragEvent<SVGElement, Node, d3Node>;
    function dragstarted(event: event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event: event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event: event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    
    const drag = d3.drag<SVGElement, d3Node>()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);

    return drag
}

// return top genres by artists. Consider doing it by tracks/time. Alternative try to cover the most artists (np hard?)
function topGenres(n: number) {
    const genreCounts = artistData.flatMap(a => a.genres).reduce((counts, genre) => 
        counts.update(genre, x => (x || 0) + 1),
        new Map()
    );
    return Array.from(genreCounts)
            .sort(([_g1, c1], [_g2, c2]) => c2 - c1)
            .slice(0, n)
            .map(([g, _c]) => g);
}

function genreStreamTime(genres: genre[]) {
    const times = new Map<genre, number>(genres.map(g => [g, 0]));
    streamingHistory.forEach(sh => {
        sh.artist_genres.forEach(g => {
            // Alternative: Filter genres.
            // Current solution will cause not included genres to detract from time as well.
            if (genres.includes(g)) 
                times.update(g, x => (x + sh.msPlayed) / sh.artist_genres.length);
                // times.update(g, x => x + (1 / sh.artist_genres.length));
        })
    })
    return times;
}

function getNeighbors({nodes, links}: Network) {
    return links.reduce((acc, {source, target}) => 
        source !== target ? 
            acc.update(source, ns => ns.add(target)).update(target, ns => ns.add(source))
            : acc,
        new Map(nodes.map(n => [n.id, new Set()]))
    )
}


export function artistNetwork() {
    let streamTimes: Map<artistName, number> = streamingHistory.reduce((acc, entry) => 
        acc.update(entry.artistName, (t: number) => t + entry.msPlayed),
        new DefaultMap(0)
    );
    streamTimes = new Map(
        Array.from(streamTimes).sort(([_a1, t1], [_a2, t2]) => t2 - t1).slice(100, 150)
    );
    const artists: artistName[] = Array.from(streamTimes.keys());

    const reverseIndex: Map<genre, artistName[]> = artistData.filter(a => artists.includes(a.name)).reduce(
        (acc, artist) => artist.genres.reduce(
           (acc, genre) => acc.update(genre, arr => arr.concat(artist.name)),
           acc
        ),
        new DefaultMap([])
    )

    const network: Network = {
        nodes: artists.map(a => ({id: a, name: a})),
        links: Array.from(reverseIndex).flatMap(([g, artists]) => 
            artists.flatMap((a1, i) => artists.slice(i).map(a2 => ({
                    source: a1,
                    target: a2,
                    label: g
                })
            )))
    };

    const degrees = new Map(Array.from(getNeighbors(network)).map(([n, ns]) => [n, ns.size]));
    const degreeExtent = d3.extent(degrees.values());  // @ts-ignore: Range accepting iterables of color names is apparently not supported by the typing.
    const colorScale = d3.scaleLinear().domain(degreeExtent).range(["green", "cyan"]);
    const colorMap: Map<artistName, number> = new Map(
        Array.from(degrees).map(([n, d]) => [n, colorScale(d)])
    );

    simpleNetwork(network, {
        name: "artistNetwork",
        nodeColorMap: colorMap,
        nodeSizeMap: streamTimes,
        getLinkLabel: ({label}) => label
    });
}

export function genreNetwork() {
    // If slow, make genre map for quicker lookups
    const genres = topGenres(150).slice(100, 150);
    const artists = artistData.filter(a => a.genres.some(g => genres.includes(g)));
    artists.forEach(a => { // Remove genres that won't be in the network
        a.genres = a.genres.filter(g => genres.includes(g))
    });

    // scale genre nodes by time spent streaming. Linear scale
    const genreTimes = genreStreamTime(genres);

    const connectedGenres = new Map(genres.map(g => [g, []]));
    genres.forEach(g => {
        connectedGenres.set(g, Array.from(new Set(
            artists.filter(a => a.genres.includes(g))
                .flatMap(a => a.genres)
            ))
        )
    })

    const network = {
        nodes: genres.map(
            g => ({id: g, name: g})
        ),
        links: Array.from(connectedGenres)
            .flatMap(
                ([g1, gs]) => 
                gs.map(g2 => ({source: g1, target: g2}))
            )
    }

    function getArtists({source, target}: d3Link) {
        return artists
            .filter(a => a.genres.includes(source.id) && a.genres.includes(target.id))
            .map(a => a.name)
            .join("<br>");
    }

    simpleNetwork(network, {
        name: "genreNetwork",
        nodeSizeMap: genreTimes,
        getLinkLabel: getArtists
    });
}

function simpleNetwork({nodes, links}: Network, {
    name,
    nodeSizeMap,
    getLinkLabel,

    nodeColorMap = new DefaultMap('rgb(120, 200, 180)'),
    nodeOpacity = 1,
    nodeSizeRange = [5, 15],
    linkWidth = 1,
    linkColor = "#aaa"
}: {
    name: string, 
    nodeSizeMap: Map<string, number>, 
    getLinkLabel: (l: d3Link) => string, 
    
    // default values below
    nodeColorMap: Map<string, string>,
    nodeOpacity: number,
    nodeSizeRange: [number, number],
    linkWidth: number,
    linkColor: string,
}) {

    const timesExtent = d3.extent(nodeSizeMap.values());  // @ts-ignore
    const nodeSizes = d3.scaleLinear().domain(timesExtent).range(nodeSizeRange);

    const svg = utils.getSvg(name);

    const simulation = d3.forceSimulation(nodes as d3Node[])  // @ts-ignore
        .force("link", d3.forceLink(links).id(d => d.id))  // This mutates links from Link[] into a d3Link[]
        .force("charge", d3.forceManyBody().strength(d => -200).distanceMax(200))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .on("tick", ticked);

    const link = svg
        .selectAll("line")
        .data(links as d3Link[])
        .join("line")
        .style("stroke", linkColor)
        .style("stroke-width", linkWidth);

    const node = svg
        .selectAll("node")
        .data(nodes as d3Node[])
        .enter().append("g")
    node.append("circle")
        .attr("r", (n: Node) => nodeSizes(nodeSizeMap.get(n.id)))
        .style("opacity", nodeOpacity)
        .style("fill", (n: Node) => nodeColorMap.get(n.id));
    node.append("text")
        .text((d: Node) => d.name)
        .attr("class", "unselectable")
        .attr("visibility", "hidden");

    node.call(drag(simulation));

    function ticked() {
        link
            .attr("x1", (d: d3Link) => d.source.x)
            .attr("y1", (d: d3Link) => d.source.y)
            .attr("x2", (d: d3Link) => d.target.x)
            .attr("y2", (d: d3Link) => d.target.y);
        node
            .attr("transform", (d: d3Node) => `translate(${utils.clamp(d.x, 0, width)}, ${utils.clamp(d.y, 0, height)})`)
            // .attr("vx", d => ((d.x < 0 && d.vx < 0) || (d.x > width && d.vx > 0)) ? -d.vx :  d.vx)
            // .attr("vy", d => ((d.y < 0 && d.vy < 0) || (d.y > height && d.vy > 0)) ? -d.vy :  d.vy)
            ;
    }

    function highlightNodeSelection(selection: d3.Selection<SVGGElement, Node, SVGGElement, unknown>) {
        selection
            .selectChildren("circle")
            .style("fill", "#d2a0b1");
        selection
            .selectChildren("text")
            .style("visibility", "visible");
    }

    /** Highlights the given edge, as well as all nodes incident to the edge */
    function highlightIncidents({source, target}: d3Link) {
        const incidents = node.filter(n => [source.id, target.id].includes(n.id));
        
        highlightNodeSelection(incidents);
        
        link
            .filter((l: d3Link) => l.source === source && l.target === target)
            .style("stroke", "#777")
            .style("stroke-width", linkWidth * 2);
    }

    function dropHighlight() {
        node
            .selectChildren("circle")
            .style("fill", (n: d3Node) => nodeColorMap.get(n.id));
        node
            .selectChildren("text")
            .style("visibility", "hidden");
        link
            .style("stroke", linkColor)
            .style("stroke-width", linkWidth);
    }

    type linkMouseEvent = d3.D3BrushEvent<d3Link>;
    function onLinkMouseover(event: linkMouseEvent, d: d3Link) {
        highlightIncidents(d);
        utils.onMouseover(div, getLinkLabel)(event, d);
    }

    function onLinkMouseout(event: linkMouseEvent, d: d3Link) {
        dropHighlight();
        utils.onMouseout(div)(event, d);
    }

    function onNodeMouseover(_event: any, d: d3Node) {
        highlightNodeSelection(node.filter(n => n === d));
        link.filter(l => [l.source.id, l.target.id].includes(d.id)).each(highlightIncidents);
        // utils.onMouseover(div, n => n.id)(event, d)
    }

    function onNodeMouseout(_event: any, d: d3Node) {
        link.filter(l => l.source === d).each(dropHighlight);
        // utils.onMouseout(div)(event, d)
    }

    function highlight(ids: string[]) {
        const idSet = new Set(ids);
        node
            .filter(n => idSet.has(n.id))
            .each(n => highlightIncidents)
    }

    const div = utils.createTooltip();
    node
        .selectChildren("circle")
        .on("mouseover", onNodeMouseover)
        .on("mousemove", utils.onMousemove(div))
        .on("mouseout", onNodeMouseout);
    link   
        .on("mouseover", onLinkMouseover)
        .on("mousemove", utils.onMousemove(div))
        .on("mouseout", onLinkMouseout);
}
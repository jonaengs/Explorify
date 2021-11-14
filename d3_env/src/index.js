import * as d3 from "d3";
import * as utils from './utils.mjs';
import * as artistData from '../../data/artist_data.json'
import * as trackFeatures from '../../data/track_feature_data.json';
import * as streamingHistory from '../../data/merged_history.json';
import {margin, width, height} from './constants.mjs';


Map.prototype.update = function(key, fn) {
    return this.set(key, fn(this.get(key)));
}


// return top genres by artists. Consider doing it by tracks/time. Alternative try to cover the most artists (np hard?)
function topGenres(n) {
    const genreCounts = artistData.flatMap(a => a.genres).reduce((counts, genre) => 
        counts.update(genre, x => (x || 0) + 1),
        new Map()
    );
    return Array.from(genreCounts)
            .sort(([_g1, c1], [_g2, c2]) => c2 - c1)
            .slice(0, n)
            .map(([g, _c]) => g);
}

function genreStreamTime(genres) {
    const times = new Map(genres.map(g => [g, 0]));
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

function getNeighbors({nodes, links}) {
    return links.reduce((acc, {source, target}) => 
        source !== target ? 
            acc.update(source, ns => ns.add(target)).update(target, ns => ns.add(source))
            : acc,
        new Map(nodes.map(n => [n.id, new Set()]))
    )
}


function artistNetwork() {
    let streamTimes = streamingHistory.reduce((acc, entry) => 
        acc.update(entry.artistName, t => (t || 0) + entry.msPlayed),
        new Map()
    );
    streamTimes = new Map(
        Array.from(streamTimes).sort(([_a1, t1], [_a2, t2]) => t2 - t1).slice(0, 60)
    );
    const artists = Array.from(streamTimes.keys());

    const reverseIndex = artistData.filter(a => artists.includes(a.name)).reduce(
        (acc, artist) => artist.genres.reduce(
           (acc, genre) => acc.update(genre, arr => (arr || []).concat(artist.name)),
           acc
        ),
        new Map()
    )

    const network = {
        nodes: artists.map(a => ({id: a, name: a})),
        links: Array.from(reverseIndex).flatMap(([g, artists]) => 
            artists.flatMap((a1, i) => artists.slice(i).map(a2 => ({
                    source: a1,
                    target: a2,
                    name: g
                })
            )))
    };

    const degrees = new Map(Array.from(getNeighbors(network)).map(([n, ns]) => [n, ns.size]));
    const degreeExtent = d3.extent(degrees.values());
    const colorScale = d3.scaleLinear().domain(degreeExtent).range(["green", "cyan"]);
    const colorMap = new Map(
        Array.from(degrees).map(([n, d]) => [n, colorScale(d)])
    );

    simpleNetwork(network, {
        nodeColorMap: colorMap,
        nodeSizeMap: streamTimes,
        getLinkLabel: ({name}) => name
    });
}

function genreNetwork() {
    // If slow, make genre map for quicker lookups
    const genres = topGenres(150).slice(0, 50);
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

    function getArtists({source, target}) {
        return artists
            .filter(a => [source.id, target.id].every(g => a.genres.includes(g)))
            .map(a => a.name)
            .join("<br>");
    }

    simpleNetwork(network, {
        nodeSizeMap: genreTimes,
        getLinkLabel: getArtists
    });
}

function simpleNetwork({nodes, links}, {
    nodeColorMap,
    nodeSizeMap,
    getLinkLabel,

    nodeOpacity = 1,
    nodeSizeRange = [5, 15],
    nodeHighlightColor = "#69b3a2",
    linkWidth = 1,
    linkColor = "#aaa"
}) {

    const timesExtent = d3.extent(nodeSizeMap.values());
    const nodeSizes = d3.scaleLinear().domain(timesExtent).range(nodeSizeRange);

    const svg = utils.getSvg();

    const link = svg
        .selectAll("line")
        .data(links)
        .join("line")
        .style("stroke", linkColor)
        .style("stroke-width", linkWidth);
    const node = svg
        .selectAll("node")
        .data(nodes)
        .enter().append("g")
    node.append("circle")
        .attr("r", n => nodeSizes(nodeSizeMap.get(n.id)))
        .style("opacity", nodeOpacity)
        .style("fill", n => nodeColorMap ? nodeColorMap.get(n.id) : nodeHighlightColor);
    node.append("text")
        .text(d => d.name)
        .attr("class", "unselectable")
        .attr("visibility", "hidden");

    const simulation = d3.forceSimulation(nodes)                 // Force algorithm is applied to nodes
        .force("link", d3.forceLink()                               // This force provides links between nodes
              .id(d => d.id)                                        // This provide  the id of a node
              .links(links)                                    // and this the list of links
        )
        .force("charge", d3.forceManyBody().strength(-200).distanceMax(200))        // This adds repulsion between nodes. Play with the -400 for the repulsion strength
        .force("center", d3.forceCenter(width / 2, height / 2))     // This force attracts nodes to the center of the svg area
        .on("tick", ticked);

    node.call(utils.drag(simulation));

    function ticked() {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
        node
            .attr("transform", d => `translate(${utils.clamp(d.x, 0, width)}, ${utils.clamp(d.y, 0, height)})`)
            // .attr("vx", d => ((d.x < 0 && d.vx < 0) || (d.x > width && d.vx > 0)) ? -d.vx :  d.vx)
            // .attr("vy", d => ((d.y < 0 && d.vy < 0) || (d.y > height && d.vy > 0)) ? -d.vy :  d.vy)
            ;
    }

    function highlightIncidents({source, target}) {
        const incidents = node.filter(n => [source.id, target.id].includes(n.id));
        incidents
            .selectChildren("circle")
            .style("fill", "#d2a0b1");

        incidents
            .selectChildren("text")
            .style("visibility", "visible");
        link
            .filter(l => l.source == source && l.target == target)
            .style("stroke", "#777")
            .style("stroke-width", linkWidth * 2);
    }

    function dropHighlight(_link) {
        node
            .selectChildren("circle")
            .style("fill", n => nodeColorMap ? nodeColorMap.get(n.id) : nodeHighlightColor)
        node
            .selectChildren("text")
            .style("visibility", "hidden");
        link
            .style("stroke", linkColor)
            .style("stroke-width", linkWidth);
    }

    function onLinkMouseover(event, d) {
        highlightIncidents(d);
        utils.onMouseover(div, getLinkLabel)(event, d);
    }

    function onLinkMouseout(event, d) {
        dropHighlight(d);
        utils.onMouseout(div)(event, d);
    }

    function onNodeMouseover(_event, node) {
        // NOTE: This currently relies on nodes linking to themselves
        highlightIncidents({source: node, target: node})
        link.filter(l => [l.source, l.target].includes(node)).each(highlightIncidents);
        // utils.onMouseover(div, n => n.id)(event, node)
    }

    function onNodeMouseout(event, node) {
        link.filter(l => l.source === node).each(dropHighlight);
        // utils.onMouseout(div)(event, node)
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


artistNetwork();
// genreNetwork();

/*
skippedScatterPlot(streamingHistory);
skippedScatterPlot2(streamingHistory);
scatterPlot("a", Object.values(trackFeatures).map(e => [e[0].danceability, e[0].energy]));
scatterPlot("b", Object.values(trackFeatures).map(e => [e[0].danceability, e[0].acousticness]));
scatterPlot("c", Object.values(trackFeatures).map(e => [e[0].energy, e[0].acousticness]));
*/
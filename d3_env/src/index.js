import * as d3 from "d3";
import * as utils from './utils.mjs';
import * as artistData from '../../data/artist_data.json'
import * as trackFeatures from '../../data/track_feature_data.json';
import * as streamingHistory from '../../data/merged_history.json';
import {margin, width, height} from './constants.mjs';


Map.prototype.update = function(key, fn) {
    return this.set(key, fn(this.get(key)));
}

// return top genres by artists. Consider doing it by tracks / how to cover most artists (last is maybe np hard?)
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
        })
    })
    return times;
}

function createArtistNetwork() {
    // If slow, make genre map for quicker lookups
    const genres = topGenres(100).slice(60, 100);
    const artists = artistData.filter(a => a.genres.some(g => genres.includes(g)));
    artists.forEach(a => { // Remove genres that won't be in the network
        a.genres = a.genres.filter(g => genres.includes(g))
    });

    // scale genre nodes by time spent streaming. Linear scale
    const genreTimes = genreStreamTime(genres);
    const [maxTime, minTime] = d3.extent(genreTimes, ([_g, t]) => t);
    const nodeSizes = d3.scaleSqrt().domain([minTime, maxTime]).range([5, 20]);
    console.log(maxTime, minTime);
    console.log(
        nodeSizes
    );

    const connectedGenres = new Map(genres.map(g => [g, []]));
    genres.forEach(g => {
        connectedGenres.set(g, Array.from(new Set(
            artists.filter(a => a.genres.includes(g))
                .flatMap(a => a.genres)
            ))
        )
    })

    const data = {
        nodes: genres.map(
            g => ({id: g, name: g})
        ),
        links: Array.from(connectedGenres)
            .flatMap(
                ([g1, gs]) => 
                gs.map(g2 => ({source: g1, target: g2}))
            )
    }

    const svg = utils.getSvg("artistNetwork");

    const link = svg
        .selectAll("line")
        .data(data.links)
        .join("line")
        .style("stroke", "#aaa");
    const node = svg
        .selectAll("circle")
        .data(data.nodes)
        .join("circle")
        .attr("r", n => nodeSizes(genreTimes.get(n.id)))
        .style("fill", "#69b3a2")
        .style("opacity", 0.8);

    const simulation = d3.forceSimulation(data.nodes)                 // Force algorithm is applied to data.nodes
        .force("link", d3.forceLink()                               // This force provides links between nodes
              .id(d => d.id)                                        // This provide  the id of a node
              .links(data.links)                                    // and this the list of links
        )
        .force("charge", d3.forceManyBody().strength(-400).distanceMax(100))         // This adds repulsion between nodes. Play with the -400 for the repulsion strength
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
            .attr("cx", d => utils.clamp(d.x, 0, width))
            .attr("cy", d => utils.clamp(d.y, 0, height));
    }


    function getArtists({source, target}) {
        return artists
            .filter(a => [source.id, target.id].every(g => a.genres.includes(g)))
            .map(a => a.name)
            .join("<br>");
    }

    function highlightIncidents({source, target}) {
        node
            .filter(n => [source.id, target.id].includes(n.id))
            .style("opacity", 1);
    }

    function dropHighlight({source, target}) {
        node.style("opacity", 0.8);
    }

    function onLinkMouseover(event, d) {
        highlightIncidents(d);
        utils.onMouseover(div, getArtists)(event, d);
    }

    function onLinkMouseout(event, d) {
        dropHighlight(d);
        utils.onMouseout(div)(event, d);
    }

    const div = utils.createTooltip();
    node   
        .on("mouseover", utils.onMouseover(div, n => n.id))
        .on("mousemove", utils.onMousemove(div))
        .on("mouseout", utils.onMouseout(div));
    link   
        .on("mouseover", onLinkMouseover)
        .on("mousemove", utils.onMousemove(div))
        .on("mouseout", onLinkMouseout);
}


createArtistNetwork();
/*
skippedScatterPlot(streamingHistory);
skippedScatterPlot2(streamingHistory);
scatterPlot("a", Object.values(trackFeatures).map(e => [e[0].danceability, e[0].energy]));
scatterPlot("b", Object.values(trackFeatures).map(e => [e[0].danceability, e[0].acousticness]));
scatterPlot("c", Object.values(trackFeatures).map(e => [e[0].energy, e[0].acousticness]));
*/
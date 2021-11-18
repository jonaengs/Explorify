import * as pcaResults from '../../data/pca_results.json'
import * as d3 from "d3";
import * as utils from './utils';
import {margin, width, height} from './constants.mjs';
import './map_extensions.ts';
import {DefaultMap} from './map_extensions';
import {streamingHistory, genre, artistName, StreamInstance, artistData, streamingHistoryNoSkipped} from './data'
import { maxDistance } from './constants.mjs';


const sessions = getSessions();
const sessionArtists = sessions.map(sesh => sesh.map(stream => stream.artistID));
const sessionOccurrences = new Map(
    artistData.map(artist => 
        [artist.id, sessionArtists.reduce((count, as) => count + as.includes(artist.id), 0)]
    )
);

/**
 * Important decisions:
 * Value of maxPause: how long a pause in a session can be.
 * Use streamingHistory vs streamingHistoryNoSkipped
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

function computeSessionLinks() {    
    const coPlays = new DefaultMap([]);
    for (const artists of sessionArtists) {
        artists.forEach((a1, i) => 
            artists.slice(i+1)
                .filter(a2 => a1 !== a2)
                .forEach(a2 => coPlays.update(a1, s => s.concat(a2)))
        );
    }

    const coPlayCounts = new Map(
        Array.from(coPlays).map(([a1, as]) =>
            [a1, utils.count(as)]
        )
    )

    return coPlayCounts;
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
 * Link thickness by session co-occurrences
 * Link color by proportion of co-occurrences
 */
export function pcaNetwork() {
    const data = pcaResults.map(d => d.by_mean_feature)
    const xAxis = d3.scaleLinear().domain(d3.extent(data.map(([x,]) => x))).range([0, width]);
    const yAxis = d3.scaleLinear().domain(d3.extent(data.map(([, y]) => y)).reverse()).range([0, height]);

    console.log(computeSessionLinks());
    console.log(sessionOccurrences);
    console.log(d3.hsl("blue"));

    const svg = utils.getSvg("pcaNetwork");
    const nodes = data.slice(0, 100)
        .map(([x, y], i) => ({
            id: pcaResults[i].artist_id,
            x: xAxis(x),
            y: yAxis(y)
        }));
    
    const node = svg
        .selectAll("node")
        .data(nodes)
        .enter()
        .append("circle")
            .attr("r", 7)
            .style("fill", node => {
                const [dist, deg] = toPolar(node.x, node.y);
                console.log(dist, deg)
                return d3.hsl(deg, dist, 0.5, 1)
            });


    const simulation = d3.forceSimulation(nodes)
        .force("collide", d3.forceCollide(14))
        .force("charge", d3.forceManyBody().strength(-10).distanceMax(20))
        .on("tick", (ticked));

    simulation.tick(0)
    
    function ticked() {
        node
            .attr("cx", d => utils.clampX(d.x, 5))
            .attr("cy", d => utils.clampY(d.y, 5))
    }
}
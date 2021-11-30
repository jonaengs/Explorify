import { artistID, streamingHistoryNoSkipped } from "./data";
import "./map_extensions.ts"
import { DefaultMap } from "./map_extensions";
import * as d3 from "d3";

export const timeExtent: [Date, Date] = d3.extent(streamingHistoryNoSkipped.map(si => si.endTime));
export const artistStreamTimes: Map<artistID, number> = computeStreamTimes();

function computeStreamTimes() {
    const times: Map<artistID, number> = streamingHistoryNoSkipped.reduce((acc, stream) => 
        acc.update(stream.artistID, t => t + stream.msPlayed),
        new DefaultMap(0)
    );
    const sorted = Array.from(times).sort(([_a1, t1], [_a2, t2]) => t2 - t1)
    return new Map(sorted);
}
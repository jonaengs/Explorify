import { artistID, streamingHistoryNoSkipped } from "./data";
import "./map_extensions.ts"
import { DefaultMap } from "./map_extensions";



let artistStreamTimes = null;
/** 
 * Returns a map of artist to the number of milliseconds they were streamed
 * The map is ordered by streaming time in descending order
 */
export function getStreamTimes(): Map<artistID, number> {
    if (artistStreamTimes === null)
        artistStreamTimes = computeStreamTimes();

    return artistStreamTimes;
}
function computeStreamTimes() {
    const times: Map<artistID, number> = streamingHistoryNoSkipped.reduce((acc, stream) => 
        acc.update(stream.artistID, t => t + stream.msPlayed),
        new DefaultMap(0)
    );
    const sorted = Array.from(times).sort(([a1, t1], [a2, t2]) => t2 - t1)
    return new Map(sorted);
}
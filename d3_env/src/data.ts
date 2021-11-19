import * as _artistData from '../../data/artist_data.json'
import * as _trackFeatures from '../../data/track_feature_data.json';
import * as _streamingHistory from '../../data/merged_history.json';
import './map_extensions.ts'

export type genre = string;
export type artistName = string;
export type artistID = string;


export type ArtistData = {
    id: artistID,
    name: artistName,
    genres: genre[],
    type: "artist" | string, // always "artist" afaik
    
    followers: { total: number },
    popularity: number,
}

export type StreamInstance = {
    // artist info
    artistName: artistName,
    artistGenres: genre[],
    artistID: artistID,
    artistPopularity: number

    // stream info
    endTime: Date,
    msPlayed: number,

    // track info
    trackName: string,
    trackDurationMS: number,
    trackID: string
    trackPopularity: number
}

export type TrackFeature = {
    id: string,

    // Following should all be in [0, 1]
    acousticness: number,
    danceability: number,
    energy: number,
    speechiness: number,
    valence: number,
    liveness: number,
    
    key: number, // integer in [0, 11]?
    tempo: number, // not integer
    timeSignature: number, // integer
    
    loudness: number, // float in [-inf, 0] (?)
}

export const artistData: ArtistData[] = _artistData;

export const artistMap: Map<artistID, artistName> = new Map(
    artistData.map(d => [d.id, d.name])
);

export const streamingHistory: StreamInstance[] = _streamingHistory.map(
    sh => ({
        artistName: sh.artistName,
        artistGenres: sh.artist_genres,
        artistID: sh.artist_id,
        artistPopularity: sh.artist_popularity,

        endTime: new Date(sh.endTime),
        msPlayed: sh.msPlayed,
        
        trackName: sh.trackName,
        trackDurationMS: sh.track_duration_ms,
        trackID: sh.track_id,
        trackPopularity: sh.track_popularity
    })
);

export const streamingHistoryNoSkipped: StreamInstance[] = streamingHistory.filter(
    sh => sh.msPlayed >= 10_000
);

export const trackFeatures: Map<string, TrackFeature> = new Map(Object.entries(_trackFeatures).map(([tid, [tfs]]) => 
    [tid, {...tfs, timeSignature: tfs.time_signature}]
));
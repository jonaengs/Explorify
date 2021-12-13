import * as _artistData from '../../../data/artist_data.json'
import * as _trackFeatures from '../../../data/track_feature_data.json';
import * as _streamingHistory from '../../../data/merged_history.json';
import * as _DRResults from '../../../data/dr_results.json';
import './map_extensions.ts'


export type Genre = string;
export type ArtistName = string;
export type ArtistID = string;
export type TrackID = string;
export type DRCoordinate = [x: number, y: number];


export type ArtistData = {
    id: ArtistID,
    name: ArtistName,
    genres: Genre[],
    type: "artist" | string, // always "artist" afaik
    
    followers: { total: number },
    popularity: number,
}

export type StreamInstance = {
    // artist info
    artistName: ArtistName,
    artistGenres: Genre[],
    artistID: ArtistID,
    artistPopularity: number

    // stream info
    endTime: Date,
    msPlayed: number,

    // track info
    trackName: string,
    trackDurationMS: number,
    trackID: TrackID,
    trackPopularity: number
}

export type TrackFeature = {
    id: TrackID,

    // Following should all be in [0, 1]
    acousticness: number,
    danceability: number,
    energy: number,
    speechiness: number,
    valence: number,
    liveness: number,
    
    key: number, // integer in [0, 11]?
    tempo: number, // surprisingly, not an integer. Example: 120.31478123
    timeSignature: number, // integer
    
    loudness: number, // float in [-inf, 0] (?)
}

export type DRResult = {
    artistID: ArtistID,
    genrePCA: DRCoordinate;
    meanFeaturePCA: DRCoordinate;
    normFeaturePCA: DRCoordinate;
    featureTSNE: DRCoordinate;
    genreTSNE: DRCoordinate;
    genreTSNENoOutliers: DRCoordinate;
}

export const artistData: ArtistData[] = _artistData;

export const artistMap: Map<ArtistID, ArtistName> = new Map(
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

export const trackFeatures: Map<TrackID, TrackFeature> = new Map(
    Object.entries(_trackFeatures).map(([tid, tfs]) => 
        [tid, {...tfs, timeSignature: tfs.time_signature} as TrackFeature]
    )
);

export const DRResults: DRResult[] = _DRResults.map(res => ({
    artistID: res.artist_id,
    genrePCA: res.genre_pca as DRCoordinate,
    meanFeaturePCA: res.mean_feature_pca as DRCoordinate,
    normFeaturePCA: res.norm_feature_pca as DRCoordinate,
    featureTSNE: res.tsne_feature as DRCoordinate,
    genreTSNE: res.tsne_genre as DRCoordinate,
    genreTSNENoOutliers: res.tsne_genre_no_outliers as DRCoordinate,
}));
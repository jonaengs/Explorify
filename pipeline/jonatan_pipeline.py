import json
import pandas as pd
import numpy as np
import pprint

from sklearn.preprocessing import StandardScaler

from jonatan_settings import data_path, write_final_df, write_dr_results, audio_features
from jonatan_scrape import get_track_data, get_artist_data, get_audio_feature_data
from jonatan_dr import compute_dr_results


def read_streaming_history():
    with open(data_path + "StreamingHistory0.json", mode="r", encoding="utf-8") as f:
        data = json.loads(f.read())

    df = pd.DataFrame(data)
    df.endTime = pd.to_datetime(df.endTime)
    return df

def create_full_df(streamingHistory):
    track_data = get_track_data(streamingHistory)
    artist_data = get_artist_data(streamingHistory)
    track_features = get_audio_feature_data(track_data)

    # related_artists = pd.Series(scrape_related_artists(artist_data.artist_id), name="id")
    
    merged = pd.merge(streamingHistory, artist_data, left_on='artistName', right_on='artist_name', how='inner')
    print(f"\tlost {streamingHistory.shape[0] - merged.shape[0]} entries when merging with artist_data")
    print(streamingHistory[~streamingHistory.artistName.isin(merged.artistName)])
    
    merged = pd.merge(merged, track_data, left_on=["artistName", "trackName"], right_index=True, how="left")
    
    merged = pd.merge(merged, track_features, left_on="track_id", right_index=True, how="left")

    if write_final_df:
        keep_columns = list(streamingHistory.columns) \
            + ["artist_genres", "artist_id", "artist_popularity", "track_duration_ms", "track_id", "track_popularity"]
        write_df = merged[keep_columns]
        json_str = write_df.to_json(orient="records")
        with open(data_path + "merged_history.json", mode="w+", encoding="utf-8") as f:
            f.write(json_str)

    return merged

def get_dr_results(merged):
    for col in audio_features:
        merged[col] = merged[col].transform(float)
    merged[audio_features] = StandardScaler().fit_transform(merged[audio_features])  # Alternative: use MinMaxScaler to fit in specific range like [0, 1]

    artist_data = get_artist_data(merged)

    # drop entries where features are missing
    nan_entries = merged.danceability.isna()
    print(f"\tlost {nan_entries.sum()} entries when droppping entries missing features")
    print(merged[nan_entries])
    merged = merged[~nan_entries]

    dr_results = compute_dr_results(merged, artist_data)

    if write_dr_results:
        dr_results = dr_results.replace([np.nan], [None])
        json_str = dr_results.to_json(orient="records")
        with open(data_path + "dr_results.json", mode="w+", encoding="utf-8") as f:
            f.write(json_str)
    
    return dr_results

def main():
    print("Starting up pipeline...")
    print("Reading streaming history...")
    streamingHistory = read_streaming_history()
    print("Constructing complete dataset...")
    merged_df = create_full_df(streamingHistory)
    print("Performing dimensionality reduction...")
    dr_results = get_dr_results(merged_df)
    print("COMPLETE!")

if __name__ == '__main__':
    main()
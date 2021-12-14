import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import datetime as dt
import os
import json
from datetime import datetime, date, timedelta
from collections import OrderedDict

from inna_data_extraction import *
from inna_helpers import *


folder = "../data/Kaggle_data/"

# Create URL to JSON file (alternatively this can be a filepath)
json_file = folder + "StreamingHistory0.json"
# Load the first sheet of the JSON file into a data frame
df = pd.read_json(json_file, orient='columns')

# filter tracks by msPlayed
threshold = 10000  # 10 seconds
fully_listened = df.loc[df['msPlayed'] >= threshold] 
skipped = df.loc[df['msPlayed'] < threshold]


# Spotify API
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials

client_id = "b9dbb97e8d404c7ca611adc9aa7814c6"
client_secret = "49de3614d07a4ac5bab51f4c3e836c47"
credentials = SpotifyClientCredentials(client_id=client_id, client_secret=client_secret)
# token = credentials.get_access_token()
spotify = spotipy.Spotify(auth_manager=credentials)


# Collect data
track_data = get_track_data(fully_listened)
fully_listened["trackDetails"] = fully_listened.trackName.apply(lambda x: track_data[x])
fully_listened["trackId"] = fully_listened["trackDetails"].apply(get_track_id)
fully_listened["trackDuration"] = fully_listened["trackDetails"].apply(get_track_duration)
fully_listened["trackPopularity"] = fully_listened["trackDetails"].apply(get_track_popularity)
fully_listened["trackAlbum"] = fully_listened["trackDetails"].apply(extract_album_id)
fully_listened["trackArtistId"] = fully_listened["trackDetails"].apply(get_artist_id)
track_details = get_track_details(fully_listened)
fully_listened["trackFeatures"] = fully_listened["trackId"].apply(lambda x: track_details[x])

# Write out
fully_listened.to_pickle(folder + "listened_raw.pkl")

# clean-up None values
filtered = fully_listened.loc[fully_listened["trackId"].notna()]
filtered.drop("trackDetails", axis=1, inplace=True)

# Write out
filtered.to_pickle(folder + "listened_filtered_raw.pkl")


# Extract artist data
artist_details = get_artist_details(filtered)
artist_data = get_artist_data(filtered, artist_details)

# Write out
with open(folder + "artist_data.json", "w") as f:
    json.dump(artist_data, f, indent='\t', separators=(',', ': '))


# Extract and write out track data
track_features = get_track_features(filtered, artist_data)
with open(folder + "track_data.json", "w") as f:
    json.dump(track_features, f, indent='\t', separators=(',', ': '))


# Full dataset Extraction
filtered["date"] = filtered.endTime.apply(lambda x: x.split(" ")[0])
dataset = get_dataset(filtered)
full_dataset = get_full_dataset(dataset)

# Add dates to dataset
all_dates = get_all_dates(full_dataset)
for d in all_dates:
    if d.strftime("%Y-%m-%d") not in full_dataset:
        full_dataset[d.strftime("%Y-%m-%d")] = {
            "date": d.strftime("%Y-%m-%d"),
            "full_day_duration": 0,
            "artists": []}

# Write out
full_dataset = OrderedDict(sorted(full_dataset.items()))
with open(folder + "processed_filtered_dataset.json", "w") as f:
    json.dump(full_dataset, f, indent='\t', separators=(',', ': '))

sorted_all_artists = sorted(all_artists.values(), key=lambda x: x["artist_duration"], reverse=True)
for i, artist in enumerate(sorted_all_artists):
    artist["rank"] = i+1
    
with open(folder + "top_artists.json", "w") as f:
    json.dump(sorted_all_artists, f, indent='\t', separators=(',', ': '))



# Extract timeline data
def compute_start_ms(row):
    return row.endTimeMs - row.msPlayed

filtered["date"] = filtered.endTime.apply(lambda x: x.split(" ")[0])
filtered["endTimeMs"] = filtered.endTime.apply(
    lambda x: datetime.strptime(x, "%Y-%m-%d %H:%M").timestamp() * 1000)
filtered["startTimeMs"] = filtered.apply(compute_start_ms, axis=1)

timeline_data = get_timeline_data(filtered, artist_data)

# Write out
with open(folder + "timeline_data.json", "w") as f:
    json.dump(timeline_data, f, indent='\t', separators=(',', ': '))

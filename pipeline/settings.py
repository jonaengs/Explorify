import os


SPOTIFY_OAUTH_TOKEN = os.environ.get("SPOTIFY_API_TOKEN")

SPOTIFY_CLIENT_ID = os.environ.get("SPOTIFY_CLIENT_ID") or input("Spotify CLIENT ID: ")
SPOTIFY_CLIENT_SECRET = os.environ.get("SPOTIFY_CLIENT_SECRET") or input("Spotify CLIENT SECRET: ")


# Path to data folder, where files are read from and written to
# MUST contain StreamingHistory0.json. Other files are optional and created by this program.
data_path = "../data/"

# Audio features used in analysis
audio_features = [
    "danceability", "valence", "speechiness", 
    "acousticness", "instrumentalness", "liveness",
    "tempo", "energy", "loudness"
]

# Which data sets to (over)write to file
write_dr_results = True
write_final_df = True
write_retrieved_data = True

# Which types of data should be retrieved from Spotify's API
retrieve_missing_tracks = False
retrieve_missing_artists = False
retrieve_missing_related_artists = False
retrieve_missing_track_audio_features = False
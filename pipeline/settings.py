import os


# OAUTH token for the Spotify API
oauth_token = os.environ.get("SPOTIFY_API_TOKEN") or \
""" 
BQDS2y1EJsD9-Pveqp-QuDgx04o2GsF2xonkwI2-CZoAZ3YX_rENPV3ozTP-8NO19HmvGUR4DWOsK1ZQsEa9v0AiWkT2Jq1-2w5WK0Y_oGAWQc6_y3_cfyb2aP4GK8RKlPqcHoOgrnrYpWGuRFJM63zHZqv6Tu6mvEfTFiiJuwwYKXkpbOs-m0QETyOoFSEH351zACrtviynG4bIPGXl01FgQYp8EcZLZZzVyMjKYpHv6UI4rsxaidGmnLXLVnSbs0VtFzilpkOZw_NI608
""".strip()

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
retrieve_missing_tracks = True
retrieve_missing_artists = True
retrieve_missing_related_artists = True
retrieve_missing_track_audio_features = True
# Spotify API
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from requests.exceptions import ReadTimeout

client_id = "b9dbb97e8d404c7ca611adc9aa7814c6"
client_secret = "49de3614d07a4ac5bab51f4c3e836c47"
credentials = SpotifyClientCredentials(client_id=client_id, client_secret=client_secret)
# token = credentials.get_access_token()
spotify = spotipy.Spotify(auth_manager=credentials)


# Extract data functions

def extract_track_details(row):
    try:
        return spotify.search(q="track:" + row.trackName[:40] + " artist:" + row.artistName, limit=1, type="track")
    except ReadTimeout as e:
        print(row)
        return None
        

def extract_track_features(track_id):
    if track_id is not None:
        for i in range(1, 6):  # max 5 retries
            try:
                return spotify.audio_features(track_id)
            except:
                print("Couldn't fetch data for %s at try %d" % (track_id, i))
                pass
    return None

def extract_album_id(track_details):
    try:
        return track_details["tracks"]["items"][0]["album"]["id"]
    except IndexError as e:
        return None
    
def extract_track_album_data(album_id):
    try:
        return spotify.album(album_id)
    except IndexError as e:
        return None

def extract_track_genre_by_artist(artist_details):
    try:
        return artist_details["genres"]
    except IndexError as e:
        return None
    
def extract_artist_id(track_details):
    try:
        return track_details["tracks"]["items"][0]["album"]["artists"][0]["id"]
    except IndexError as e:
        return None
    
def extract_artist_data(artist_id):
    try:
        return spotify.artist(artist_id)
    except ReadTimeout as e:
        print(artist_id)
        return None

def extract_track_id(track_details):
    try:
        return track_details['tracks']['items'][0]['id']
    except:
        return None
    
def extract_track_duration(track_details):
    try:
        return track_details['tracks']['items'][0]['duration_ms']
    except:
        return None

def extract_track_popularity(track_details):
    try:
        return track_details['tracks']['items'][0]['popularity']
    except:
        return None
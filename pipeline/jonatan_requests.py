import json
import requests
import pprint 
import re

from settings import oauth_token

print("using OAUTH TOKEN:\n" + oauth_token + "\n")

headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": oauth_token if oauth_token.startswith("Bearer ") else "Bearer " + oauth_token 
}

def get_track_data_by_name(artist_name, track_name):
    def normalize_str(s):
        return re.sub("\'`´", "", s.lower())
    
    def search(params):
        resp = requests.get(endpoint, headers=headers, params=params)
        if resp.status_code != 200:
            raise ValueError(resp.text)
        data = json.loads(resp.text)
        tracks = data['tracks']['items']
        found_tracks.update(", ".join(a["name"] for a in track["artists"]) + " - " + track["name"]
                            for track in tracks)
        return next(track for track in tracks
                       if normalize_str(track['name']) == normalize_str(track_name)
                       and artist_name in [a["name"] for a in track["artists"]])
    
    found_tracks = set()
    endpoint = "https://api.spotify.com/v1/search"
    params = {"q": track_name + " " + artist_name, "type": "track", "limit": 20}
    try:
        try:
            return search(params)
        except StopIteration:
            return search(params | {"q": track_name})
    except json.JSONDecodeError as e:
        print(resp.text)
        raise e
    except KeyError as e:
        print("bad data:")
        pprint(data)
        raise e
    except StopIteration:        
        print(f"unable to find: {artist_name} - {track_name}")
        print("found:", found_tracks, end="\n\n")
    

def get_artist_data_by_name(artist_name):
    endpoint = "https://api.spotify.com/v1/search"
    params = {"q": artist_name, "type": "artist", "limit": 10}
    resp = requests.get(endpoint, headers=headers, params=params)
    data = json.loads(resp.text)
    artist_data = [artist for artist in data['artists']['items'] if artist['name'] == artist_name]
    ranked_by_popularity = sorted(artist_data, key=lambda a: a['followers']['total'], reverse=True)
    
    if artist_data:
        return ranked_by_popularity[0]
    
    print("unable to find", artist_name)

def get_related_artists(artist_id):
    endpoint = f"https://api.spotify.com/v1/artists/{artist_id}/related-artists"
    resp = requests.get(endpoint, headers=headers)
    
    if resp.status_code == 200:
        return json.loads(resp.text)['artists']
    
    print("Could not find related artists for:", artist_id)

def get_track_audio_features(track_id):
    endpoint = f"https://api.spotify.com/v1/audio-features/{track_id}"
    resp = requests.get(endpoint, headers=headers)
    
    if resp.status_code == 200:
        return json.loads(resp.text)
    
    print("Could not find audio feaures for:", track_id)
# Extract data functions

def get_track_details(row):
    try:
        return spotify.search(q="track:" + row.trackName[:40] + " artist:" + row.artistName, limit=1, type="track")
    except ReadTimeout as e:
        print(row)
        return None
        

def get_track_features(track_id):
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
    
def get_track_album_data(album_id):
    try:
        return spotify.album(album_id)
    except IndexError as e:
        return None

def get_track_genre_by_artist(artist_details):
    try:
        return artist_details["genres"]
    except IndexError as e:
        return None
    
def get_artist_id(track_details):
    try:
        return track_details["tracks"]["items"][0]["album"]["artists"][0]["id"]
    except IndexError as e:
        return None
    
def get_artist_data(artist_id):
    try:
        return spotify.artist(artist_id)
    except ReadTimeout as e:
        print(artist_id)
        return None

def get_track_id(track_details):
    try:
        return track_details['tracks']['items'][0]['id']
    except:
        return None
    
def get_track_duration(track_details):
    try:
        return track_details['tracks']['items'][0]['duration_ms']
    except:
        return None

def get_track_popularity(track_details):
    try:
        return track_details['tracks']['items'][0]['popularity']
    except:
        return None
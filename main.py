import json
from operator import itemgetter
from pprint import pprint
from requests import get, Request

DATA_LOCAL = True

url = "https://api.spotify.com/v1/me/player/recently-played?limit=50"
oauth_token = "Bearer BQBSQ-zeLkGsiKmMddvBtfN0VaWyxMXSQejJVN5Hqv2tX-qPSg05kzCrVVTV_yPmxG0ZuUvJXQJZ37efFSDQCOYhl01qKqXZEhoREi4nk2XKoy-zOLdF1Kq0snM8eevXquBOyCBo8CmJg-w65yvlPifRvnXImAsSzvLwNouoWx4HEQodyckFCGGc3THtmLG1YWEaIr9CIcVAnskHUDqbTwfjYVnv0CLMcww2Oz_dSk2FrB-v7VOxB7xKF0TRrWcBqLO5I7PokVZ-pz1lZcY"
headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": oauth_token
}

def scrape_recently_played():
    next_url = "https://api.spotify.com/v1/me/player/recently-played"
    with open("recently_played.json", mode="a+") as f:
        while (resp := get(url, headers=headers)).status_code == 200:
            f.write(resp.text)
            data = json.loads(resp.text)
            next_url = data["next"]
            print(next_url)
        

def get_data():
    if DATA_LOCAL:
        with open("data.json", mode="r") as f:
            data = json.loads(f.read())
    else:
        with open("data.json", mode="w+") as f:
            resp = get(url, headers=headers)
            f.write(resp.text)
            data = json.loads(resp.text)

    return data

def trim_recently_played(data):
    def trim(track):
        return {
            "album": "album" in track and {
                "name": track["album"].get("name"),
                "release_date": track["album"].get("release_date")
            },
            "artists": [
                {"name": a["name"], "id": a["id"]}
                for a in track.get("artists", [])
            ],
            "duration_ms": track.get("duration_ms"),
            "id": track.get("id"),
            "name": track["name"],
            "played_at": track.get("played_at"),
            "context": track.get("context")
        }

    return [
        trim(item["track"])
        for item in data["items"]
    ]


if __name__ == '__main__':
    # data = get_data()
    # pprint(trim_recently_played(data))
    scrape_recently_played()

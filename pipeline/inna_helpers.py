import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import datetime as dt
import os
import json
from datetime import datetime, date, timedelta

from inna_data_extraction import *
from inna_helpers import *

def get_track_data(fully_listened):
    unique = fully_listened.drop_duplicates(subset=['trackName'])
    track_data = {}
    for i, row in unique.iterrows():
        track_data[row.trackName] = get_track_details(row)
    
    return track_data


def get_track_details(fully_listened):
    unique_track_ids = fully_listened.trackId.unique()
    track_details = {}
    for track_id in unique_track_ids:
        track_details[track_id] = get_track_features(track_id)

    return track_details


def get_artist_details(filtered):
    uniques_artist_ids = filtered.trackArtistId.unique()
    artist_details = {}
    for artist in uniques_artist_ids:
        artist_details[artist] = get_artist_data(artist)

    return artist_details

def get_artist_data(filtered, artist_details):
    artist_data = {}
    for i, row in filtered.iterrows():
        artist_id = row["trackArtistId"]
        if artist_id not in artist_data:
            artist_data[artist_id] = {"name": artist_details[artist_id]["name"],
                                    "genres": artist_details[artist_id]["genres"],
                                    "popularity": artist_details[artist_id]["popularity"],
                                    "followers": artist_details[artist_id]["followers"]["total"]}
    return artist_data

def get_track_features(filtered, artist_data):
    # Extract only track features
    track_features = {}
    for i, row in filtered.iterrows():
        features = row["trackFeatures"]
        track_features[row["trackId"]] = {"name": row["trackName"], 
                                        "track_features": features[0],
    #                                    "album_genres": album_data[row["trackAlbum"]]["genres"],
                                        "artist_genres": artist_data[row["trackArtistId"]]["genres"]}

    return track_features

def get_dataset(filtered):
    dataset = {}
    for i, row in filtered.iterrows():
        data = dataset.get(row["date"], [])
        data.append({"date": row["date"],
                    "artist": row["artistName"],
                    "track_duration": row["trackDuration"],
                    "artist_id": row["trackArtistId"],
                    "played": row["msPlayed"],
        })
        dataset[row["date"]] = data

    return dataset

def get_full_dataset(dataset):
    full_dataset = {}
    empty_artist = [{"name": "", "popularity": 0, "id": "", "artist_duration": 0, "artist_genres": []}]
    all_artists = {}

    for date, data in dataset.items():
        temp = {}
        for log in data:
            temptemp = temp.get(log["artist"], {"duration": 0, "id":""})
            temptemp["duration"] += log["played"]
            temptemp["id"] = log["artist_id"]
            temp[log["artist"]] = temptemp
            
        total = sum(list([data["duration"] for artist, data in temp.items()]))
        artists = list([{"name": artist,
                        "popularity": artist_data[data["id"]]["popularity"],
                        "id": data["id"],
                        "artist_duration": data["duration"],
                        "artist_genres": artist_data[data["id"]]["genres"],
                        } for artist, data in temp.items()])
        artists = sorted(artists, key=lambda x: x["artist_duration"], reverse=True)
        
        for i, artist in enumerate(artists):
            artist["rank"] = i+1
        
        for artist in artists:
            if artist["name"] not in all_artists:
                all_artists[artist["name"]] = {
                    "name": artist["name"],
                    "popularity": artist["popularity"],
                    "id": artist["id"],
                    "artist_duration": artist["artist_duration"],
                    "artist_genres": artist["artist_genres"],
                    
                }
                continue
            prev = all_artists[artist["name"]]
            prev["artist_duration"] += artist["artist_duration"]
            all_artists[artist["name"]] = prev
        
        if (20 - len(artists) > 0):
            artists.extend(empty_artist * (20 - len(artists)))
        
        full_dataset[date] = {
            "date": date,
            "full_day_duration": total,
            "artists": artists,
        }

    return full_dataset

def get_all_dates(full_dataset):
    all_days = sorted(full_dataset.keys())

    start = all_days[0].split("-")
    end = all_days[-1].split("-")

    start = date(int(start[0]), int(start[1]), int(start[2]))
    end = date(int(end[0]), int(end[1]), int(end[2]))

    all_dates = pd.date_range(start, end - timedelta(days=1), freq='d')

    return all_dates


def get_timeline_data(filtered, artist_data):
    artist_name_id = {}    
    for k, v in artist_data.items():
        artist_name_id[v["name"]] = k

    timeline_data = {}
    for _, row in filtered.iterrows():
        data = timeline_data.get(row.date, [])
        try:
            if data and data[-1]["artist_id"] == artist_name_id[row.artistName]:
                if data[-1]["end"] > row.startTimeMs:
                    data[-1]["end"] = row.endTimeMs

                elif (row.startTimeMs - data[-1]["end"]) < 3000:
                    data[-1]["end"] = row.endTimeMs

                else:
                    data.append({
                        "artist_id": artist_name_id[row.artistName],
                        "artist_name": row.artistName,
                        "start": row.startTimeMs,
                        "end": row.endTimeMs,
                        "start_date": datetime.utcfromtimestamp(row.startTimeMs/1000).strftime('%Y-%m-%d %H:%M:%S'),
                        "end_date": datetime.utcfromtimestamp(row.endTimeMs/1000).strftime('%Y-%m-%d %H:%M:%S')
                    })
                    
            else:
                start = row.startTimeMs
                if data and data[-1]["end"] > row.startTimeMs:
                    start = data[-1]["end"] + 500 # half a second
    #             else:
    #                 print("date ", datetime.utcfromtimestamp(start/1000).strftime('%Y-%m-%d %H:%M:%S'))
                data.append({
                    "artist_id": artist_name_id[row.artistName],
                    "artist_name": row.artistName,
                    "start": start,
                    "end": row.endTimeMs,
                    "start_date": datetime.utcfromtimestamp(start/1000).strftime('%Y-%m-%d %H:%M:%S'),
                    "end_date": datetime.utcfromtimestamp(row.endTimeMs/1000).strftime('%Y-%m-%d %H:%M:%S')
                })
                    

            timeline_data[row.date] = data
        except KeyError:
            pass
    #         print("missing artist data: ", row.artistName)

    return timeline_data
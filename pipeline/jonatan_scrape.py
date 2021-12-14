import json
import pandas as pd
import numpy as np

from ast import literal_eval

from jonatan_settings import data_path, write_retrieved_data, retrieve_missing_tracks, retrieve_missing_artists, retrieve_missing_related_artists, retrieve_missing_track_audio_features
from jonatan_requests import get_track_data_by_name, get_artist_data_by_name, get_related_artists, get_track_audio_features


def get_artist_data(df):
    artist_data = pd.DataFrame(_scrape_artist_data(df))
    artist_data.columns = artist_data.columns.map(lambda s: "artist_" + s)
    return artist_data

def get_track_data(df):
    track_data = pd.DataFrame(_scrape_track_data(df)).transpose()
    track_data.columns = track_data.columns.map(lambda s: s if s.startswith("track_") else "track_" + s)
    return track_data

def get_audio_feature_data(merged_df):
    track_features = pd.DataFrame(_scrape_track_audio_features(merged_df.track_id)).transpose()
    return track_features

def _scrape_track_data(df):
    # Uniquely identify tracks by artist_name + track_name
    # Since these are stored as a tuple, and json doesn't support tuple keys, extra work has to be done when reading and writing.
    # Spotify has unique ids for all tracks, but our local data doesn't. TODO: Integrate track and artist id into streaming history
    try:
        with open(data_path + 'track_data.json', mode='r', encoding='utf-8') as f:
            data = json.load(f)
            data = {literal_eval(k): v for k, v in data.items()}
    except FileNotFoundError:
        data = {}
        
    known_tracks = pd.Series(data.keys())
    all_tracks = pd.Series(df[["artistName", "trackName"]].agg(tuple, axis=1).unique())
    unknown_tracks = all_tracks[~all_tracks.isin(known_tracks)]
    
    if retrieve_missing_tracks:
        try:
            for artist, track in unknown_tracks:
                result = get_track_data_by_name(artist, track)
                if result:
                    data[(artist, track)] = result
        finally:
            if write_retrieved_data:
                with open(data_path + 'track_data.json', mode='w+', encoding='utf-8') as f:
                    json.dump({str(k): v for k,v in data.items()}, f)
    return data

def _scrape_artist_data(df):
    try:
        with open(data_path + 'artist_data.json', mode='r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        data = []
        
    known_artists = pd.Series([artist['name'] for artist in data if artist is not None])
    all_artists = pd.Series(df.artistName.unique())
    unknown_artists = all_artists[~all_artists.isin(known_artists)]
    
    if retrieve_missing_artists:
        try:
            for artist in unknown_artists:
                result = get_artist_data_by_name(artist)
                if result:
                    data.append(result)
        finally:
            if write_retrieved_data:
                with open(data_path + 'artist_data.json', mode='w+', encoding='utf-8') as f:
                    json.dump(data, f)
    return data


def _scrape_related_artists(artist_ids):
    try:
        with open(data_path + 'related_artist_data.json', mode='r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        data = {}
    
    known_related = pd.Series(data.keys())
    missing_related = artist_ids[~artist_ids.isin(known_related)]
    
    if retrieve_missing_related_artists:
        try:
            for artist_id in missing_related:
                if (result := get_related_artists(artist_id)):
                    data[artist_id] = result
        finally:
            if write_retrieved_data:
                with open(data_path + 'related_artist_data.json', mode='w+', encoding='utf-8') as f:
                    json.dump(data, f)
    return data

def _scrape_track_audio_features(track_ids):
    try:
        with open(data_path + 'track_feature_data.json', mode='r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        data = {}

    known_features = set(data.keys())
    missing_features = set(tid for tid in set(track_ids) if not tid in known_features)
        
    if retrieve_missing_track_audio_features:
        try:
            for track_id in missing_features:
                if (result := get_track_audio_features(track_id)):
                    data[track_id] = result
        finally:
            if write_retrieved_data:
                with open(data_path + 'track_feature_data.json', mode='w+', encoding='utf-8') as f:
                    json.dump(data, f)

    return data

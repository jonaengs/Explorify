import numpy as np
import pandas as pd

from scipy.stats import norm
from scipy.spatial import distance
from sklearn.metrics import pairwise_distances
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from sklearn.cluster import DBSCAN
from math import isnan

from jonatan_settings import audio_features


###################################
# HELPER FUNCTIONS
###################################

def flatten_series(series):
    return series.apply(pd.Series).stack().reset_index(drop=True)

def get_artist_genre_vectors(artist_df):
    artist_genres = artist_df.artist_genres
    genres = pd.Series(flatten_series(artist_genres).unique())

    artist_genre_vectors = np.array([
        np.array(genres.apply(lambda g: g in artists_genres))
        for artists_genres in artist_genres
    ])

    return artist_genre_vectors

def get_artist_mean_feature_vector(merged):
    def compute_mean_artist_feature_vector(grouping):
        df = pd.DataFrame(grouping)
        return df[audio_features].aggregate(np.mean, axis=0, raw=True).to_numpy()

    mean_artist_features = merged.groupby("artist_id").apply(compute_mean_artist_feature_vector)
    artist_features_v = np.stack(mean_artist_features.values)
    return artist_features_v

def get_artist_norm_feature_vector(merged):
    def compute_norm_artist_feature_vector(grouping):
        def flatten(l):
            return [v for t in l for v in t]
        df = pd.DataFrame(grouping)
        return flatten([norm.fit(df[col]) for col in audio_features])

    norm_artist_features = merged.groupby("artist_id").apply(compute_norm_artist_feature_vector)
    norm_artist_features_v = np.stack(norm_artist_features.values)

    return norm_artist_features_v

# Using DBSCAN, finds all outliers and marks them np.na
def dbscan_outlier_marking(dr_result, eps=5):
    vectors = np.stack(dr_result.values)
    result = DBSCAN(eps=eps).fit(vectors)

    outliers_nad = np.array(vectors, copy=True)
    outliers_nad[result.labels_ == -1] = np.nan

    no_outliers_series = dr_result.copy()
    no_outliers_series.loc[:] = list(map(tuple, outliers_nad))
    # no_outliers_series = pd.Series(map(tuple, outliers_nad), index=dr_result)

    return no_outliers_series

###################################
# DR FUNCTIONS
###################################

# Performs pca on the given data and binds it to a copy of the given series
def perform_pca(vectors, base_series):
    pca = PCA(n_components=2)
    transformed = pca.fit_transform(vectors)

    # pca_result_series = pd.Series(np.nan, index=base_series)
    # pca_result_series.loc[:] = list(map(tuple, transformed))
    pca_result_series = pd.Series(map(tuple, transformed), index=base_series)

    return pca_result_series

# Performs tsne on the given data and binds it to a copy of the given series
def perform_tsne(vectors, base_series):
    tsne = TSNE(n_components=2, learning_rate=300, init="random")
    transformed = tsne.fit_transform(vectors)

    # tsne_result_series = pd.Series(0, index=base_series)
    # tsne_result_series.loc[:] = list(map(tuple, transformed))
    tsne_result_series = pd.Series(map(tuple, transformed), index=base_series)
    
    return tsne_result_series

# PCA genres by artists, using "one-hot" encoding
#   So given genre=rock and artists=["dr. dre", "the beatles", "acdc"], the vector for rock is [0, 1, 1]
def pca_genres_by_artists(artist_df):
    artist_genres = artist_df.artist_genres
    
    genres = flatten_series(artist_genres).unique()

    genre_artist_vectors = np.array([
        np.array(artist_genres.apply(lambda gs: genre in gs))
        for genre in genres
    ])

    print("vectors shape:", genre_artist_vectors.shape)

    return perform_pca(genre_artist_vectors, artist_df.artist_id)

# PCA artists by genre, using "one-hot" encoding
#   So given artist=acdc and genres=["hip hop", "pop", "rock"], the vector for rock is [0, 0, 1]
def pca_artists_by_genres(artist_df):
    return perform_pca(get_artist_genre_vectors(artist_df), artist_df.artist_id)

# PCA on artists by the mean feature vector of their tracks
def pca_artists_by_mean_features(merged):
    return perform_pca(get_artist_mean_feature_vector(merged), merged.artist_id.unique())

# PCA on artists by the norm distribution feature vector of their tracks
def pca_artists_by_norm_features(merged):
    return perform_pca(get_artist_norm_feature_vector(merged), merged.artist_id.unique())

# TSNE on artists by the mean feature vector of their tracks
def tsne_artists_by_mean_features(merged):
    return perform_tsne(get_artist_mean_feature_vector(merged), merged.artist_id.unique())

# TSNE on artists by their genres, using "one-hot" encoding
def tsne_artists_by_genres(artist_df):
    return perform_tsne(get_artist_genre_vectors(artist_df), artist_df.artist_id)

# TSNE on artists by their genres, using "one-hot" encoding
# Then uses DBSCAN to "discard" ( := NaN) outliers
def tsne_artists_by_genres_no_outliers(artist_df):
    return dbscan_outlier_marking(
        perform_tsne(get_artist_genre_vectors(artist_df), artist_df.artist_id)
    )


# Returns a dataframe indexed by artist ids, with columns as seen in the dict
def compute_dr_results(merged_df, artist_df):
    data = {
        "genre_pca": pca_artists_by_genres(artist_df),
        "mean_feature_pca": pca_artists_by_mean_features(merged_df),
        "norm_feature_pca": pca_artists_by_norm_features(merged_df),
        "tsne_feature": tsne_artists_by_mean_features(merged_df),
        "tsne_genre": tsne_artists_by_genres(artist_df),
        "tsne_genre_no_outliers": tsne_artists_by_genres_no_outliers(artist_df)
    }

    dr_df = pd.DataFrame(artist_df.artist_id)

    for col, series in data.items():
        dr_df = dr_df.merge(series.rename(col), how="left", left_on="artist_id", right_index=True)

    # NaNs somehow got placed in tuples. This replaces tuples containing NaN with NaN
    for col in dr_df.columns:
        is_nan_tuple = dr_df[col].apply(lambda t: type(t) == tuple and any(map(isnan, t)))
        dr_df[col][is_nan_tuple] = np.nan

    return dr_df
import json
import pandas as pd
from collections import Counter
from operator import itemgetter
from pprint import pprint

with open("StreamingHistory0.json", mode="r", encoding="utf-8") as f:
    data = json.loads(f.read())

data = [
    track
    for track in data
    if track["msPlayed"] > 30_000
]

counts = Counter(map(itemgetter("artistName"), data))
pprint(counts.most_common(10))

longest = sorted(data, key=itemgetter("msPlayed"), reverse=True)
pprint(list(map(itemgetter("artistName", "trackName", "msPlayed"),longest[:10])))

df = pd.DataFrame(data)
print(df.head(3))
print(df.shape)
print(df["artistName"].nunique())
print(df["trackName"].nunique())
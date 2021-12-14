# Explorify
CPSC 547 Project

# Setup
## (Optional) Retrieving your data
Requirements:  `Python >= 3.8`
1. Retrieve your personal spotify listening history by visiting your Spotify account privacy page and following the instructions at the bottom of the page. 
2. Upon receiving your data, extract the file called "StreamingHistory0.json" into the data folder in this directory.
3. Set one of the two following sets of environmental variables:
    * `SPOTIFY_API_TOKEN`. You can generate this by going to the console at developer.spotify.com and copying the generated OAuth token.
    * `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`. You get these by creating a new app in your dashboard at developer.spotify.com.
4. `pip install -r requirements.txt`
5. Run the pipeline 

## Running Explorify
Requirements: `npm >= 6`, a modern web-browser
1. In the d3_env folder, run `npm install && npm start` 
2. In your browser, navigate to: `localhost:1234`

# Manual
help
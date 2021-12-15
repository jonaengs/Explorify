# Explorify
CPSC 547 Project

# Project Structure
The project consists of two main directories:
1. `pipeline`: This directory contains all the code for processing the user's streaming history. Everything is written in python, using the pandas and numpy libraries to simplify and speed up the code. The spotipy library is used for authentication against Spotify and some of the data retrieval. All of the code in this directory is written by us, except code marked with comments explicitly stating otherwise*.

2. `d3_env/src`: This directory contains the code for the visualization part of Explorify. The code is a mix of Javascript and Typescript using React for rendering many of the components. D3 is used for creating the visualizations. React-Bootstrap is used for styling the HTML components. With the exception of the Calendar Heatmap, which is a modification of this heatmap calendar solution: https://bl.ocks.org/alansmithy/6fd2625d3ba2b6c9ad48, all of the code in this directory has been written by us (except code marked with comments explicitly stating otherwise*). 
    - `d3_env` itself contains additional files for the purpose of running Explorify. These can be disregarded, and/or assumed to not be our work. 

Some other files and directories of note:
* The directories `data` and `d3_env\src\data` contain the results of running the pipeline.  
* In addition there are a couple of notebook files at the top level. These were used to prototype and develop the code which became the final pipeline. 

\* There are very few such comments throughout the project.
# Setup
## (Optional) Retrieving your data
Requirements:  `Python >= 3.8`
1. Retrieve your personal spotify listening history by visiting your Spotify account privacy page and following the instructions at the bottom of the page. 
2. Upon receiving your data, extract the file called "StreamingHistory0.json" into the data folder in this directory.
3. Set one of the two following sets of environmental variables:
    * `SPOTIFY_API_TOKEN`. You can generate this by going to the console at developer.spotify.com and copying the generated OAuth token.
    * `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`. You get these by creating a new app in your dashboard at developer.spotify.com.
4. `pip install -r requirements.txt`
5. Run the pipeline by running `main.py` from inside the pipeline directory.

## Running Explorify
Requirements: `npm >= 6`, a modern web-browser
1. In the d3_env folder, run `npm install && npm start` 
2. In your browser, navigate to: `localhost:1234`

# Manual
help
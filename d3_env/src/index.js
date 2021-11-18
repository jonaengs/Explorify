import {artistNetwork, genreNetwork} from './networks'
import {featurePCAScatter} from './scatterplot'
import {pcaNetwork} from './pca_network'

pcaNetwork();
// featurePCAScatter();
// artistNetwork();
// genreNetwork();

/*
skippedScatterPlot(streamingHistory);
skippedScatterPlot2(streamingHistory);
scatterPlot("a", Object.values(trackFeatures).map(e => [e[0].danceability, e[0].energy]));
scatterPlot("b", Object.values(trackFeatures).map(e => [e[0].danceability, e[0].acousticness]));
scatterPlot("c", Object.values(trackFeatures).map(e => [e[0].energy, e[0].acousticness]));
*/
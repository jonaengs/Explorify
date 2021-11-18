import * as d3 from "d3";
import * as utils from './utils';
import * as pcaResults from '../../data/pca_results.json'
import {margin, width, height} from './constants.mjs';
import './map_extensions.ts';

export function featurePCAScatter() {
    scatterPlot("featurePCAScatter", pcaResults.map(d => d.by_mean_feature));
}

function scatterPlot(name: string, data: number[][], labels?: any[]) {
    const svg = utils.getSvg(name);
    
    const xAxis = d3.scaleLinear()
        .domain(d3.extent(data.map(([x, _y]) => x)))
        .range([0, width]);

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xAxis));

    const yAxis = d3.scaleLinear()
        .domain(d3.extent(data.map(([_x, y]) => y)).reverse())
        .range([0, height]);
    svg.append("g")
        .call(d3.axisLeft(yAxis));

    svg.append('g')
        .selectAll("dots")
        .data(data)
        .enter()
        .append("circle")
            .attr("cx", ([x, _y]) => xAxis(x))
            .attr("cy", ([_x, y]) => yAxis(y))
            .attr("r", 3)
            .style("fill", "#69b3a2")
            .style("opacity", 0.6)
}
import * as d3 from "d3";
import * as utils from '../utils.mjs';
import {margin, width, height} from '../constants.mjs';

export function scatterPlot(id, data) {
    const svg = utils.getSvg(id);
      
    const x = d3.scaleLinear()
        .domain([0, 1])
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    const y = d3.scaleLinear()
        .domain([1, 0])
        .range([0, height]);
    svg.append("g")
        .call(d3.axisLeft(y));

    svg.append('g')
        .selectAll("dots")
        .data(data)
        .enter()
        .append("circle")
            .attr("cx", (item) => x(item[0]))
            .attr("cy", (item) => y(item[1]))
            .attr("r", 3)
            .style("fill", "#69b3a2")
            .style("opacity", 0.6)   
}
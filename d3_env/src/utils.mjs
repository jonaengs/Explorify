import * as d3 from "d3";
import {margin, width, height} from './constants.mjs';

export function groupby(arr, groupKey) {
    const keys = new Set(arr.map(i => i[groupKey]).filter(e => e !== null));
    const map = Object.fromEntries(Array.from(keys).map(k => [k, []]));
    for (const obj of arr) {
        if (obj[groupKey] !== null)
            map[obj[groupKey]].push(obj);
    }
    return map;
}

export function groupbyMultiple(arr, groupKeys) {
    function getKeysVal(o) {
        return JSON.stringify(groupKeys.map(k => o[k]))
    }
    const keys = new Set(arr.map(getKeysVal));
    const map = Object.fromEntries(Array.from(keys).map(k => [k, []]));
    for (const obj of arr) {
        map[getKeysVal(obj)].push(obj);
    }
    return map;
}

export function getSvg(id) {
    const existing = d3.select("#" + id);
    if (!existing.empty()) 
        existing.remove();
   
    return d3.select("body")
        .append('svg')
        .attr("id", id)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
}

export function createTooltip() {
    return d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
}

export function onMouseover(div, textFunc=() => "...") {
    return (event, data) => {
        div.transition()
            .duration(100)
            .style("opacity", 1);
        div.html(textFunc(data))
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 28) + "px");
    }  
}
export function onMouseout(div) {
    return (_event, _data) => {
        div.transition()
            .duration(100)
            .style("opacity", 0);
    }       
}
    
export function onMousemove(div) {
    return (event, _data) => {
        div
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px");
    }
}

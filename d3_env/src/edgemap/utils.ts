import * as d3 from "d3";
import {margin, width, height} from './constants';
import { DefaultMap } from "../map_extensions";


export type TooltipDiv = d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
export type SVGSelection = d3.Selection<SVGGElement, unknown, HTMLElement, any>;

export function clamp(val: number, min: number, max: number) {
    return Math.max(min, Math.min(val, max));
}

export function clampX(val: number, margin=0) {
    const r = margin ? Math.floor(margin * Math.random()) : 0;
    return clamp(val + r, 0, width);
}

export function clampY(val: number, margin?: number) {
    const r = margin ? Math.floor(margin * Math.random()) : 0;
    return clamp(val + r, 0, height);
}

export function topGroups<T extends Object>(arr: T[], key: string, n: number, comp?: (a: T[], b: T[]) => number) {
    const defaultComp = (a: T[], b: T[]) => b.length - a.length;
    const groups = groupby(arr, key);
    const top = Object.values(groups).sort(comp || defaultComp).slice(0, n);
    return top
}

export function groupby<T extends Object>(arr: T[], groupKey: string) {
    const map = new DefaultMap([]);
    for (const obj of arr) {
        if (obj[groupKey] !== null)
            map.update(obj[groupKey], arr => arr.concat(obj))
    }
    return map;
}

export function count<T>(arr: T[]): Map<T, number> {
    return arr.reduce(
        (acc: Map<T, number>, e: T) => acc.update(e, x => x+1),
        new DefaultMap<T, number>(0)
    );
}

export function groupbyMultiple<T extends Object>(arr: T[], groupKeys: string[]) {
    function getKeysVal(o: T) {
        return JSON.stringify(groupKeys.map(k => o[k]))
    }
    const keys = new Set(arr.map(getKeysVal));
    const map = Object.fromEntries(Array.from(keys).map(k => [k, []]));
    for (const obj of arr) {
        map[getKeysVal(obj)].push(obj);
    }
    return map;
}

export function getSvg(id: string): SVGSelection {
    const existing = d3.select("#" + id);
    if (!existing.empty()) 
        existing.remove();
   
    return d3.select("body")
        .append('svg')
        .attr("id", id)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
}

export function createSVG(ref: SVGElement): SVGSelection {   

    return d3.select(ref)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

}

export function createTooltip() {
    return d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
}


export function onMouseover(div: TooltipDiv, textFunc = (_: any) => "...") {
    return (event: MouseEvent, data: any) => {
        div.transition()
            .duration(100)
            .style("opacity", 1);
        div.html(textFunc(data))
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 28) + "px");
    }  
}
export function onMouseout(div: TooltipDiv) {
    return (_event: MouseEvent, _data: any) => {
        div.transition()
            .duration(100)
            .style("opacity", 0);
    }       
}
    
export function onMousemove(div: TooltipDiv) {
    return (event: MouseEvent, _data: any) => {
        div
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px");
    }
}

/*
    BEGIN SET OPERATIONS
*/
export function bothDifference<T>(A: Set<T>, B: Set<T>): [Set<T>, Set<T>] {
    let [AdB, BdA] = [new Set(A), new Set<T>()];
    for (let b of B) {
        if (!AdB.delete(b)) BdA.add(b);
    }
    return [AdB, BdA];
}

export function anyOverlap<T>(A: Set<T>, B: Set<T>): boolean {
    for (let a of A) {
        if (B.has(a)) return true;
    }
    return false;
}

// From: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
export function union<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    let _union = new Set(setA)
    for (let elem of setB) {
        _union.add(elem)
    }
    return _union
}

// From: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
export function intersection<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    let _intersection = new Set<T>()
    for (let elem of setB) {
        if (setA.has(elem)) {
            _intersection.add(elem)
        }
    }
    return _intersection
}

/*
    END SET OPERATIONS
*/

export function debounce(f: (...args: any[]) => void, time=1000) {
    let timeout = null;
    function debounced(...args: any[]) {
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => f(...args), time);
    }
    return debounced;
}

export function d3Translate({x, y}: {x: number, y: number}) {
    return `translate(${x}, ${y})`;
}

export function divideWidth(n: number): number[] {
    const divs = []
    for (let i = 0; i < n + 2; i++) {
        divs.push(i * width / (n + 1));
    }
    return divs
}
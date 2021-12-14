import * as d3 from "d3";
import { EdgemapView, NodePositionKey } from "./edgemap_functions";

// SVG Canvas constants
export const margin = {top: 10, right: 40, bottom: 30, left: 100};
export const width = 1200 - margin.left - margin.right;
export const height = 900 - margin.top - margin.bottom;
export const maxDistance = Math.sqrt((width**2 + height**2)/4);

// Various edgemap constants
export const backgroundColor =  "#1f1b2e";
export const deselectHSL = d3.hsl(0.5, 0.4, 0.4, 0.4).toString();
export const transitionTime = 2500;
export const timeAxisDivisions = 4;

// Simulation constants
const targetSimulationIterations = 200;
export const alphaDecay = 1 - Math.pow(0.001, 1 / targetSimulationIterations);
export const alphaMin = 0.05;

// Other
export const autoPlayInterval = 2500;
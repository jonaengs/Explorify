 // need that to evaluate data stright away
 $.ajaxSetup({
   async: false
 });

/** Standard groupBy function
  * @param {Arr} rawData - the raw data from the json file
  * @param {str} key - the key by which to reduce 
  */
function groupBy(rawData, key) {
  return rawData.reduce(function(previousVal, curretnVal) {
    (previousVal[curretnVal[key]] = previousVal[curretnVal[key]] || []).push(curretnVal);
    return previousVal;
  }, {});
};

/** Function to process Spotify streaming history:
  * @param {str} fileName - the filename containing streaming history
  */
function processData(fileName){
	var streamingData = null;
	$.getJSON(fileName, function(data){
		data.forEach(function(entry, idx, data){
			data[idx]["date"] = data[idx].endTime.split(" ")[0];
			delete data[idx].artistName;
			delete data[idx].trackName;
			delete data[idx].endTime;
		});

		streamingData = Object.values(groupBy(data, "date"));

		streamingData = streamingData.map(function(day){
			var date = day[0]["date"];
			day = day.reduce(function(prev, cur){
				prev["totalTracks"] = prev["totalTracks"] + 1;
				prev["totalPlayed"] = prev["totalPlayed"] + cur["msPlayed"];
				return prev;
			}, {"totalTracks": 0, "totalPlayed": 0});
			day["date"] = new Date(date);
			return day;
		});
	});
	return streamingData;
}

var processedData = processData("./data/Desi_data/StreamingHistoryDesi.json");
console.log(processedData);

const years = d3.groups(processedData, d => d["date"].getUTCFullYear()).reverse();
console.log(years);

const cellSize = 15
const yearHeight = cellSize * 7 + 25
const formatDay = d => ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"][d.getUTCDay()]
const countDay = d => d.getUTCDay()
const timeWeek = d3.utcSunday

const svg = d3.create("svg")
  .attr("width", 928)
  .attr("height", yearHeight * years.length)
  .attr("viewBox", [0, 0, 928, yearHeight * years.length])
  .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
  .attr("font-family", "sans-serif")
  .attr("font-size", 10);

const year = svg.selectAll("g")
  .data(years)
  .join("g")
  .attr("transform", (d, i) => `translate(40.5,${yearHeight * i + cellSize * 1.5})`);

year.append('text')
   .attr('x', -5)
   .attr('y', -30)
   .attr("text-anchor", "end")
   .attr('font-size', 16)
   .attr('font-weight', 550)
   .attr('transform', 'rotate(270)')
   .text(d => d.key);


year.append('g')
   .attr('text-anchor', 'end')
   .selectAll('text')
   .data(d3.range(7).map(i => new Date(1999, 0, i)))
   .join('text')
   .attr('x', -5)
   .attr('y', d => (countDay(d) + 0.5) * cellSize)
   .attr('dy', '0.31em')
   .text(formatDay);

year.append('g')
   .selectAll('rect')
   .data(d => d.values)
   .join('rect')
   .attr("width", cellSize - 1.5)
   .attr("height", cellSize - 1.5)
   .attr("x", (d, i) => timeWeek.count(d3.utcYear(d.date), d.date) * cellSize + 10)
   .attr("y", d => countDay(d.date) * cellSize + 0.5);

 const colorFn = d3.scaleSequential(d3.interpolateBuGn).domain([
   Math.floor(0),
   Math.ceil(1000)
 ])
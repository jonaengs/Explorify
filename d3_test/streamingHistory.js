const d3 = window.d3;
const margin = {top: 10, right: 40, bottom: 30, left: 100};
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

let idCount = 1;
function addSvg(parent="body", id=null) {
    return d3.select(parent)
        .append('svg')
        .attr("id", id || "svg-" + idCount++)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
}

function numStreams(nums, nbins) {
    const svg = addSvg();

    const x = d3.scaleLinear()
        .domain([0, d3.max(nums)])
        .range([0, width]);
    svg.append('g')
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));
    
    const histogram = d3.histogram()
        .domain(x.domain())
        .thresholds(x.ticks(nbins || 60))
    const bins = histogram(nums);
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(bins, b => b.length)])
        .range([height, 0]);
    svg.append('g')
        .call(d3.axisLeft(y));

    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    
    svg.selectAll("whatever")
        .data(bins)
        .enter()
        .append("rect")
            .attr("x", 1)
            .attr("transform", vs => `translate(${x(vs.x0)}, ${y(vs.length)})`)
            .attr("height", vs => height - y(vs.length))
            .attr("width", vs => x(vs.x1) - x(vs.x0))
        .on("mouseover", (event, d) => {
            div.transition()
                .duration(100)
                .style("opacity", 1);
            div.html(d.length)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
            })
        .on("mouseout", _ => 
            div.transition()
                .duration(100)
                .style("opacity", 0)
            )
        .on("mousemove", event => 
            div
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px")
            );
}

function playtimeHist(playTimes) {
    const svg = addSvg();
    
    const x = d3.scaleLinear()
        // .domain([d3.min(playTimes), d3.max(playTimes)])
        .domain([0, 10 * 60_000])
        .range([0, width]);
    svg.append('g')
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    const histogram = d3.histogram()
        .domain(x.domain())
        .thresholds(x.ticks(60))
    const bins = histogram(playTimes);

    const y = d3.scaleLinear()
        .domain([0, d3.max(bins, b => b.length)])
        .range([height, 0]);
    svg.append('g')
        .call(d3.axisLeft(y));

    svg.selectAll("whatever")
        .data(bins)
        .enter()
        .append("rect")
            .attr("x", 1)
            .attr("transform", vs => `translate(${x(vs.x0)}, ${y(vs.length)})`)
            .attr("height", vs => height - y(vs.length))
            .attr("width", vs => x(vs.x1) - x(vs.x0));
}

function artistStreams(artists) {
    // Reduce solution is super slow. Is it creating a new object each time?
    // const streams = artists.reduce((acc, a) => ({...acc, [a]: (acc[a] || 0) + 1}), {})
    const streams = {}
    for (const artist of artists) {
        streams[artist] = (streams[artist] || 0) + 1;
    }
    numStreams(Object.values(streams))
}

function trackStreams(tracks) {
    const streams = {}
    for (const track of tracks) {
        streams[track] = (streams[track] || 0) + 1;
    }
    numStreams(Object.values(streams))
}

function timeStreams(times) {
    const streams = Array.from({length: 24}, _ => 0);;
    for (const time of times) { 
        const hour = parseInt(time.split(" ")[1].split(":")[0]);
        streams[hour]++;
    }

    const svg = addSvg();

    const x = d3.scaleLinear()
        .domain([0, 24])
        .range([0, width]);
    svg.append('g')
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(streams)])
        .range([height, 0]);
    svg.append('g')
        .call(d3.axisLeft(y));
    
    svg.selectAll("whatever")
        .data(streams)
        .enter()
        .append("rect")
            .attr("x", (n, h) => x(h))
            .attr("y", (n, h) => y(n))
            .attr("height", n => height - y(n))
            .attr("width", 10)
}

function historyCallback(data) {
    console.log(data[0])
    playtimeHist(data.map(d => d.msPlayed));
    artistStreams(data.map(d => d.artistName));
    trackStreams(data.map(d => d.trackName));
    timeStreams(data.map(d => d.endTime));
}
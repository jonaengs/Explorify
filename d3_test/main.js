if (typeof d3 === 'undefined') {
    const d3 = window.d3;

    const margin = {top: 10, right: 40, bottom: 30, left: 100},
        width = 800 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;
}

function drawHist(tracks) {
    tracks.sort((t1, t2) => t1.duration_ms - t2.duration_ms);
    const svg = d3.select('body')
        .append('svg')
        .attr("id", "histogram")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const x = d3.scaleLinear()
        .domain([0, d3.max(tracks.map(t => t.duration_ms))])
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));
        
    const y = d3.scaleBand()
        .domain(tracks.map(track => track.name))
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));
        
    /*
    const histogram = d3.histogram()
        .value(track => track.duration_ms)
        .domain(x.domain())
        .thresholds(x.ticks(70))

    const bins = histogram(tracks)

    svg.selectAll("rect")
    .data(bins)
    .enter()
    .append("rect")
        .attr("x", 0)
        //.attr("transform", d => `transform(0, ${y(d[0].name)})` )
        .attr("y", d => d.length && y(d[0].name))
        .attr("width", d => x(d.x1))
        .attr("height", 10)
        .style("fill", "#69b3a2")
    */

    const tooltip = d3.select("#histogram")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")

    // Three function that change the tooltip when user hover / move / leave a cell
    const mouseover = function() {
        tooltip
            .style("opacity", 1);
        d3.select(this)
            .style("stroke", "black")
            .style("opacity", 1);
    }
    const mousemove = function(event) {
        tooltip
            .html("The exact value of<br>this cell is: ")
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY) + "px");
    }
    const mouseleave = function() {
        tooltip
            .style("opacity", 0);
        d3.select(this)
            .style("stroke", "none")
            .style("opacity", 0.8);
    }

    svg.selectAll("rect")
        .data(tracks)
        .enter()
        .append("rect")
            .attr("opacity", 0.8)
            .attr("x", 0)
            .attr("y", t => y(t.name) + 10)
            .attr("width", t => x(t.duration_ms))
            .attr("height", 10)
            .style("fill", "#69b3a2")
        // tooltip
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);
}

function drawChart(tracks) {

    const durations = tracks.map(track => track.duration_ms);
    console.log(durations);

    const x = d3.scaleLinear()
        .domain([0, d3.max(durations)])
        .range([0, width])

    const y = d3.scaleBand()
        .domain(tracks.map(track => track.name))
        .range([0, height])

    const svg = d3.select('body')
        .append('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const histogram = d3.histogram()
        .value(track => track.duration_ms)
        .domain(x.domain())
        .thresholds(x.ticks(70))

    const bins = histogram(tracks)

    svg.append('g')
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    svg.append('g')
        .call(d3.axisLeft(y));

    svg.selectAll("whatever")
        .data(tracks)
        .enter()
        .append("circle")
            .attr("cx", t => x(t.duration_ms))
            .attr("cy", t => y(t.name))
            .attr("r", 7);
}


function dataCallback(data) {
    console.log(data);
    const tracks = data.items.map(item => item.track)
    drawHist(tracks);
}
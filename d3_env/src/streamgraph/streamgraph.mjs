// streamingHistory = merged_history.json
function streamgraph() {
    const topArtists = topGroups(streamingHistory, "artist_id", 8);
    const streams = topArtists.flatMap(x => x);  // flatten
    streams.forEach(
        s => (s.endTime = new Date(s.endTime))
    );

    const svg = utils.getSvg("streamgraph");

    const x = d3.scaleTime()
        .domain(d3.extent(streams.map(s => s.endTime)))
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    const histogram = d3.bin()
        .value(s => s.endTime)
        .domain(x.domain())
        .thresholds(x.ticks(50));

    const bins = histogram(streams);

    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(bins, b => b.length)]);
    svg.append("g")
        .call(d3.axisLeft(y));

    const zeros = Object.fromEntries(topArtists.map(datas => [datas[0].artist_id, 0]));
    const data = bins.map(bin => ({
        endTime: bin.x0,
        ...zeros,
        ...Object.fromEntries(Object.entries(groupby(bin, "artist_id")).map(([aid, streams]) => [aid, streams.length]))
    }))
    // const keys = Object.keys(data[0]);
    const keys = topArtists.map(streams => streams[0].artist_id);

    const colors = d3.scaleOrdinal()
        .domain(keys)
        .range(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf']);

    const stackedData = d3.stack()
        .offset(d3.stackOffsetSilhouette)
        .keys(keys)
        (data)
        // .value((bin, aid) => bin.filter(s => s.artist_id === aid).length)
        // (bins)

    console.log(stackedData);

    svg
        .selectAll("mylayers")
        .data(stackedData)
        .join("path")
          .style("fill", d => colors(d.key))
          .attr("d", d3.area()
            .x(d => x(d.data.time))
            .y0(d => y(d[0]))
            .y1(d => y(d[1]))
        )

}

function streamsBarchart() {
    function listTopArtists(bin) {
        const top = topGroups(bin, "artist_id", 3);
        return top.map(streams => streams[0].artistName + ": " + streams.length).join("<br>");
    }

    const streams = streamingHistory.map(s => (
        {...s, endTime: new Date(s.endTime)}
    ));

    const svg = utils.getSvg("streamsBar");

    const x = d3.scaleTime()
        .domain(d3.extent(streams.map(s => s.endTime)))
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    const histogram = d3.bin()
        .value(s => s.endTime)
        .domain(x.domain())
        .thresholds(x.ticks(70));

    const bins = histogram(streams);

    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(bins, b => b.length)]);
    svg.append("g")
        .call(d3.axisLeft(y));

    const div = utils.createTooltip();

    svg.selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
          .attr("x", 1)
          .attr("transform", d => `translate(${x(d.x0)}, ${y(d.length)})`)
          .attr("width", d => x(d.x1) - x(d.x0) - 1)
          .attr("height", d => height - y(d.length))
          .style("fill", "#69b3a2")
        .on("mouseover", utils.onMouseover(div, listTopArtists))
        .on("mousemove", utils.onMousemove(div))
        .on("mouseout", utils.onMouseout(div))
}
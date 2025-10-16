// A more robust function to draw our pretty visualisation
function drawViz(data) {
  // Clear any existing visualisation
  d3.select("body").selectAll("*").remove();

  // --- 1. Data Transformation ---
  // Looker Studio sends data in a specific format, let's make it D3-friendly
  const transformedData = data.tables.DEFAULT.map(row => ({
    day: row.day[0],      // First dimension
    hour: row.hour[0],    // Second dimension
    value: row.listeningCount[0] // First metric
  }));

  // --- 2. Setup SVG and Chart Dimensions ---
  const margin = {top: 50, right: 20, bottom: 20, left: 50},
        width = 700 - margin.left - margin.right,
        height = 700 - margin.top - margin.bottom;

  const svg = d3.select("body")
    .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // --- 3. Define Axes and Scales ---
  // Labels for our axes
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hoursOfDay = d3.range(0, 24).map(d => d.toString().padStart(2, '0')); // "00", "01", etc.

  // Build X scale (Days)
  const x = d3.scaleBand()
    .range([0, width])
    .domain(daysOfWeek)
    .padding(0.1);
  svg.append("g")
    .attr("class", "axis")
    .call(d3.axisTop(x).tickSize(0))
    .select(".domain").remove();

  // Build Y scale (Hours)
  const y = d3.scaleBand()
    .range([0, height])
    .domain(hoursOfDay)
    .padding(0.1);
  svg.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y).tickSize(0))
    .select(".domain").remove();

  // Build Colour scale
  const minVal = d3.min(transformedData, d => d.value);
  const maxVal = d3.max(transformedData, d => d.value);
  const myColor = d3.scaleSequential(d3.interpolateGreens)
    .domain([minVal, maxVal]);

  // --- 4. Tooltip ---
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

  const mouseover = function(event, d) {
    tooltip.style("opacity", 1);
    d3.select(this).style("stroke", "black");
  }
  const mousemove = function(event, d) {
    tooltip
      .html(`Listens: ${d.value}`)
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 10) + "px");
  }
  const mouseleave = function(event, d) {
    tooltip.style("opacity", 0);
    d3.select(this).style("stroke", "none");
  }

  // --- 5. Draw the Heatmap Rectangles ---
  svg.selectAll()
    .data(transformedData, d => `${d.day}:${d.hour}`)
    .enter()
    .append("rect")
      .attr("x", d => x(d.day))
      .attr("y", d => y(d.hour))
      .attr("rx", 8) // Rounded corners
      .attr("ry", 8) // Rounded corners
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style("fill", d => myColor(d.value))
      .style("stroke-width", 2)
      .style("stroke", "none")
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave);
}

// Subscribe to data and style changes from Looker Studio
dscc.subscribeToData(drawViz, {transform: dscc.objectTransform});

// The URL you provided for your published Google Sheet
const dataUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3qcXfg0r8RB3TdiXTsykIkiKBo9dEeru4SMgWxE68gqyi__xPYo3H17FMc87MF2vF_mcvf_dO0qiY/pub?gid=356742097&single=true&output=csv';

// --- No changes needed in this section ---
const width = 800;
const height = 120;
const cellSize = 12; // size of each day's square

const colorScale = d3.scaleLinear()
    // You can tweak this domain later based on your listening habits
    .domain([0, 10, 20, 50, 100])
    .range(['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353']);

const svg = d3.select("#heatmap")
    .append("svg")
    .attr("width", width)
    .attr("height", height);
// --- End of unchanged section ---


// Fetch and process the data
d3.csv(dataUrl).then(data => {
    // Define a parser that matches your Google Sheet's format 'DD/MM/YYYY HH:MM:SS'
    const parseTime = d3.timeParse("%d/%m/%Y %H:%M:%S");

    // Filter out any rows where the Timestamp might be missing
    const validData = data.filter(d => d.Timestamp);

    // Group all your entries by day and count them
    const dataByDate = d3.rollup(validData,
        v => v.length, // The value for each group is its size (the count of tracks)
        d => d3.timeFormat("%Y-%m-%d")(parseTime(d.Timestamp)) // The key for the group
    );

    // Find the latest date in your data to determine the range
    const maxDate = d3.max(validData, d => parseTime(d.Timestamp));
    
    if (!maxDate) {
        console.error("Could not determine a date range from the data. Is the 'Timestamp' column correct?");
        return;
    }

    // Generate all days in the year up to the max date
    const allDays = d3.timeDays(d3.timeYear(maxDate), maxDate);

    // --- The drawing logic ---
    svg.selectAll(".day")
        .data(allDays)
        .enter()
        .append("rect")
        .attr("class", "day")
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("x", d => d3.timeWeek.count(d3.timeYear(d), d) * (cellSize + 3))
        .attr("y", d => d.getDay() * (cellSize + 3))
        .attr("fill", d => {
            const dateStr = d3.timeFormat("%Y-%m-%d")(d);
            const value = dataByDate.get(dateStr) || 0;
            return colorScale(value);
        })
        .append("title")
        .text(d => {
            const dateStr = d3.timeFormat("%Y-%m-%d")(d);
            const value = dataByDate.get(dateStr) || 'No';
            return `${dateStr}: ${value} tracks listened to`;
        });
}).catch(error => {
    console.error('Error fetching or parsing data:', error);
    d3.select("#heatmap").append("p").text("Failed to load data. Check the browser console and your CSV URL.");
});
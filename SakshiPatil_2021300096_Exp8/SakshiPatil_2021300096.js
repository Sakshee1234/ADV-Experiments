// Load the CSV data using D3
let data = [];

d3.csv('Forest.csv').then(csvData => {
    data = csvData.map(d => ({
        "State/UT": d['State/UTs'],
        "GeographicalArea": parseInt(d['Geographical area'].replace(/,/g, ''), 10),
        "VeryDense": parseInt(d['veryDense'].replace(/,/g, ''), 10),
        "ModeratelyDense": parseInt(d['moderatelyDense'].replace(/,/g, ''), 10),
        "OpenForest": parseInt(d['openForest'].replace(/,/g, ''), 10),
        "TotalForestArea": parseInt(d['TotalForestArea'].replace(/,/g, ''), 10),
        "GeographicalAreaPercentage": parseFloat(d['Percentage of geographical area']),
        "Scrub": parseInt(d['Scrub'].replace(/,/g, ''), 10)
    }));
    console.log(data);
    createCharts();
    createHistogram();
    createBoxPlot();
});

function createBoxPlot() {
    const margin = { top: 10, right: 30, bottom: 30, left: 40 },
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#boxPlot")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const dataSorted = data.map(d => d.GeographicalAreaPercentage).sort(d3.ascending);
    const q1 = d3.quantile(dataSorted, 0.25);
    const median = d3.quantile(dataSorted, 0.5);
    const q3 = d3.quantile(dataSorted, 0.75);
    const iqr = q3 - q1;
    const min = d3.min(dataSorted);
    const max = d3.max(dataSorted);

    const x = d3.scaleBand()
        .domain(["Geographical Area Percentage"])
        .range([0, width])
        .padding(0.5);

    const y = d3.scaleLinear()
        .domain([0, d3.max(dataSorted)])
        .range([height, 0]);

    // Draw the box
    svg.append("rect")
        .attr("x", x("Geographical Area Percentage"))
        .attr("y", y(q3))
        .attr("width", x.bandwidth())
        .attr("height", y(q1) - y(q3))
        .attr("fill", "lightblue")
        .attr("stroke", "black");

    // Draw the median line
    svg.append("line")
        .attr("x1", x("Geographical Area Percentage"))
        .attr("x2", x("Geographical Area Percentage") + x.bandwidth())
        .attr("y1", y(median))
        .attr("y2", y(median))
        .attr("stroke", "black")
        .attr("stroke-width", 2);

    // Draw horizontal whisker lines (caps) at min and max values
    svg.append("line")
        .attr("x1", x("Geographical Area Percentage") + x.bandwidth() / 4)
        .attr("x2", x("Geographical Area Percentage") + (3 * x.bandwidth()) / 4)
        .attr("y1", y(min))
        .attr("y2", y(min))
        .attr("stroke", "black");

    svg.append("line")
        .attr("x1", x("Geographical Area Percentage") + x.bandwidth() / 4)
        .attr("x2", x("Geographical Area Percentage") + (3 * x.bandwidth()) / 4)
        .attr("y1", y(max))
        .attr("y2", y(max))
        .attr("stroke", "black");

    // Add x-axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    // Add y-axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Y-axis label
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 10)
        .attr("x", -height / 2)
        .attr("dy", "0.75em")
        .text("Geographical Area Percentage");
}

function createHistogram() {
    // Histogram for the distribution of forest areas
    const histogramCtx = document.getElementById("histogram").getContext("2d");

    // Calculate the distribution of forest areas
    const forestAreas = data.map(d => d.TotalForestArea);
    const bins = 10; // Number of bins for the histogram
    const maxArea = Math.max(...forestAreas);
    const minArea = Math.min(...forestAreas);
    const binWidth = (maxArea - minArea) / bins;

    const histogramData = new Array(bins).fill(0);
    forestAreas.forEach(area => {
        const binIndex = Math.floor((area - minArea) / binWidth);
        histogramData[Math.min(binIndex, bins - 1)]++;
    });

    new Chart(histogramCtx, {
        type: 'bar',
        data: {
            labels: histogramData.map((_, i) => `${(minArea + i * binWidth).toFixed(2)} - ${(minArea + (i + 1) * binWidth).toFixed(2)}`),
            datasets: [{
                label: "Number of States",
                data: histogramData,
                backgroundColor: "#ffcc00"
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Forest Area Range'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Number of States'
                    }
                }
            }
        }
    });
}

function createCharts() {
    // Bar Chart for Total Forest Area by State/UT
    const barChartCtx = document.getElementById("barChart").getContext("2d");
    new Chart(barChartCtx, {
        type: 'bar',
        data: {
            labels: data.map(d => d["State/UT"]),
            datasets: [{
                label: "Total Forest Area",
                data: data.map(d => d.TotalForestArea),
                backgroundColor: "#69b3a2"
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { 
                    display: true,
                    ticks: {
                        autoSkip: false
                    }
                },
                y: { display: true }
            }
        }
    });

    // Pie Chart for Distribution of Forest Types
    const pieChartCtx = document.getElementById("pieChart").getContext("2d");
    new Chart(pieChartCtx, {
        type: 'pie',
        data: {
            labels: ["Very Dense", "Moderately Dense", "Open Forest"],
            datasets: [{
                data: [
                    data.reduce((sum, d) => sum + d.VeryDense, 0),
                    data.reduce((sum, d) => sum + d.ModeratelyDense, 0),
                    data.reduce((sum, d) => sum + d.OpenForest, 0)
                ],
                backgroundColor: ["#FF6347", "#FFA500", "#32CD32"]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' }
            }
        }
    });

    // Line Chart for Percentage Contribution by State/UT
    const lineChartCtx = document.getElementById("lineChart").getContext("2d");
    new Chart(lineChartCtx, {
        type: 'line',
        data: {
            labels: data.map(d => d["State/UT"]),
            datasets: [{
                label: "Forest Percentage",
                data: data.map(d => d.GeographicalAreaPercentage),
                borderColor: "#FFA500",
                backgroundColor: "#FFA500",
                pointBackgroundColor: "#FF4500",
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { 
                    display: true,
                    title: {
                        display: true,
                        text: 'State/UT'
                    },
                    ticks: {
                        autoSkip: false
                    }
                },
                y: { 
                    display: true,
                    title: {
                        display: true,
                        text: 'Forest Percentage'
                    }
                }
            }
        }
    });
}
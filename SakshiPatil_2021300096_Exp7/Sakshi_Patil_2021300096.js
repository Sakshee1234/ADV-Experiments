// Load the CSV data
d3.csv("./Finance_data.csv").then(data => {
    // Parse numeric values
    data.forEach(d => {
        d.age = +d.age;
        d.Mutual_Funds = +d.Mutual_Funds;
        d.Equity_Market = +d.Equity_Market;
        d.Debentures = +d.Debentures;
        d.Government_Bonds = +d.Government_Bonds;
        d.Fixed_Deposits = +d.Fixed_Deposits;
        d.PPF = +d.PPF;
        d.Gold = +d.Gold;
        d.Stock_Marktet = +d.Stock_Marktet;
    });

    // Call functions to create visualizations
    createBarChart(data);
    createPieChart(data);
    createHistogram(data);
    createScatterPlot(data);
    createBubblePlot(data);
    createBoxPlot(data);
    createRegressionPlot(data);

    calculatePearsonCorrelation(data, 'Equity_Market', 'Mutual_Funds');
});

function calculatePearsonCorrelation(data, xKey, yKey) {
    const n = data.length;
    const sumX = d3.sum(data, d => d[xKey]);
    const sumY = d3.sum(data, d => d[yKey]);
    const sumXY = d3.sum(data, d => d[xKey] * d[yKey]);
    const sumX2 = d3.sum(data, d => d[xKey] ** 2);
    const sumY2 = d3.sum(data, d => d[yKey] ** 2);

    // Calculate the correlation coefficient
    const numerator = (n * sumXY) - (sumX * sumY);
    const denominator = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));

    const correlationCoefficient = denominator ? (numerator / denominator) : 0;

    //callate pvalue
    const t = correlationCoefficient * Math.sqrt((n - 2) / (1 - correlationCoefficient ** 2));
    const p = 2 * (1 - jStat.studentt.cdf(Math.abs(t), n - 2));

    // Display the result in the console
    const resultDiv = d3.select("#correlationResult");
    resultDiv.append("p").text(`Hypothesis: There is a positive correlation between ${xKey} and ${yKey}.`);
    resultDiv.append("p").text(`Pearson correlation coefficient: ${correlationCoefficient}`);
    resultDiv.append("p").text(`P-value: ${p}`);

    //Interpret resilt using p value
    if (p < 0.05) {
        resultDiv.append("p").text("Result: The correlation is statistically significant at the 0.05 level.");
    } else {
        resultDiv.append("p").text("Result: The correlation is not statistically significant at the 0.05 level.");
    }
}

function createBarChart(data) {
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#barChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(data.map(d => d.Investment_Avenues))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Mutual_Funds)])
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.Investment_Avenues))
        .attr("y", d => y(d.Mutual_Funds))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.Mutual_Funds))
        .attr("fill", "steelblue");
}

function createPieChart(data) {
    const investmentAvenues = ['Mutual_Funds', 'Equity_Market', 'Debentures', 'Government_Bonds', 'Fixed_Deposits', 'PPF', 'Gold', 'Stock_Marktet'];
    const totals = investmentAvenues.map(avenue => {
        return {
            avenue,
            total: d3.mean(data, d => d[avenue]) // Average investment for each avenue
        };
    });

    const pieSvg = d3.select("#pieChart");
    const radius = Math.min(400, 400) / 2;

    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const pie = d3.pie().value(d => d.total);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    const g = pieSvg.append("g")
        .attr("transform", `translate(${radius},${radius})`);

    const arcs = pie(totals);
    g.selectAll(".arc")
        .data(arcs)
        .enter().append("path")
        .attr("class", "arc")
        .attr("d", arc)
        .attr("fill", (d, i) => color(i));

    // Add labels with percentages
    g.selectAll(".label")
        .data(arcs)
        .enter().append("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .style("fill", "black") // Set text color to black
        .text(d => {
            const percentage = (d.data.total / d3.sum(totals.map(t => t.total)) * 100).toFixed(1);
            return `${d.data.avenue}: ${percentage}%`;
        });
}

function createHistogram(data) {
    const averages = {};
    const investmentAvenues = ['Mutual_Funds', 'Equity_Market', 'Debentures', 'Government_Bonds', 'Fixed_Deposits', 'PPF', 'Gold'];
    investmentAvenues.forEach(avenue => {
        averages[avenue] = d3.rollup(data, v => d3.mean(v, d => d[avenue]), d => d.gender);
    });

    const preparedData = investmentAvenues.map(avenue => {
        return {
            avenue,
            Female: averages[avenue].get('Female') || 0,
            Male: averages[avenue].get('Male') || 0
        };
    });

    const histogramSvg = d3.select("#histogram").append("g")
        .attr("transform", "translate(40, 20)");

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const xHist = d3.scaleBand()
        .domain(preparedData.map(d => d.avenue))
        .range([0, width])
        .padding(0.1);

    const yHist = d3.scaleLinear()
        .domain([0, d3.max(preparedData, d => d3.max([d.Female, d.Male]))])
        .nice()
        .range([height, 0]);

    histogramSvg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xHist));

    histogramSvg.append("text")
        .attr("class", "label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height + margin.bottom - 10)
        .text("Investment Avenues");

    histogramSvg.append("text")
        .attr("class", "label")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 10)
        .attr("x", -height / 2)
        .attr("dy", "0.75em")
        .text("Average Investment");

        const legend = histogramSvg.append("g")
            .attr("transform", `translate(${width - 150}, 20)`);

        legend.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", "lightsteelblue");

        legend.append("text")
            .attr("x", 30)
            .attr("y", 15)
            .text("Female");

        legend.append("rect")
            .attr("x", 0)
            .attr("y", 30)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", "lightcoral");

        legend.append("text")
            .attr("x", 30)
            .attr("y", 45)
            .text("Male");
    histogramSvg.append("g")
        .call(d3.axisLeft(yHist));

    histogramSvg.selectAll(".bar-female")
        .data(preparedData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => xHist(d.avenue))
        .attr("y", d => yHist(d.Female))
        .attr("width", xHist.bandwidth() / 2)
        .attr("height", d => height - yHist(d.Female));

    histogramSvg.selectAll(".bar-male")
        .data(preparedData)
        .enter().append("rect")
        .attr("class", "bar bar-male")
        .attr("x", d => xHist(d.avenue) + xHist.bandwidth() / 2)
        .attr("y", d => yHist(d.Male))
        .attr("width", xHist.bandwidth() / 2)
        .attr("height", d => height - yHist(d.Male));
}

function createLineChart(data) {
    const margin = { top: 20, right: 30, bottom: 60, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#lineChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const ageGroups = Array.from(new Set(data.map(d => d.age))).sort();
    const investmentAvenues = ['Mutual_Funds', 'Equity_Market', 'Debentures', 'Government_Bonds', 'Fixed_Deposits', 'PPF', 'Gold', 'Stock_Marktet'];
    
    const x = d3.scaleLinear()
        .domain(d3.extent(ageGroups))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d3.max(investmentAvenues.map(a => d[a])))])
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    svg.append("g").call(d3.axisLeft(y));

    investmentAvenues.forEach(avenue => {
        const line = d3.line()
            .x(d => x(d.age))
            .y(d => y(d[avenue]));

        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", d3.schemeCategory10[investmentAvenues.indexOf(avenue)])
            .attr("stroke-width", 1.5)
            .attr("d", line);
    });
}

function createScatterPlot(data) {
    const margin = { top: 20, right: 30, bottom: 60, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#scatterPlot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Mutual_Funds)])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Equity_Market)])
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y));
    
    svg.append("text")
        .attr("class", "label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height + margin.bottom - 10)
        .text("Mutual Funds Investment");

    svg.append("text")
        .attr("class", "label")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 10)
        .attr("x", -height / 2)
        .attr("dy", "0.75em")
        .text("Equity Market Investment");
    svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d.Mutual_Funds))
        .attr("cy", d => y(d.Equity_Market))
        .attr("r", 5)
        .attr("fill", "steelblue");
}

function createBubblePlot(data) {
    const margin = { top: 20, right: 30, bottom: 60, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#bubblePlot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Mutual_Funds)])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Equity_Market)])
        .range([height, 0]);

    const z = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Gold)])
        .range([5, 20]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("text")
        .attr("class", "label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height + margin.bottom - 10)
        .text("Mutual Funds Investment");

    svg.append("text")
        .attr("class", "label")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 10)
        .attr("x", -height / 2)
        .attr("dy", "0.75em")
        .text("Equity Market Investment");
    svg.append("g")
        .call(d3.axisLeft(y));

    svg.selectAll(".bubble")
        .data(data)
        .enter().append("circle")
        .attr("class", "bubble")
        .attr("cx", d => x(d.Mutual_Funds))
        .attr("cy", d => y(d.Equity_Market))
        .attr("r", d => z(d.Gold))
        .attr("fill", "steelblue")
        .attr("opacity", 0.7);
}

function createBoxPlot(data) {
    const margin = { top: 20, right: 30, bottom: 60, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#boxPlot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(["Mutual Funds"])
        .range([0, width])
        .padding(0.5);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Mutual_Funds)])
        .range([height, 0]);

    const dataSorted = data.map(d => d.Mutual_Funds).sort(d3.ascending);
    const q1 = d3.quantile(dataSorted, 0.25);
    const median = d3.quantile(dataSorted, 0.5);
    const q3 = d3.quantile(dataSorted, 0.75);
    const iqr = q3 - q1;
    const min = d3.min(dataSorted);
    const max = d3.max(dataSorted);

    // Draw the box
    svg.append("rect")
        .attr("class", "box")
        .attr("x", x("Mutual Funds"))
        .attr("y", y(q3))
        .attr("width", x.bandwidth())
        .attr("height", y(q1) - y(q3))
        .attr("fill", "lightblue")
        .attr("stroke", "black");

    // Draw the median line
    svg.append("line")
        .attr("class", "median")
        .attr("x1", x("Mutual Funds"))
        .attr("x2", x("Mutual Funds") + x.bandwidth())
        .attr("y1", y(median))
        .attr("y2", y(median))
        .attr("stroke", "black")
        .attr("stroke-width", 2);

    // Draw whiskers (from min to Q1 and from Q3 to max)
    svg.append("line")
        .attr("class", "whisker")
        .attr("x1", x("Mutual Funds") + x.bandwidth() / 2)
        .attr("x2", x("Mutual Funds") + x.bandwidth() / 2)
        .attr("y1", y(min))
        .attr("y2", y(q1))
        .attr("stroke", "black");

    svg.append("line")
        .attr("class", "whisker")
        .attr("x1", x("Mutual Funds") + x.bandwidth() / 2)
        .attr("x2", x("Mutual Funds") + x.bandwidth() / 2)
        .attr("y1", y(q3))
        .attr("y2", y(max))
        .attr("stroke", "black");

    // Draw horizontal whisker lines (caps) at min and max values
    svg.append("line")
        .attr("class", "min-cap")
        .attr("x1", x("Mutual Funds") + x.bandwidth() / 4)
        .attr("x2", x("Mutual Funds") + (3 * x.bandwidth()) / 4)
        .attr("y1", y(min))
        .attr("y2", y(min))
        .attr("stroke", "black");

    svg.append("line")
        .attr("class", "max-cap")
        .attr("x1", x("Mutual Funds") + x.bandwidth() / 4)
        .attr("x2", x("Mutual Funds") + (3 * x.bandwidth()) / 4)
        .attr("y1", y(max))
        .attr("y2", y(max))
        .attr("stroke", "black");

    // Add x-axis
    svg.append("g")
        .attr("class", "axis--x")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    // Add y-axis
    svg.append("g")
        .attr("class", "axis--y")
        .call(d3.axisLeft(y));

    // Y-axis label
    svg.append("text")
        .attr("class", "label")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 10)
        .attr("x", -height / 2)
        .attr("dy", "0.75em")
        .text("Mutual Funds Investment");
}

function createRegressionPlot(data) {
    const margin = { top: 20, right: 30, bottom: 60, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#regressionPlot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Mutual_Funds)])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Equity_Market)])
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d.Mutual_Funds))
        .attr("cy", d => y(d.Equity_Market))
        .attr("r", 5);

    const linearRegression = (data) => {
        const n = data.length;
        const sumX = d3.sum(data, d => d.Mutual_Funds);
        const sumY = d3.sum(data, d => d.Equity_Market);
        const sumXY = d3.sum(data, d => d.Mutual_Funds * d.Equity_Market);
        const sumX2 = d3.sum(data, d => d.Mutual_Funds ** 2);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
        const intercept = (sumY - slope * sumX) / n;

        console.log("Slope:", slope, "Intercept:", intercept); // Logging for debugging
        return { slope, intercept };
    };

    const { slope, intercept } = linearRegression(data);

    const lineData = [
        { Mutual_Funds: 0, Equity_Market: intercept },
        { Mutual_Funds: d3.max(data, d => d.Mutual_Funds), Equity_Market: slope * d3.max(data, d => d.Mutual_Funds) + intercept }
    ];

    svg.append("path")
        .datum(lineData)
        .attr("class", "line")
        .attr("d", d3.line()
            .x(d => x(d.Mutual_Funds))
            .y(d => y(d.Equity_Market))
        )
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2);

    svg.append("text")
        .attr("class", "label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height + margin.bottom - 10)
        .text("Mutual Funds Investment");

    svg.append("text")
        .attr("class", "label")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 10)
        .attr("x", -height / 2)
        .attr("dy", "0.75em")
        .text("Equity Market Investment");

    svg.append("text")
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", -10)
        .text("Regression Line: Equity Market vs Mutual Funds");
}

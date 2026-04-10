// set up dimens. and margins
const margin = { top: 80, right: 60, bottom: 80, left: 100 };
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;
const marginLine = { top: 40, right: 60, bottom: 60, left: 100 };
const lineWidth = 800 - marginLine.left - marginLine.right;
const lineHeight = 300 - marginLine.top - marginLine.bottom;
const years = d3.range(2000, 2024); // 2000-2023

// list for easier data manipulation
const europeanCountries = [
    'Austria', 'Belarus', 'Belgium', 'Bulgaria', 'Croatia',
    'Cyprus', 'Czechia', 'Denmark', 'Estonia', 'Finland', 'France',
    'Georgia', 'Germany', 'Greece', 'Hungary', 'Iceland',
    'Ireland', 'Italy', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Malta', 'Moldova', 'Monaco', 'Netherlands', 'Norway', 'Poland',
    'Portugal', 'Romania', 'Russia', 'Serbia', 'Slovak Republic', 'Slovenia',
    'Spain', 'Sweden', 'Switzerland', 'Türkiye', 'Ukraine', 'United Kingdom',
    'Uzbekistan'
];

// html tab code
function openTab(event, tabName) {
    document.querySelectorAll('.tabcontent').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.tablinks').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabName).style.display = 'block';
    event.currentTarget.classList.add('active');
}

// create heatmap SVG
const svg = d3.select('#vis')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

// create line chart svg
const lineSvg = d3.select('#vis2')
    .append('svg')
    .attr('width', lineWidth + marginLine.left + marginLine.right)
    .attr('height', lineHeight + marginLine.top + marginLine.bottom)
    .append('g')
    .attr('transform', `translate(${marginLine.left},${marginLine.top})`);

// heatmap legend
function drawLegend(color) {
    const legendWidth = 200;
    const legendHeight = 10;
    const legendX = width - legendWidth;
    const legendY = height + 30;

    const defs = svg.append('defs');
    const linearGradient = defs.append('linearGradient')
        .attr('id', 'legend-gradient');

    linearGradient.selectAll('stop')
        .data([
            { offset: '0%',   color: color(50)  },
            { offset: '50%',  color: color(0)   },
            { offset: '100%', color: color(-55) }
        ])
        .enter().append('stop')
        .attr('offset', d => d.offset)
        .attr('stop-color', d => d.color);

    svg.append('rect')
        .attr('x', legendX)
        .attr('y', legendY)
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#legend-gradient)');

    const legendScale = d3.scaleLinear()
        .domain([50, -55])
        .range([0, legendWidth]);

    svg.append('g')
        .attr('transform', `translate(${legendX}, ${legendY + legendHeight})`)
        .call(d3.axisBottom(legendScale)
            .tickValues([50, 0, -55])
            .tickFormat(d => `${d > 0 ? '+' : ''}${d}%`)
            .tickSize(3))
        .select('.domain').remove();

    svg.append('text')
        .attr('x', legendX + legendWidth / 2)
        .attr('y', legendY - 6)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('fill', '#555')
        .text('% change from 2000');
}

// draw graph labels
function drawTitles() {
    // main title
    svg.append('text')
        .attr('class', 'chart-title')
        .attr('x', width / 2)
        .attr('y', -50)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text('European Greenhouse Gas Emissions Per Capita');

    // subtitle
    svg.append('text')
        .attr('class', 'chart-subtitle')
        .attr('x', width / 2)
        .attr('y', -30)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('fill', '#555')
        .text('% change from 2000 baseline | Total GHG excluding LULUCF | Click a country row to see trend');

    // data source footnote
    svg.append('text')
        .attr('class', 'footnote')
        .attr('x', 0)
        .attr('y', height + 65)
        .attr('text-anchor', 'start')
        .style('font-size', '10px')
        .style('fill', '#888')
        .text('Source: OECD/UNFCCC National Inventory Submissions 2025');
}

// load csv and transform data
function init() {
    d3.csv('data/oecd_env_data.csv').then(raw => {
        console.log(raw); // debug

        // filter to european countries only
        const filtered = raw.filter(d => europeanCountries.includes(d['Reference area']));

        // build lookup: { country -> { year -> value } }
        const lookup = {};
        filtered.forEach(d => {
            const country = d['Reference area'];
            const year = +d['TIME_PERIOD'];
            const value = +d['OBS_VALUE'];
            if (!lookup[country]) lookup[country] = {};
            lookup[country][year] = value;
        });

        // compute % change from 2000 baseline
        const heatData = [];
        europeanCountries.forEach(country => {
            const baseline = lookup[country]?.[2000];
            if (!baseline) return;
            years.forEach(year => {
                const raw = lookup[country]?.[year];
                const pct = raw != null ? ((raw - baseline) / baseline) * 100 : null;
                heatData.push({ country, year, raw, pct });
            });
        });

        // sort countries by 2023 % change (biggest decrease at top)
        const pct2023 = {};
        europeanCountries.forEach(country => {
            const entry = heatData.find(d => d.country === country && d.year === 2023);
            pct2023[country] = entry?.pct ?? Infinity;
        });
        const sortedCountries = [...europeanCountries].sort((a, b) => pct2023[a] - pct2023[b]);

        // x scale (years)
        const x = d3.scaleBand()
            .domain(years)
            .range([0, width])
            .padding(0.05);

        // y scale (countries)
        const y = d3.scaleBand()
            .domain(sortedCountries)
            .range([0, height])
            .padding(0.05);

        // diverging color scale: green = decreased, red = increased
        const color = d3.scaleDiverging()
            .domain([50, 0, -55])
            .interpolator(d3.interpolateRdYlGn);

        // x axis (showing every 5 years)
        svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(x)
                .tickValues(years.filter(y => y % 5 === 0))
                .tickSize(0))
            .select('.domain').remove();

        // y axis
        svg.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(y).tickSize(0))
            .select('.domain').remove();

        // draw heatmap cells
        svg.selectAll('.cell')
            .data(heatData.filter(d => d.pct !== null))
            .enter()
            .append('rect')
            .attr('class', 'cell')
            .attr('x', d => x(d.year))
            .attr('y', d => y(d.country))
            .attr('width', x.bandwidth())
            .attr('height', y.bandwidth())
            .attr('fill', d => color(d.pct))
            .attr('rx', 2)
            .on('mouseover', function(event, d) {
                d3.select('#tooltip')
                    .style('display', 'block')
                    .style('opacity', 0)
                    .html(`
                        <strong>${d.country}</strong> — ${d.year}<br/>
                        Emissions: ${d.raw.toFixed(2)} kg CO₂e/person<br/>
                        Change from 2000: ${d.pct > 0 ? '+' : ''}${d.pct.toFixed(1)}%
                    `)
                    .style('left', (event.pageX + 12) + 'px')
                    .style('top', (event.pageY - 28) + 'px')
                    .transition().duration(20)
                    .style('opacity', 1);
            })
            .on('mouseout', function() {
                d3.select('#tooltip')
                    .transition().duration(20)
                    .style('opacity', 0)
                    .on('end', function() { d3.select(this).style('display', 'none'); });
            });

        drawLegend(color);
        drawTitles();

    }).catch(error => console.error('Error loading data:', error));
}

window.addEventListener('load', init);
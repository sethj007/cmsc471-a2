// set up dimens. and margins
const margin = { top: 80, right: 40, bottom: 80, left: 120 };
const width = 900 - margin.left - margin.right;
const height = 750 - margin.top - margin.bottom;

// line chart svg
const marginLine = { top: 40, right: 100, bottom: 60, left: 80 };
const lineWidth = 750 - marginLine.left - marginLine.right;
const lineHeight = 375 - marginLine.top - marginLine.bottom;

// bar chart svg
const marginBar = { top: 40, right: 100, bottom: 60, left: 80 };
const barWidth = 750 - marginBar.left - marginBar.right;
const barHeight = 375 - marginBar.top - marginBar.bottom;

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

let lookup = {};
let heatData = [];
let sortedCountries = [];

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

const barSvg = d3.select('#vis3')
    .append('svg')
    .attr('width', barWidth + marginBar.left + marginBar.right)
    .attr('height', barHeight + marginBar.top + marginBar.bottom)
    .append('g')
    .attr('transform', `translate(${marginBar.left},${marginBar.top})`);

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
            { offset: '0%', color: color(50) },
            { offset: '50%', color: color(0) },
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

// draw line chart axes and reference line
function drawLineChart(country) {
    // clear any previous line chart content
    lineSvg.selectAll('*').remove();

    // show the panel
    d3.select('#vis2').style('display', 'block');

    // get all raw values for selected country and OECD Europe
    const countryData = years
        .map(year => ({ year, value: lookup[country]?.[year] }))
        .filter(d => d.value != null);

    const oecdData = years
        .map(year => ({ year, value: lookup['OECD Europe']?.[year] }))
        .filter(d => d.value != null);

    // x scale (years)
    const xLine = d3.scaleLinear()
        .domain([2000, 2023])
        .range([0, lineWidth]);

    // y scale (raw emissions value)
    const allValues = [...countryData, ...oecdData].map(d => d.value);
    const yLine = d3.scaleLinear()
        .domain([0, d3.max(allValues) * 1.1])
        .range([lineHeight, 0]);

    // x axis
    lineSvg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${lineHeight})`)
        .call(d3.axisBottom(xLine).tickFormat(d3.format('d')).ticks(6));

    // y axis
    lineSvg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(yLine).ticks(5));

    // line generator
    const line = d3.line()
        .x(d => xLine(d.year))
        .y(d => yLine(d.value))
        .defined(d => d.value != null);

    // OECD Europe reference line
    lineSvg.append('path')
        .datum(oecdData)
        .attr('class', 'oecd-line')
        .attr('fill', 'none')
        .attr('stroke', '#aaa')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,3')
        .attr('d', line);

    // OECD Europe label
    const lastOecd = oecdData[oecdData.length - 1];
    lineSvg.append('text')
        .attr('x', xLine(lastOecd.year) + 5)
        .attr('y', yLine(lastOecd.value))
        .style('font-size', '10px')
        .style('fill', '#aaa')
        .text('OECD Europe avg.');

    // country line
    lineSvg.append('path')
        .datum(countryData)
        .attr('class', 'country-line')
        .attr('fill', 'none')
        .attr('stroke', '#2a7a2a')
        .attr('stroke-width', 2.5)
        .attr('d', line);

    // COVID annotation
    lineSvg.append('line')
        .attr('x1', xLine(2020))
        .attr('x2', xLine(2020))
        .attr('y1', 0)
        .attr('y2', lineHeight)
        .attr('stroke', '#999')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,3');

    lineSvg.append('text')
        .attr('x', xLine(2020) + 4)
        .attr('y', 12)
        .style('font-size', '9px')
        .style('fill', '#999')
        .text('COVID-19');

    // hover dot and vertical line
    const focus = lineSvg.append('g')
        .attr('class', 'focus')
        .style('display', 'none');

    focus.append('line')
        .attr('class', 'focus-line')
        .attr('y1', 0)
        .attr('y2', lineHeight)
        .attr('stroke', '#ccc')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3');

    focus.append('circle')
        .attr('class', 'focus-circle')
        .attr('r', 5)
        .attr('fill', '#2a7a2a')
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

    // invisible overlay to capture mouse movement
    lineSvg.append('rect')
        .attr('class', 'overlay')
        .attr('width', lineWidth)
        .attr('height', lineHeight)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .on('mouseover', () => focus.style('display', null))
        .on('mouseout', function () {
            focus.style('display', 'none');
            d3.select('#tooltip')
                .style('opacity', 0)
                .on('end', function () { d3.select(this).style('display', 'none'); });
        })
        .on('mousemove', function (event) {
            const [mx] = d3.pointer(event);
            const year = Math.round(xLine.invert(mx));
            const d = countryData.find(d => d.year === year);
            if (!d) return;

            focus.select('.focus-line')
                .attr('transform', `translate(${xLine(d.year)}, 0)`);

            focus.select('.focus-circle')
                .attr('transform', `translate(${xLine(d.year)}, ${yLine(d.value)})`);

            d3.select('#tooltip')
                .style('display', 'block')
                .style('opacity', 1)
                .html(`
                    <strong>${country}</strong> — ${d.year}<br/>
                    ${d.value.toFixed(2)} kg CO₂e/person
                `)
                .style('left', (event.pageX + 12) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        });

    // dynamic title
    lineSvg.append('text')
        .attr('class', 'line-title')
        .attr('x', lineWidth / 2)
        .attr('y', -15)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text(`${country} — Emissions Over Time`);

    // reset button (SVG)
    const resetBtn = lineSvg.append('g')
        .attr('class', 'reset-btn')
        .attr('transform', `translate(${lineWidth + marginLine.right - 10}, ${lineHeight + 40})`)
        .style('cursor', 'pointer')
        .on('click', resetSelection);

    resetBtn.append('rect')
        .attr('x', -90)
        .attr('y', -14)
        .attr('width', 100)
        .attr('height', 20)
        .attr('rx', 4)
        .attr('fill', 'none')
        .attr('stroke', '#ccc');

    resetBtn.append('text')
        .attr('x', -40)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('fill', '#666')
        .text('✕ Clear Selection');

    // y axis label
    lineSvg.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -lineHeight / 2)
        .attr('y', -50)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .text('kg CO₂e per person');

    drawBarChart(country);
}

// draw decade comparison bar chart
function drawBarChart(country) {
    barSvg.selectAll('*').remove();

    const baseline = lookup[country]?.[2000];
    if (!baseline) return;

    // compute average % change for each period
    const periods = [
        { label: '2000–2010', years: d3.range(2000, 2011), color: '#d4724a' },
        { label: '2010–2020', years: d3.range(2010, 2021), color: '#c8b84a' },
        { label: '2021–2023', years: d3.range(2021, 2024), color: '#4a9a5a' }
    ];

    const barData = periods.map(p => {
        const values = p.years
            .map(y => lookup[country]?.[y])
            .filter(v => v != null);
        const avg = d3.mean(values);
        const pct = ((avg - baseline) / baseline) * 100;
        return { label: p.label, pct, color: p.color };
    });

    // x scale
    const xBar = d3.scaleBand()
        .domain(barData.map(d => d.label))
        .range([0, barWidth])
        .padding(0.3);

    // y scale
    const yMin = Math.min(0, d3.min(barData, d => d.pct) * 1.2);
    const yMax = Math.max(0, d3.max(barData, d => d.pct) * 1.2);
    const yBar = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([barHeight, 0]);

    // x axis — always at bottom
    barSvg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${barHeight})`)
        .call(d3.axisBottom(xBar))
        .selectAll('text')
        .attr('dy', '1.5em');

    // y axis
    barSvg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(yBar)
            .ticks(5)
            .tickFormat(d => `${d > 0 ? '+' : ''}${d.toFixed(0)}%`));

    // zero line
    barSvg.append('line')
        .attr('x1', 0)
        .attr('x2', barWidth)
        .attr('y1', yBar(0))
        .attr('y2', yBar(0))
        .attr('stroke', '#ccc')
        .attr('stroke-width', 1);

    // bars
    barSvg.selectAll('.bar')
        .data(barData)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => xBar(d.label))
        .attr('y', d => d.pct < 0 ? yBar(0) : yBar(d.pct))
        .attr('width', xBar.bandwidth())
        .attr('height', d => Math.abs(yBar(d.pct) - yBar(0)))
        .attr('fill', d => d.color)
        .attr('rx', 3);

    // value labels on bars
    barSvg.selectAll('.bar-label')
        .data(barData)
        .enter()
        .append('text')
        .attr('class', 'bar-label')
        .attr('x', d => xBar(d.label) + xBar.bandwidth() / 2)
        .attr('y', d => d.pct < 0 ? yBar(d.pct) + 14 : yBar(d.pct) - 6)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('fill', '#333')
        .text(d => `${d.pct > 0 ? '+' : ''}${d.pct.toFixed(1)}%`);

    // title
    barSvg.append('text')
        .attr('x', barWidth / 2)
        .attr('y', -20)
        .attr('text-anchor', 'middle')
        .style('font-size', '13px')
        .style('font-weight', 'bold')
        .text(`${country} — Avg. Emissions Change by Decade`);

    // y axis label
    barSvg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -barHeight / 2)
        .attr('y', -60)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .text('Avg. % change from 2000');
}

function resetSelection() {
    svg.selectAll('.cell').style('opacity', 1);
    lineSvg.selectAll('*').remove();

    // x scale
    const xLine = d3.scaleLinear()
        .domain([2000, 2023])
        .range([0, lineWidth]);

    // y scale (empty, just show axis)
    const yLine = d3.scaleLinear()
        .domain([0, 20])
        .range([lineHeight, 0]);

    // x axis
    lineSvg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${lineHeight})`)
        .call(d3.axisBottom(xLine).tickFormat(d3.format('d')).ticks(6));

    // y axis
    lineSvg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(yLine).ticks(5));

    // y axis label
    lineSvg.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -lineHeight / 2)
        .attr('y', -50)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .text('kg CO₂e per person');

    // placeholder text
    lineSvg.append('text')
        .attr('class', 'placeholder-text')
        .attr('x', lineWidth / 2)
        .attr('y', lineHeight / 2)
        .attr('text-anchor', 'middle')
        .style('fill', '#aaa')
        .style('font-size', '13px')
        .text('Click a country to see its emissions trend');

    // empty bar chart axes
    barSvg.selectAll('*').remove();

    const xBarEmpty = d3.scaleBand()
        .domain(['2000–2010', '2010–2020', '2021–2023'])
        .range([0, barWidth])
        .padding(0.3);

    const yBarEmpty = d3.scaleLinear()
        .domain([-30, 10])
        .range([barHeight, 0]);

    barSvg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${barHeight})`)
        .call(d3.axisBottom(xBarEmpty))
        .selectAll('text')
        .attr('dy', '1.5em');

    barSvg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(yBarEmpty)
            .ticks(5)
            .tickFormat(d => `${d > 0 ? '+' : ''}${d.toFixed(0)}%`));

    barSvg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -barHeight / 2)
        .attr('y', -60)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .text('Avg. % change from 2000');

    barSvg.append('text')
        .attr('x', barWidth / 2)
        .attr('y', barHeight / 2)
        .attr('text-anchor', 'middle')
        .style('fill', '#aaa')
        .style('font-size', '13px')
        .text('Click a country to see decade comparison');
}

// load csv and transform data
function init() {
    d3.csv('data/oecd_env_data.csv').then(raw => {
        console.log(raw); // debug

        // filter to european countries + OECD Europe reference
        const filtered = raw.filter(d =>
            europeanCountries.includes(d['Reference area']) ||
            d['Reference area'] === 'OECD Europe'
        );

        // build lookup: { country -> { year -> value } }
        lookup = {};
        filtered.forEach(d => {
            const country = d['Reference area'];
            const year = +d['TIME_PERIOD'];
            const value = +d['OBS_VALUE'];
            if (!lookup[country]) lookup[country] = {};
            lookup[country][year] = value;
        });

        // compute % change from 2000 baseline
        heatData = [];
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
        sortedCountries = [...europeanCountries].sort((a, b) => pct2023[a] - pct2023[b]);

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

        // make y-axis labels clickable
        svg.selectAll('.y-axis .tick')
            .style('cursor', 'pointer')
            .on('click', function (event, d) {
                svg.selectAll('.cell')
                    .style('opacity', c => c.country === d ? 1 : 0.4);

                drawLineChart(d);
            });

        // draw heatmap cells
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
            .style('cursor', 'pointer')
            .on('mouseover', function (event, d) {
                // highlight hovered row
                svg.selectAll('.cell')
                    .filter(c => c.country === d.country)
                    .style('stroke', '#333')
                    .style('stroke-width', '1px');

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
            .on('mouseout', function () {
                // remove row highlight
                svg.selectAll('.cell')
                    .style('stroke', 'none')
                    .style('stroke-width', '0');

                d3.select('#tooltip')
                    .transition().duration(20)
                    .style('opacity', 0)
                    .on('end', function () { d3.select(this).style('display', 'none'); });
            })
            .on('click', function (event, d) {
                // highlight selected row
                svg.selectAll('.cell')
                    .style('opacity', c => c.country === d.country ? 1 : 0.4);

                drawLineChart(d.country);
            });

        drawLegend(color);
        drawTitles();
        resetSelection();

    }).catch(error => console.error('Error loading data:', error));
}

window.addEventListener('load', init);
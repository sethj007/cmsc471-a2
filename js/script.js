// set up dimens. and margins
const margin = { top: 80, right: 60, bottom: 60, left: 100 };
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

// load csv and transform data
function init(){
    d3.csv('data/oecd_env_data.csv').then(raw => {

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
        const data = [];
        europeanCountries.forEach(country => {
            const baseline = lookup[country]?.[2000];
            if (!baseline) return;
            years.forEach(year => {
                const raw = lookup[country]?.[year];
                const pct = raw != null ? ((raw - baseline) / baseline) * 100 : null;
                data.push({ country, year, raw, pct });
            });
        });

        // sort countries by 2023 % change
        const pct2023 = {};
        europeanCountries.forEach(country => {
            const entry = data.find(d => d.country === country && d.year === 2023);
            pct2023[country] = entry?.pct ?? Infinity;
        });
        const sortedCountries = [...europeanCountries].sort((a, b) => pct2023[a] - pct2023[b]);

        drawHeatmap(data, sortedCountries);
    });
}

function drawHeatmap(data, sortedCountries) {
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
}

window.addEventListener('load', init);
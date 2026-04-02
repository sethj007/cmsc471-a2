// set up dimens. and margins
const margin = { top: 80, right: 60, bottom: 60, left: 100 };
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;
const marginLine = { top: 40, right: 60, bottom: 60, left: 100 };
const lineWidth = 800 - marginLine.left - marginLine.right;
const lineHeight = 300 - marginLine.top - marginLine.bottom;

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
function init(){}

window.addEventListener('load', init);
const svgWidth = 960
const svgHeight = 500

let margin = {
  top: 60,
  right: 40,
  bottom: 120,
  left: 100
}

let width = svgWidth - margin.left - margin.right
let height = svgHeight - margin.top - margin.bottom

let svg = d3
  .select("#scatter")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight)

let chartGroup = svg
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`)

// View selection - changing this triggers transition
let selectedXAxis = "poverty"
let selectedYAxis = "noHealthInsurance"

/**
 * Returns a updated scale based on the current selection.
 **/
function xScale(healthData, selectedXAxis) {
  let xLinearScale = d3
    .scaleLinear()
    .domain([
      d3.min(healthData.map(d => parseInt(d[selectedXAxis]))) * 0.8,
      d3.max(healthData.map(d => parseInt(d[selectedXAxis]))) * 1.2
    ])
    .range([0, width])
  return xLinearScale
}

/**
 * Returns a updated scale based on the current selection.
 **/
function yScale(healthData, selectedYAxis) {
  let yLinearScale = d3
    .scaleLinear()
    .domain([
      d3.min(healthData.map(d => parseInt(d[selectedYAxis]))) * 0.8,
      d3.max(healthData.map(d => parseInt(d[selectedYAxis]))) * 1.2
    ])
    .range([height, 0])
  return yLinearScale
}

/**
 * Returns and appends an updated x-axis based on a scale.
 **/
function renderXAxis(newXScale, xAxis) {
  let bottomAxis = d3.axisBottom(newXScale)
  xAxis
    .transition()
    .duration(1000)
    .call(bottomAxis)
  return xAxis
}

function renderYAxis(newYScale, yAxis) {
  var leftAxis = d3.axisLeft(newYScale);
  yAxis
    .transition()
    .duration(1000)
    .call(leftAxis);
  return yAxis;
}

/**
 * Returns and appends an updated circles group based on a new scale and the currect selection.
 **/
function renderCircles(circlesGroup, newXScale, selectedXAxis, newYScale, selectedYAxis) {
  circlesGroup
    .transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[selectedXAxis]))
    .attr('cy', d => newYScale(d[selectedYAxis]))
  return circlesGroup
}

function renderText(textGroup, newXScale, selectedXAxis, newYScale, selectedYAxis) {
  textGroup
    .transition()
    .duration(1000)
    .attr('x', d => newXScale(d[selectedXAxis]))
    .attr('y', d => newYScale(d[selectedYAxis]));
  return textGroup
}

;(function() {
  d3.csv("assets/data/data.csv").then(healthData => {
    let xLinearScale = xScale(healthData, selectedXAxis)
    let yLinearScale = yScale(healthData, selectedYAxis)

    let bottomAxis = d3.axisBottom(xLinearScale)

    let leftAxis = d3.axisLeft(yLinearScale)
    
    xAxis = chartGroup
      .append("g")
      .classed("x-axis", true)
      .attr("transform", `translate(0, ${height})`)
      .call(bottomAxis)

    yAxis = chartGroup.append('g')
      .classed('y-axis', true)
      .call(leftAxis);

    chartGroup.append("g").call(leftAxis)

    let circlesGroup = chartGroup
      .selectAll("circle")
      .data(healthData)
      .enter()
      .append("circle")
      .attr("cx", d => xLinearScale(d[selectedXAxis]))
      .attr("cy", d => yLinearScale(d[selectedYAxis]))
      .attr("r", 15)
      .attr("fill", "blue")
      .attr("opacity", ".6")

    let textGroup = chartGroup
      .append("text")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .selectAll("tspan")
      .data(healthData)
      .enter()
      .append("tspan")
      .attr("fill", "white")
      .attr("x", d => xLinearScale(d[selectedXAxis]))
      .attr("y", d => yLinearScale(d[selectedYAxis] - 0.2))
      .text(d => d.abbr)
      
     
    let xlabelsGroup = chartGroup
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height + 20})`)
    
    xlabelsGroup
      .append("text")
      .attr("x", 0)
      .attr("y", 20)
      .attr("value", "poverty")
      .classed("active", true)
      .text("In Poverty (%)")
    
    xlabelsGroup
      .append("text")
      .attr("x", 0)
      .attr("y", 40)
      .attr("value", "age")
      .classed("inactive", true)
      .text("Age (Median)")
    
    xlabelsGroup
      .append("text")
      .attr("x", 0)
      .attr("y", 60)
      .attr("value", "income")
      .classed("inactive", true)
      .text("Income (Median)")

    let ylabelsGroup = chartGroup
      .append("g")
      .attr("transform", `translate(${0 - margin.left / 4}, ${height / 2})`)
    
    ylabelsGroup
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", 0)
      .attr("y", 0 - 25)
      .attr("dy", "1em")
      .attr("value", "noHealthInsurance")
      .classed("axis-text", true)
      .classed("active", true)
      .text("Lacks Healhcare (%)")
    
    ylabelsGroup
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", 0)
      .attr("y", 0 - 50)
      .attr("dy", "1em")
      .attr("value", "smokes")
      .classed("axis-text", true)
      .classed("inactive", true)
      .text("Smokes (%)")
    
    ylabelsGroup
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", 0)
      .attr("y", 0 - 75)
      .attr("dy", "1em")
      .attr("value", "obesity")
      .classed("axis-text", true)
      .classed("inactive", true)
      .text("Obesity (%)")
    
    // Crate an event listener to call the update functions when a label is clicked
    xlabelsGroup.selectAll("text").on("click", function() {
      let value = d3.select(this).attr("value")

      xlabelsGroup.selectAll("text").attr("class", "inactive")
      d3.select(this).attr("class", "active")
      
      if (value !== selectedXAxis) {
        selectedXAxis = value
        xLinearScale = xScale(healthData, selectedXAxis)
        xAxis = renderXAxis(xLinearScale, xAxis)
        circlesGroup = renderCircles(circlesGroup, xLinearScale, selectedXAxis, yLinearScale, selectedYAxis)
        textGroup = renderText(textGroup, xLinearScale, selectedXAxis, yLinearScale, selectedYAxis);
      }
    }
    )

    ylabelsGroup.selectAll("text").on("click", function() {
      let value = d3.select(this).attr("value")

      ylabelsGroup.selectAll("text").attr("class", "inactive")
      d3.select(this).attr("class", "active")
      
      if (value !== selectedYAxis) {
        selectedYAxis = value
        yLinearScale = yScale(healthData, selectedYAxis)
        yAxis = renderYAxis(yLinearScale, yAxis)
        circlesGroup = renderCircles(circlesGroup, xLinearScale, selectedXAxis, yLinearScale, selectedYAxis)
        textGroup = renderText(textGroup, xLinearScale, selectedXAxis, yLinearScale, selectedYAxis);
      }
    }
    )

  }
  )
})()

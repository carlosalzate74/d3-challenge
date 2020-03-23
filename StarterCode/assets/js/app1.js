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
let currentSelection = "poverty"

/**
 * Returns a updated scale based on the current selection.
 **/
function xScale(healthData, currentSelection) {
  let xLinearScale = d3
    .scaleLinear()
    .domain([
      d3.min(healthData.map(d => parseInt(d[currentSelection]))) * 0.8,
      d3.max(healthData.map(d => parseInt(d[currentSelection]))) * 1.2
    ])
    .range([0, width])
  return xLinearScale
}

/**
 * Returns and appends an updated x-axis based on a scale.
 **/
function renderAxes(newXScale, xAxis) {
  let bottomAxis = d3.axisBottom(newXScale)
  xAxis
    .transition()
    .duration(1000)
    .call(bottomAxis)
  return xAxis
}

/**
 * Returns and appends an updated circles group based on a new scale and the currect selection.
 **/
function renderCircles(circlesGroup, newXScale, currentSelection) {
  circlesGroup
    .transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[currentSelection]))
  return circlesGroup
}
;(function() {
  d3.csv("assets/data/data.csv").then(healthData => {
    let xLinearScale = xScale(healthData, currentSelection)
    let yLinearScale = d3
      .scaleLinear()
      .domain([0, d3.max(healthData.map(d => parseInt(d.noHealthInsurance)))])
      .range([height, 0])
    let bottomAxis = d3.axisBottom(xLinearScale)

    let leftAxis = d3.axisLeft(yLinearScale)
    xAxis = chartGroup
      .append("g")
      .classed("x-axis", true)
      .attr("transform", `translate(0, ${height})`)
      .call(bottomAxis)
    chartGroup.append("g").call(leftAxis)
    let circlesGroup = chartGroup
      .selectAll("circle")
      .data(healthData)
      .enter()
      .append("circle")
      .attr("cx", d => xLinearScale(d[currentSelection]))
      .attr("cy", d => yLinearScale(d.noHealthInsurance))
      .attr("r", 10)
      .attr("fill", "blue")
      .attr("opacity", ".5")
    let labelsGroup = chartGroup
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height + 20})`)
    labelsGroup
      .append("text")
      .attr("x", 0)
      .attr("y", 20)
      .attr("value", "poverty")
      .classed("active", true)
      .text("In Poverty (%)")
    labelsGroup
      .append("text")
      .attr("x", 0)
      .attr("y", 45)
      .attr("value", "age")
      .classed("inactive", true)
      .text("Age (Median)")
    labelsGroup
      .append("text")
      .attr("x", 0)
      .attr("y", 70)
      .attr("value", "income")
      .classed("inactive", true)
      .text("Income (Median)")
    chartGroup
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y",25 - margin.left)
      .attr("x", 0 - height / 2)
      .attr("dy", "1em")
      .classed("axis-text", true)
      .classed("active", true)
      .text("Lacks Healhcare (%)")
    chartGroup
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - height / 2)
      .attr("dy", "1em")
      .classed("axis-text", true)
      .classed("inactive", true)
      .text("Smokes (%)")
    
    // Crate an event listener to call the update functions when a label is clicked
    labelsGroup.selectAll("text").on("click", function() {
      let value = d3.select(this).attr("value")
      labelsGroup.selectAll("text").attr("class", "inactive")
      d3.select(this).attr("class", "active")
      
      if (value !== currentSelection) {
        currentSelection = value
        xLinearScale = xScale(healthData, currentSelection)
        xAxis = renderAxes(xLinearScale, xAxis)
        circlesGroup = renderCircles(
          circlesGroup,
          xLinearScale,
          currentSelection
        )
      }
    }
    )
  }
  )
})()

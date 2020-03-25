  // svg size
  const svgWidth = 960
  const svgHeight = 500

  // chart margins
  let margin = {
    top: 60,
    right: 40,
    bottom: 120,
    left: 100
  }

  // Declaring global variables
  let width = svgWidth - margin.left - margin.right
  let height = svgHeight - margin.top - margin.bottom
  let svg
  let chartGroup
  let selectedXAxis
  let selectedYAxis
  let tooltipTitle

function reset(){
  d3.select("svg").remove()

  // Initial selections
  selectedXAxis = "poverty"
  selectedYAxis = "noHealthInsurance"

  // Create an svg object
  svg = d3
    .select("#scatter")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)

  // Create a chart group
  chartGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)
}

// Capitalize first letter of text
const capitalize = (s) => {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Create the X scale
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

// Create the Y scale
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

// Creates and updates X axis
function renderXAxis(newXScale, xAxis) {
  let bottomAxis = d3.axisBottom(newXScale)
  xAxis
    .transition()
    .duration(500)
    .call(bottomAxis)
  return xAxis
}

// Creates and updates Y axis
function renderYAxis(newYScale, yAxis) {
  let leftAxis = d3.axisLeft(newYScale);
  yAxis
    .transition()
    .duration(500)
    .call(leftAxis);
  return yAxis;
}

// Creates and updates circles
function renderCircles(circlesGroup, newXScale, selectedXAxis, newYScale, selectedYAxis) {
  circlesGroup
    .transition()
    .duration(500)
    .attr("cx", d => newXScale(d[selectedXAxis]))
    .attr('cy', d => newYScale(d[selectedYAxis]))
  return circlesGroup
}

// Creates and updates text within circles
function renderText(textGroup, newXScale, selectedXAxis, newYScale, selectedYAxis) {
  textGroup
    .transition()
    .duration(500)
    .attr('x', d => newXScale(d[selectedXAxis]))
    .attr('y', d => newYScale(d[selectedYAxis]));
  return textGroup
}

// Get the analysis text and title based on selected variables
function updateP(selectedXAxis, selectedYAxis){
  d3.select("#descTitle").text("Correlation discovered between " + capitalize(selectedXAxis) + 
                               " and " + capitalize(selectedYAxis))
  d3.json("assets/data/results.json").then (data =>  {
    selAxis = selectedXAxis.slice(0,3) + "_" + selectedYAxis.slice(0,3)

    data.forEach(el => {
      if(el.key == selAxis)
        d3.select("#descP").text(el.desc)
    })    
  })
}

// Creates an slider to select between state or region
d3.select("#slider").on("change", function(d){
  plot(this.value)
})

// Creates and updates the chart
const plot = function (aggr) {
  reset()
  d3.csv("assets/data/data.csv").then(data => {
    let healthData = ""

    // Aggregates data by region
    if (aggr == 1){
      aggrData = d3.nest()
        .key(d => d.region)
        .rollup(function(d) { 
          return {
            "region": d3.max(d, e => e.region),
            "poverty": d3.mean(d, e => +e.poverty),
            "age": d3.mean(d, e => +e.age ),
            "income": d3.sum(d, e => +e.income ),
            "noHealthInsurance": d3.mean(d, e => +e.noHealthInsurance ),
            "obesity": d3.mean(d, e => +e.obesity ),
            "smokes": d3.mean(d, e => +e.smokes )
            }
        }).entries(data);

        healthData = [];
        for (let i = 0, hd; i < aggrData.length; i++) 
          healthData.push(aggrData[i].value)
    }
    else
      healthData = data

    // Define scales and axes
    let xLinearScale = xScale(healthData, selectedXAxis)
    let yLinearScale = yScale(healthData, selectedYAxis)
    let bottomAxis = d3.axisBottom(xLinearScale)
    let leftAxis = d3.axisLeft(yLinearScale)

    // Add X axis to chart group
    xAxis = chartGroup
      .append("g")
      .classed("x-axis", true)
      .attr("transform", `translate(0, ${height})`)
      .call(bottomAxis)

    // Add Y axis to chart group
    yAxis = chartGroup
      .append('g')
      .classed('y-axis', true)
      .attr("transform", `translate(${margin.left - 100},0)`)
      .call(leftAxis);

    // Add div for tooltip
    let div = d3.select("body").append("div") 
      .attr("class", "tooltip")       
      .style("opacity", 0);

    // Function to control when to show the tooltip
    let mouseover = function(d) {    
      div.transition()       
          .style("opacity", .9);

      if (aggr == 0)
        tooltipTitle = d.state
      else
        tooltipTitle = d.region

      div .html("<strong>" + tooltipTitle + "</strong>" + "<br/>" + 
                capitalize(selectedXAxis) + ": " + parseFloat(d[selectedXAxis]).toFixed(1) + "<br/>" + 
                capitalize(selectedYAxis) + ": " + parseFloat(d[selectedYAxis]).toFixed(1))  
          .style("left", (d3.event.pageX) + "px")   
          .style("top", (d3.event.pageY - 28) + "px")  
      }

     let mouseout = function(d) {   
        div.transition()      
            .style("opacity", 0)
        }

    // Add circles to chart group
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
      .on("mouseover", mouseover)
      .on("mouseout", mouseout) 

    // Add text to circles and chart group
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
        .attr("y", d => yLinearScale(d[selectedYAxis]))
      .on("mouseover", mouseover)
      .on("mouseout", mouseout) 

      // If data is aggregated, use region field
      if (aggr == 0)
        textGroup.text(d => d.abbr)
      else
        textGroup.text(d => d.region.charAt(0))
      
    // Add lables for X axis
    let xlabelsGroup = chartGroup
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height + 20})`)

    // Label for poverty
    xlabelsGroup
      .append("text")
      .attr("x", 0)
      .attr("y", 20)
      .attr("value", "poverty")
      .classed("active", true)
      .text("In Poverty (%)")

    // Label for age
    xlabelsGroup
      .append("text")
      .attr("x", 0)
      .attr("y", 40)
      .attr("value", "age")
      .classed("inactive", true)
      .text("Age (Median)")

    // Label for income
    xlabelsGroup
      .append("text")
      .attr("x", 0)
      .attr("y", 60)
      .attr("value", "income")
      .classed("inactive", true)
      .text("Income (Median)")

    // Add lables for Y axis
    let ylabelsGroup = chartGroup
      .append("g")
      .attr("transform", `translate(${0 - margin.left / 4}, ${height / 2})`)

    // Label for health insurance
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

    // Label for smokes
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

    // Label for obesity
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
        textGroup = renderText(textGroup, xLinearScale, selectedXAxis, yLinearScale, selectedYAxis)
        updateP(selectedXAxis, selectedYAxis)
      }
    })

    // Crate an event listener to call the update functions when a label is clicked
    ylabelsGroup.selectAll("text").on("click", function() {
      let value = d3.select(this).attr("value")

      ylabelsGroup.selectAll("text").attr("class", "inactive")
      d3.select(this).attr("class", "active")
      
      if (value !== selectedYAxis) {
        selectedYAxis = value
        yLinearScale = yScale(healthData, selectedYAxis)
        yAxis = renderYAxis(yLinearScale, yAxis)
        circlesGroup = renderCircles(circlesGroup, xLinearScale, selectedXAxis, yLinearScale, selectedYAxis)
        textGroup = renderText(textGroup, xLinearScale, selectedXAxis, yLinearScale, selectedYAxis)
        updateP(selectedXAxis, selectedYAxis)
      }
    })
  })
}

window.onload = function() {
  plot(0)
  updateP(selectedXAxis, selectedYAxis)
}
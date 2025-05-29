const customTop5Colors = [
  "rgba(86, 22, 67, 1)",  // 1st 
  "rgba(91, 20, 61, 0.95)",  // 2nd 
  "rgba(96, 18, 55, 0.95)",  // 3rd
  "rgba(100, 17, 49, 0.95)",  // 4th 
  "rgba(105, 15, 43, 0.95)"   // 5th
];

export function createTreemap(data, container, amplificationFactor = 0.5) {
  const containerElement = d3.select(container).node();
  const containerRect = containerElement.getBoundingClientRect();
  const width = containerRect.width;
  const height = containerRect.height * 0.9 || width; // fallback

  const margin = { top: 20, right: 5, bottom: 20, left: 5 };

  const name = d => d.title;
  const value = d => d.weighted_rating;

  const format = d3.format(".2f");

  // Identify top 5 for coloring
  const sortedData = [...data].sort((a, b) => b.weighted_rating - a.weighted_rating);
  const top5Titles = sortedData.slice(0, 5).map(d => d.title);

  const color = d => {
      const index = top5Titles.indexOf(d.data.title);
      if (index !== -1) {
          return customTop5Colors[index];
      }
      return "rgba(110, 13, 37, 0.8)";
  };

  // Create hierarchy
  const root = d3.hierarchy({ children: data })
      .sum(d => {
          const rating = value(d);
          return Math.exp((rating / 2) * amplificationFactor);
      })
      .sort((a, b) => b.value - a.value);

  // Treemap layout
  const treemap = d3.treemap()
      .size([width - margin.left - margin.right, height - margin.top - margin.bottom])
      .padding(3);

  treemap(root);

  // Create SVG
  let svg = d3.select(`${container} svg`);
  if (svg.empty()) {
      svg = d3.select(container)
          .append("svg")
          .attr("width", width)
          .attr("height", height)
          .attr("viewBox", [0, 0, width, height])
          .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");
  } else {
      svg.selectAll("*").remove();
  }

  const chartGroup = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  const nodes = chartGroup.selectAll("g")
      .data(root.leaves())
      .join("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`);

  // Rectangles
  nodes.append("rect")
    .attr("fill", d => color(d))
    .attr("fill-opacity", 1)
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("stroke", "white")          
    .attr("stroke-width", 0.75) 
    .attr("rx", 10) 
    .attr("ry", 10)  
    .append("title")
    .text(d => `${name(d.data)}\nRating: ${format(value(d.data))}`);
  // Labels
  nodes.each(function(d) {
        const group = d3.select(this);
        const rectWidth = d.x1 - d.x0 - 8; // leave padding

        // Clear any existing labels
        group.selectAll("text").remove();

        // Title group
        const title = group.append("text")
            .attr("x", 4)
            .attr("y", 14)
            .attr("fill", "white")
            .style("font-family", "Waltograph")
            .style("font-size", "10px")
            .call(wrapText, rectWidth);
            

        // Measure how many tspans (lines) were added
        const lineCount = title.selectAll("tspan").size();

        // Adjust y based on line count
        const ratingY = 14 + lineCount * 12; // 12px line height approx

        // Rating text
        group.append("text")
            .attr("x", 4)
            .attr("y", ratingY)
            .attr("fill", "white")
            .attr("fill-opacity", 0.7)
            .style("font-family", "Waltograph")
            .style("font-size", "9px")
            .text(format(value(d.data)));
    });
    nodes.on("mouseover", function(event, d) {
      const group = d3.select(this);
      const rectWidth = d.x1 - d.x0;
      const rectHeight = d.y1 - d.y0;
  
      group.transition()
          .duration(200)
          .attr("transform", `translate(${d.x0 + rectWidth / 2}, ${d.y0 + rectHeight / 2}) scale(1.05) translate(${-rectWidth / 2}, ${-rectHeight / 2})`);
    })
    .on("mouseout", function(event, d) {
        const group = d3.select(this);
        group.transition()
            .duration(200)
            .attr("transform", `translate(${d.x0}, ${d.y0})`);
    });

}

export function createBarChart(data, container) {
    const topFive = data.slice(0, 5);
    
    const marginTop = 50;
    const marginRight = 0;
    const marginBottom = 10;
    const marginLeft = 30;
    const width = 928;
    const height = 300;
  
    // Create scales
    const x = d3.scaleLinear()
          .domain([0, d3.max(topFive, d => d.weighted_rating)])
          .range([marginLeft, width - marginRight]);
      
    const y = d3.scaleBand()
        .domain(topFive.map(d => d.title))
        .rangeRound([marginTop, height - marginBottom])
        .padding(0.1);
  
    // Select or create SVG
    let svg = d3.select(`${container} svg`);
    
    if (svg.empty()) {
      // First time creation
      svg = d3.select(container)
          .append("svg")
          .attr("width", width)
          .attr("height", height)
          .attr("viewBox", [0, 0, width, height])
          .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");
      
      // Create axes groups only once
      svg.append("g")
          .attr("class", "x-axis")
          .attr("transform", `translate(0,${marginTop})`);
      
      svg.append("g")
          .attr("class", "y-axis")
          .attr("transform", `translate(${marginLeft},0)`);
    }
  
    // Update axes
    svg.select(".x-axis")
      .transition()
      .duration(750)
      .call(d3.axisTop(x).ticks(width / 80))
      .call(g => g.select(".domain").remove());
    
    svg.select(".y-axis")
      .transition()
      .duration(750)
      .call(d3.axisLeft(y).tickSizeOuter(0));
  
    // Update or create rectangles
    const bars = svg.selectAll("rect")
      .data(topFive);
  
    // Remove extra bars
    bars.exit().remove();
  
    // Update existing bars
    bars.transition()
      .duration(750)
      .attr("x", x(0))
      .attr("y", d => y(d.title))
      .attr("width", d => x(d.weighted_rating) - x(0))
      .attr("height", y.bandwidth());
  
    // Add new bars
    bars.enter()
      .append("rect")
      .attr("fill", "steelblue")
      .attr("x", x(0))
      .attr("y", d => y(d.title))
      .attr("width", d => x(d.weighted_rating) - x(0))
      .attr("height", y.bandwidth());
  
    // Update or create text labels
    const labels = svg.selectAll("text.bar-label")
      .data(topFive);
  
    // Remove extra labels
    labels.exit().remove();
    
    // Update existing labels
    labels.transition()
      .duration(750)
      .attr("x", d => (x(d.weighted_rating) - x(0)) / 2)
      .attr("y", d => y(d.title) + y.bandwidth() / 2)
      .text(d => d.title);
    
    // Add new labels
    labels.enter()
      .append("text")
      .attr("class", "bar-label")
      .attr("fill", "white")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("x", d => (x(d.weighted_rating) - x(0)) / 2)
      .attr("y", d => y(d.title) + y.bandwidth() / 2)
      .text(d => d.title);
}


export function generateTween(data, container, maxVal = 10) {

  const containerElement = d3.select(container).node();
  const containerRect = containerElement.getBoundingClientRect();
  const width = containerRect.width;
  const height = containerRect.height * 0.85 || width; // fallback

  const margin = 10;

  // Compute the dimensions; the width is provided by Observable.
  const outerRadius = height / 2 - 10;
  const innerRadius = outerRadius * 0.75;

  // https://tauday.com/tau-manifesto
  const tau = 2 * Math.PI;

  // Create the SVG container, and apply a transform such that the origin is the
  // center of the canvas. This way, we don’t need to position arcs individually.
  let svg = d3.select(`${container} svg`);
  if (svg.empty()) {
      svg = d3.select(container)
          .append("svg")
          .attr("width", width)
          .attr("height", height)
          .attr("viewBox", [0, 0, width, height])
          .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");
  } else {
      svg.selectAll("*").remove();
  }

  const g = svg.append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  // An arc function with all values bound except the endAngle. So, to compute an
  // SVG path string for a given angle, we pass an object with an endAngle
  // property to the arc function, and it will return the corresponding string.
  const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .startAngle(0);

  // Add the background arc, from 0 to 100% (tau).
  const background = g.append("path")
        .datum({endAngle: tau})
        .style("fill", "#ddd")
        .attr("d", arc);

  // Add the foreground arc
  const foreground = g.append("path")
        .datum({endAngle: 0})
        .style("fill", "rgba(110, 13, 37, 1)")
        .attr("d", arc);

  
  // Add a text element in the center
  g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")  // Vertically center the text
      .style("font-family", "Waltograph")
      .style("font-size", "30px")
      .style("fill", "white")
      .text(`${data}/${maxVal}`);  // Initial text value

  // Function to update the arc based on a percentage (0 to 1)
  function updateArc(percent) {
    const targetAngle = percent * tau;
    foreground.transition()
        .duration(750)
        .attrTween("d", arcTween(targetAngle));

  }
  // Returns a tween for a transition’s "d" attribute, transitioning any selected
  // arcs from their current angle to the specified new angle.

  

  function arcTween(newAngle) {
    return function(d) {
      const interpolate = d3.interpolate(d.endAngle, newAngle);
      return function(t) {
        d.endAngle = interpolate(t);
        return arc(d);
      };
    };
  }
  updateArc(data/maxVal);

}


/*
This wrapText function was AI generated using chatGPT4,
then modified and fixed.
*/
function wrapText(text, widthAccessor) {
  text.each(function(d) {
      const width = typeof widthAccessor === "function" ? widthAccessor(d) : widthAccessor;
      
      console.log(width);
      let truncationLength;
      if (width < 80) {
          truncationLength = 10; 
      } else if (width < 120) {
          truncationLength = 40; 
      } else {
          truncationLength = 75; 
      }

      const title = (d && d.data && typeof d.data.title === 'string') ? d.data.title : '';

      const truncatedTitle = truncateText(title, truncationLength);  // Truncate safely
      const words = truncatedTitle.split(/\s+/).reverse();  // .split will now always work on a string

      let word;
      let line = [];
      let lineNumber = 0;
      const lineHeight = 1.1; // ems
      const y = d3.select(this).attr("y");
      const x = d3.select(this).attr("x");
      const dy = 0;

      const t = d3.select(this)
          .text(null)
          .attr("y", y)
          .attr("x", x);

      let tspan = t.append("tspan").attr("x", x).attr("y", y).attr("dy", `${dy}em`);

      while ((word = words.pop())) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
              line.pop();
              tspan.text(line.join(" "));
              line = [word];
              tspan = t.append("tspan")
                  .attr("x", x)
                  .attr("y", y)
                  .attr("dy", `${++lineNumber * lineHeight}em`)
                  .text(word);
          }
      }
  });
}


function truncateText(text, maxLength = 20) {
  if (typeof text !== 'string' || text.length === undefined) {
    return text; // or you could return an empty string '', or handle it another way
  }
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}
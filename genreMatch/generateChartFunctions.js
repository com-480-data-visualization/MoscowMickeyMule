function wrap(text, getWidth) {
  text.each(function() {
      const text = d3.select(this);
      const words = text.text().split(/\s+/).reverse();
      const lineHeight = 1.1; // ems
      const y = text.attr("y");
      const dy = parseFloat(text.attr("dy") || 0);
      
      let word;
      let line = [];
      let lineNumber = 0;
      let tspan = text.text(null)
          .append("tspan")
          .attr("x", 0)
          .attr("y", y)
          .attr("dy", dy + "em");
      
      const width = getWidth(text.datum());
      
      while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
              line.pop();
              tspan.text(line.join(" "));
              line = [word];
              tspan = text.append("tspan")
                  .attr("x", 0)
                  .attr("y", y)
                  .attr("dy", ++lineNumber * lineHeight + dy + "em")
                  .text(word);
          }
      }
  });
}

export function createBubbleChart(data, container) {
    const containerElement = d3.select(container).node();
    const containerRect = containerElement.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height * 0.9|| width; // fallback to width if height not set
    const margin = 20;



    const name = d => d.title;
    const group = d => d.genres[0]; // Using first genre as group
    const value = d => d.weighted_rating;
    
    // Specify format for values
    const format = d3.format(".2f"); // Changed to show 2 decimal places for ratings

    // Create a categorical color scale
    const color = d3.scaleOrdinal(d3.schemeTableau10);

    // Create the pack layout
    const pack = d3.pack()
        .size([width - margin * 2, height - margin * 2])
        .padding(3);

    // Create hierarchy from the data
    const root = pack(d3.hierarchy({children: data})
        .sum(d => value(d)));

    // Select or create SVG
    let svg = d3.select(`${container} svg`);
    
    if (svg.empty()) {
        svg = d3.select(container)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-margin, -margin, width, height])
            .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;")
            .attr("text-anchor", "middle");
    }

    // Place each node
    const node = svg.append("g")
        .selectAll("g")
        .data(root.leaves())
        .join("g")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    // Add title
    node.append("title")
        .text(d => `${name(d.data)}\nRating: ${format(value(d.data))}`);

    // Add circles
    node.append("circle")
        .attr("fill-opacity", 0.7)
        .attr("fill", d => color(group(d.data)))
        .attr("r", d => d.r);

    // Add labels
    const text = node.append("text")
    .attr("clip-path", d => `circle(${d.r})`);

    // Add a tspan for each CamelCase-separated word.
    text.append("tspan")
    .attr("x", 0)
    .attr("y", 0)
    .attr("dy", "-0.5em")
    .style("font-size", d => Math.min(d.r / 3, 12) + "px")
    .text(d => name(d.data))
    .call(wrap, d => d.r * 1.8); // Width based on circle radius

    // Add rating below wrapped title
    text.append("tspan")
        .attr("x", 0)
        .attr("dy", "1.2em")
        .attr("fill-opacity", 0.7)
        .style("font-size", d => Math.min(d.r / 4, 10) + "px")
        .text(d => format(value(d.data)));

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
document.addEventListener("DOMContentLoaded", function () {
  const width = 960,
    height = 500;
  const svg = d3
    .select("#world-map")
    .attr("width", width)
    .attr("height", height);
  const tooltip = d3.select("#tooltip");
  const projection = d3
    .geoNaturalEarth1()
    .scale(160)
    .translate([width / 2, height / 2]);
  const path = d3.geoPath().projection(projection);
  const g = svg.append("g");

  let activeLayer = "studios";
  let globalStudios, globalMovies, globalWorld;

  svg
    .call(d3.zoom().on("zoom", (e) => g.attr("transform", e.transform)))
    .on("wheel.zoom", null);

  Promise.all([
    d3.json(
      "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
    ),
    d3.csv("data/studios_with_coords.csv"),
    d3.csv("data/movie_countries.csv"),
  ]).then(([world, studios, movies]) => {
    globalWorld = world;
    globalStudios = studios.map((d) => ({ ...d, Founded: +d.Founded }));
    globalMovies = movies.map((d) => ({
      ...d,
      MovieCount: +d.MovieCount,
      lat: +d.lat,
      lon: +d.lon,
      Year: +d.Year,
      MovieList: d.MovieList.split(", "),
    }));

    const minYear = Math.min(
      d3.min(globalStudios, (d) => d.Founded),
      d3.min(globalMovies, (d) => d.Year)
    );
    const maxYear = Math.max(
      d3.max(globalStudios, (d) => d.Founded),
      d3.max(globalMovies, (d) => d.Year)
    );

    drawMap(globalWorld);
    drawDots(globalStudios, maxYear);
    createSlider(minYear, maxYear);
    addZoomControls();
    addLayerToggle();
  });
  
  function drawMap(world) {
    g.selectAll("path")
      .data(world.features)
      .join("path")
      .attr("d", path)
      .attr("fill", "#f1f1f1")
      .attr("stroke", "#aaa")
      .on("click", (_, d) => showCountryDetails(d.properties.name));
  }

  function drawDots(data, year) {
    const filtered = data.filter((d) => d.Founded <= year);
    const dots = g.selectAll(".studio-dot").data(filtered, (d) => d.Studio);

    dots
  .join("circle")
  .attr("class", "studio-dot")
  .attr("cx", (d) => projection([+d.lon, +d.lat])[0])
  .attr("cy", (d) => projection([+d.lon, +d.lat])[1])
  .attr("r", 4)
  .attr("fill", "rgba(110, 13, 37, 1)")
  .attr("opacity", 0.75)
  .on("mouseover", (event, d) => {
    tooltip
      .html(`
        <strong>Studio:</strong> ${d.Studio}<br>
        <strong>Country:</strong> ${d.Country}<br>
        <strong>Founded:</strong> ${d.Founded}
      `)
      .style("opacity", 1)
      .style("left", (event.pageX + 10) + "px")  // 10px offset right
      .style("top", (event.pageY + 10) + "px"); // 10px offset down
  })
  .on("mousemove", (event) => {
    tooltip
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY + 10) + "px");
  })
  .on("mouseout", () => {
    tooltip.style("opacity", 0);
  });
  }

  function drawBubbles(data, year) {
    const aggregated = {};
    data
      .filter((d) => d.Year <= year)
      .forEach((d) => {
        if (!aggregated[d.Country])
          aggregated[d.Country] = {
            MovieCount: 0,
            lat: d.lat,
            lon: d.lon,
            movies: [],
          };
        aggregated[d.Country].MovieCount += d.MovieCount;
        aggregated[d.Country].movies.push(...d.MovieList);
      });

    const radiusScale = d3
      .scaleLog()
      .domain([1, d3.max(Object.values(aggregated), (d) => d.MovieCount)])
      .range([2, 20]);

    const bubbles = g
      .selectAll(".movie-bubble")
      .data(Object.entries(aggregated));

    let tooltipVisible = false;

    let mouseOverCircle = false;
    let mouseOverTooltip = false;

    bubbles
      .join("circle")
      .attr("class", "movie-bubble")
      .attr("cx", (d) => projection([d[1].lon, d[1].lat])[0])
      .attr("cy", (d) => projection([d[1].lon, d[1].lat])[1])
      .attr("r", (d) => radiusScale(d[1].MovieCount))
      .attr("fill", "rgba(110, 13, 37, 1)")
      .attr("opacity", 0.6)
      .on("mouseenter", (event, d) => {
        mouseOverCircle = true;

        tooltip
          .html(`
            <strong>Country:</strong> ${d[0]}<br>
            <strong>Movies (${d[1].MovieCount}):</strong>
            <ul>${d[1].movies.map((m) => `<li>${m}</li>`).join("")}</ul>
          `)
          .style("opacity", 1)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY + 10) + "px")
          .style("pointer-events", "auto"); // ensure tooltip can capture mouse
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", (event.pageX - 1) + "px")
          .style("top", (event.pageY - 1 ) + "px");
      })
      .on("mouseleave", () => {
        mouseOverCircle = false;
        setTimeout(() => {
          if (!mouseOverCircle && !mouseOverTooltip) {
            tooltip.style("opacity", 0).style("pointer-events", "none");
          }
        }, 100); // small delay to allow mouse to enter tooltip
      });

    tooltip
      .on("mouseenter", () => {
        mouseOverTooltip = true;
      })
      .on("mouseleave", () => {
        mouseOverTooltip = false;
        setTimeout(() => {
          if (!mouseOverCircle && !mouseOverTooltip) {
            tooltip.style("opacity", 0).style("pointer-events", "none");
          }
        }, 100);
      });
  }

  function createSlider(min, max) {
    const container = d3.select("#slider");
    const label = container
      .append("div")
      .attr("id", "sliderLabel")
      .style("color", "white")
      .text(`Year: ${max}`);

    container
      .append("input")
      .attr("type", "range")
      .attr("min", min)
      .attr("max", max)
      .attr("value", max)
      .attr("id", "yearSlider")
      .style("width", "600px")
      .on("input", function () {
        const year = +this.value;
        label.text(`Year: ${year}`);
        activeLayer === "studios"
          ? drawDots(globalStudios, year)
          : drawBubbles(globalMovies, year);
      });
  }

  const zoomBehavior = d3.zoom()
      .scaleExtent([0.5, 10])  // optional: limits for zoom scale
      .on("zoom", (event) => {
        g.attr("transform", event.transform);  // apply zoom/pan transform to your main group
      });

  svg.call(zoomBehavior);  // attach zoom behavior once

  function addZoomControls() {
    d3.select("#zoom-in-btn").on("click", () => zoomBy(1.2));
    d3.select("#zoom-out-btn").on("click", () => zoomBy(0.8));
  }

  function zoomBy(factor) {
    // Use the existing zoomBehavior and call scaleBy on svg
    svg.transition()
      .duration(300)
      .call(zoomBehavior.scaleBy, factor);
  }

    // Call this on initialization
  addZoomControls();

  function addLayerToggle() {
    const movieButton = d3.select("#movie-layer-btn");
    const studioButton = d3.select("#studio-layer-btn");
  
    movieButton.on("click", () => setLayer("movies"));
    studioButton.on("click", () => setLayer("studios"));
  
    // Optional: Initialize with a default active layer
    setLayer("movies");  // Or whichever layer you prefer
  }
  
  function setLayer(layer) {
    activeLayer = layer;
    if(!globalWorld) {return;}
    g.selectAll("circle").remove();
    drawMap(globalWorld);
    const year = +d3.select("#yearSlider").node().value;
    if (layer === "studios") {
      drawDots(globalStudios, year);
    } else {
      drawBubbles(globalMovies, year);
    }
  
    // 🔥 Toggle 'active' class on buttons
    d3.select("#movie-layer-btn").classed("active", layer === "movies");
    d3.select("#studio-layer-btn").classed("active", layer === "studios");
  }
  
  // Call this when initializing
  addLayerToggle();

  function showCountryDetails(country) {
    const movies = globalMovies.filter((m) => m.Country === country);
    tooltip
      .html(
        `
      <div style="font-family:'MouseMemoirs';max-height:150px;overflow:auto;">
        <strong>${country}</strong><br>Movies (${movies.length}):
        <ul>${movies
          .map((m) => `<li>${m.MovieList.join(", ")}</li>`)
          .join("")}</ul>
      </div>`
      )
      .style("opacity", 1);
  }
});

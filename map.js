document.addEventListener("DOMContentLoaded", function () {
  const width = 960;
  const height = 500;

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

  // Disable scroll zoom, use buttons instead
  let zoom = d3.zoom().on("zoom", function (event) {
    g.attr("transform", event.transform);
  });
  svg.call(zoom).on("wheel.zoom", null); // Disable scroll zoom

  // Load both world map and studio data
  Promise.all([
    d3.json(
      "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
    ),
    d3.csv("data/studios_with_coords.csv"),
  ])
    .then(([world, studios]) => {
      studios.forEach((d) => (d.Founded = +d.Founded));

      const minYear = d3.min(studios, (d) => d.Founded);
      const maxYear = d3.max(studios, (d) => d.Founded);

      drawMap(world);
      drawDots(studios, maxYear);
      createSlider(minYear, maxYear, studios);
    })
    .catch((error) => {
      console.error("Error loading data:", error);
    });

  function drawMap(world) {
    g.selectAll("path")
      .data(world.features)
      .join("path")
      .attr("d", path)
      .attr("fill", "#f1f1f1")
      .attr("stroke", "#ccc");
  }

  function drawDots(data, year) {
    const filtered = data.filter((d) => d.Founded <= year);

    const dots = g.selectAll("circle").data(filtered, (d) => d.Studio);

    dots
      .enter()
      .append("circle")
      .attr("cx", (d) => projection([+d.lon, +d.lat])[0])
      .attr("cy", (d) => projection([+d.lon, +d.lat])[1])
      .attr("r", 4)
      .attr("fill", "#ff5722")
      .attr("stroke", "#000")
      .attr("stroke-width", 0.2)
      .attr("opacity", 0.75)
      .on("mouseover", (event, d) => {
        tooltip
          .html(
            `<strong>${d.Studio}</strong><br>${d.Country}<br>Founded: ${d.Founded}`
          )
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`)
          .style("opacity", 1);
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });

    dots.exit().remove();
  }

  function createSlider(minYear, maxYear, data) {
    const mapSection = d3.select("#map");

    const label = mapSection
      .append("div")
      .attr("id", "sliderLabel")
      .style("text-align", "center")
      .style("color", "white")
      .style("margin-bottom", "6px")
      .text(`Showing studios founded up to: ${maxYear}`);

    mapSection
      .append("input")
      .attr("type", "range")
      .attr("min", minYear)
      .attr("max", maxYear)
      .attr("value", maxYear)
      .attr("id", "yearSlider")
      .style("width", "300px")
      .style("display", "block")
      .style("margin", "auto")
      .on("input", function () {
        const year = +this.value;
        label.text(`Showing studios founded up to: ${year}`);
        drawDots(data, year);
      });
  }

  // Zoom buttons
  d3.select("#map").append("div").attr("id", "zoom-controls").html(`
    <div style="text-align:center; margin-top: 10px;">
      <button id="zoom-in">Zoom In</button>
      <button id="zoom-out">Zoom Out</button>
    </div>
  `);

  let currentZoom = d3.zoomIdentity;

  d3.select("#zoom-in").on("click", () => {
    currentZoom = currentZoom.scale(1.2);
    svg.transition().duration(300).call(zoom.transform, currentZoom);
  });

  d3.select("#zoom-out").on("click", () => {
    currentZoom = currentZoom.scale(0.8);
    svg.transition().duration(300).call(zoom.transform, currentZoom);
  });
});

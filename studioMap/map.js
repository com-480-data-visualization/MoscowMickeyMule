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
      .attr("fill", "#ff5722")
      .attr("opacity", 0.75)
      .on("click", (_, d) => {
        tooltip
          .html(
            `
            <div
              style="
                font-family: 'MouseMemoirs', cursive;
                max-height: 150px;
                overflow: auto;
                z-index: 1000;
                position: absolute;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background-color: white;
                padding: 10px;
                border-radius: 8px;
                border: 2px solid #000;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
              "
            >            
            <strong>Studio:</strong> ${d.Studio}<br>
            <strong>Country:</strong> ${d.Country}<br>
            <strong>Founded:</strong> ${d.Founded}
          </div>`
          )
          .style("opacity", 1);
      })
      .on("mouseout", () => tooltip.style("opacity", 0));
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

    bubbles
      .join("circle")
      .attr("class", "movie-bubble")
      .attr("cx", (d) => projection([d[1].lon, d[1].lat])[0])
      .attr("cy", (d) => projection([d[1].lon, d[1].lat])[1])
      .attr("r", (d) => radiusScale(d[1].MovieCount))
      .attr("fill", "#d32f2f")
      .attr("opacity", 0.6)
      .on("click", (_, d) => {
        tooltip
          .html(
            `
            <div
              style="
                font-family: 'MouseMemoirs', cursive;
                max-height: 150px;
                overflow: auto;
                z-index: 1000;
                position: absolute;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background-color: white;
                padding: 10px;
                border-radius: 8px;
                border: 2px solid #000;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
              "
            >           
            <strong>Country:</strong> ${d[0]}<br>
            <strong>Movies (${d[1].MovieCount}):</strong>
            <ul>${d[1].movies.map((m) => `<li>${m}</li>`).join("")}</ul>
          </div>`
          )
          .style("opacity", 1);
      })
      .on("mouseout", () => tooltip.style("opacity", 0));
  }

  function createSlider(min, max) {
    const container = d3.select("#map-container > div[style]");
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
      .style("width", "300px")
      .on("input", function () {
        const year = +this.value;
        label.text(`Year: ${year}`);
        activeLayer === "studios"
          ? drawDots(globalStudios, year)
          : drawBubbles(globalMovies, year);
      });
  }

  function addZoomControls() {
    const controls = d3
      .select("#map-container > div[style]")
      .append("div")
      .style("display", "flex")
      .style("justify-content", "center");
    controls.html(`
      <button style="padding:10px;font-size:20px;background:#6A1B9A;color:white;border-radius:8px;font-family:'MouseMemoirs';" onclick="zoom(1.2)">🔍 Zoom In</button>
      <button style="padding:10px;font-size:20px;background:#6A1B9A;color:white;border-radius:8px;font-family:'MouseMemoirs';" onclick="zoom(0.8)">🔎 Zoom Out</button>`);
    window.zoom = (factor) =>
      svg.transition().duration(300).call(d3.zoom().scaleBy, factor);
  }

  function addLayerToggle() {
    const container = d3
      .select("#layer-toggle")
      .style("display", "flex")
      .style("gap", "16px");
    container.html(`
      <button style="font-family:'MouseMemoirs';font-size:24px;padding:8px;" onclick="setLayer('movies')">🔥 Movie Layer</button>
      <button style="font-family:'MouseMemoirs';font-size:24px;padding:8px;" onclick="setLayer('studios')">🎯 Studio Layer</button>`);
    window.setLayer = (layer) => {
      activeLayer = layer;
      g.selectAll("circle").remove();
      drawMap(globalWorld);
      const year = +d3.select("#yearSlider").node().value;
      layer === "studios"
        ? drawDots(globalStudios, year)
        : drawBubbles(globalMovies, year);
    };
  }

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

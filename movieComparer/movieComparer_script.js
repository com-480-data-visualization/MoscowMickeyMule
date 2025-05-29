// Disney-Themed Movie Comparer Script
console.log("Disney-themed movie comparer loaded!");

let allMovies = [];
let filteredMovies = [];
let selectedMovies = { movie1: null, movie2: null };

// Load and initialize the application
d3.csv("movieComparer/movieComparer_df.csv").then(data => {
    console.log("CSV loaded successfully!");
    console.log("Number of movies:", data.length);
    
    // Clean and process the data
    allMovies = data.map(d => ({
        title: d.title,
        vote_average: +d.vote_average || 0,
        revenue: +d.revenue || 0,
        runtime: +d.runtime || 0,
        budget: +d.budget || 0,
        release_date: d.release_date,
        release_year: new Date(d.release_date).getFullYear() || 0,
        genres: d.genres ? d.genres.split(', ') : [],
        genres_string: d.genres || ""
    })).filter(d => d.title && d.vote_average > 0); // Filter out movies with no title or rating
    
    filteredMovies = [...allMovies];
    
    console.log("Processed movies:", allMovies.length);
    
    // Initialize the interface
    createInterface();
    displayMovieResults(filteredMovies.slice(0, 20)); // Show first 20 movies
    
}).catch(error => {
    console.error("Error loading CSV:", error);
    
    // Fallback to sample data for testing
    console.log("Loading sample data for testing...");
    initializeWithSampleData();
});

// Sample movie data for testing
function initializeWithSampleData() {
    const sampleMovies = [
        {
            title: "The Lion King",
            vote_average: 8.5,
            revenue: 968483777,
            runtime: 88,
            budget: 45000000,
            release_date: "1994-06-24",
            release_year: 1994,
            genres: ["Animation", "Family", "Drama"],
            genres_string: "Animation, Family, Drama"
        },
        {
            title: "Frozen",
            vote_average: 7.3,
            revenue: 1280802282,
            runtime: 102,
            budget: 150000000,
            release_date: "2013-11-27",
            release_year: 2013,
            genres: ["Animation", "Family", "Adventure"],
            genres_string: "Animation, Family, Adventure"
        },
        {
            title: "Toy Story",
            vote_average: 8.3,
            revenue: 373554033,
            runtime: 81,
            budget: 30000000,
            release_date: "1995-10-30",
            release_year: 1995,
            genres: ["Animation", "Family", "Comedy"],
            genres_string: "Animation, Family, Comedy"
        },
        {
            title: "Finding Nemo",
            vote_average: 8.2,
            revenue: 940335536,
            runtime: 100,
            budget: 94000000,
            release_date: "2003-05-30",
            release_year: 2003,
            genres: ["Animation", "Family", "Adventure"],
            genres_string: "Animation, Family, Adventure"
        },
        {
            title: "Moana",
            vote_average: 7.6,
            revenue: 645949557,
            runtime: 107,
            budget: 150000000,
            release_date: "2016-11-23",
            release_year: 2016,
            genres: ["Animation", "Family", "Adventure"],
            genres_string: "Animation, Family, Adventure"
        },
        {
            title: "Spirited Away",
            vote_average: 8.6,
            revenue: 347789370,
            runtime: 125,
            budget: 19000000,
            release_date: "2001-07-20",
            release_year: 2001,
            genres: ["Animation", "Family", "Supernatural"],
            genres_string: "Animation, Family, Supernatural"
        },
        {
            title: "Coco",
            vote_average: 8.4,
            revenue: 807825881,
            runtime: 105,
            budget: 175000000,
            release_date: "2017-10-27",
            release_year: 2017,
            genres: ["Animation", "Family", "Music"],
            genres_string: "Animation, Family, Music"
        },
        {
            title: "Inside Out",
            vote_average: 8.1,
            revenue: 858846029,
            runtime: 95,
            budget: 175000000,
            release_date: "2015-06-19",
            release_year: 2015,
            genres: ["Animation", "Family", "Comedy"],
            genres_string: "Animation, Family, Comedy"
        }
    ];
    
    allMovies = [...sampleMovies];
    filteredMovies = [...allMovies];
    
    createInterface();
    displayMovieResults(filteredMovies);
}

function createInterface() {
    // Clear existing content
    d3.select("#compare").selectAll("*:not(h1)").remove();
    
    // Main container
    const container = d3.select("#compare")
        .append("div")
        .attr("id", "container");
    
    // Left panel - Movie Finder
    const leftPanel = container.append("div")
        .attr("class", "column");
    
    // Search controls
    leftPanel.append("h3")
        .attr("class", "column-title")
        .text("🔍 Movie Finder");
    
    // Search input
    leftPanel.append("input")
        .attr("type", "text")
        .attr("id", "movie-search")
        .attr("placeholder", "Search movies...")
        .on("input", handleSearch);
    
    // Filters container
    const filtersDiv = leftPanel.append("div")
        .style("margin-bottom", "15px");
    
    // Genre filter
    const genreSelect = filtersDiv.append("select")
        .attr("id", "genre-filter")
        .on("change", handleSearch);
    
    genreSelect.append("option").attr("value", "").text("All Genres");
    const genres = [...new Set(allMovies.flatMap(d => d.genres))].sort();
    genres.forEach(genre => {
        genreSelect.append("option").attr("value", genre).text(genre);
    });
    
    // Year filter
    const yearSelect = filtersDiv.append("select")
        .attr("id", "year-filter")
        .on("change", handleSearch);
    
    yearSelect.append("option").attr("value", "").text("All Years");
    const years = [...new Set(allMovies.map(d => d.release_year))].filter(y => y > 0).sort((a,b) => b-a);
    years.forEach(year => {
        yearSelect.append("option").attr("value", year).text(year);
    });
    
    // Results container
    leftPanel.append("div")
        .attr("id", "movie-results");
    
    // Right panel - Comparison
    const rightPanel = container.append("div")
        .attr("id", "display-column");
    
    rightPanel.append("h3")
        .style("font-size", "25px")
        .style("margin-top", "0px")
        .text("🎬 Movie Battle Arena");

    // Movie slots
    const slotsContainer = rightPanel.append("div")
        .attr("class", "slots-container");
    
    // Movie 1 slot
    slotsContainer.append("div")
        .attr("id", "movie-slot-1")
        .attr("class", "movie-slot")
        .text("Click a movie to add here");
    
    // Movie 2 slot
    slotsContainer.append("div")
        .attr("id", "movie-slot-2")
        .attr("class", "movie-slot")
        .text("Click a movie to add here");
    
    // Comparison chart container
    rightPanel.append("div")
        .attr("id", "comparison-chart")
        // .text("Select two movies to see their epic battle!");
}

function handleSearch() {
    const searchTerm = d3.select("#movie-search").property("value").toLowerCase();
    const selectedGenre = d3.select("#genre-filter").property("value");
    const selectedYear = d3.select("#year-filter").property("value");
    
    filteredMovies = allMovies.filter(movie => {
        const matchesSearch = movie.title.toLowerCase().includes(searchTerm);
        const matchesGenre = !selectedGenre || movie.genres.includes(selectedGenre);
        const matchesYear = !selectedYear || movie.release_year == selectedYear;
        
        return matchesSearch && matchesGenre && matchesYear;
    });
    
    displayMovieResults(filteredMovies.slice(0, 20));
}

function displayMovieResults(movies) {
    const resultsContainer = d3.select("#movie-results");
    resultsContainer.selectAll("*").remove();
    
    if (movies.length === 0) {
        resultsContainer.append("p")
            .text("No movies found")
            .style("color", "white")
            .style("text-align", "center")
            .style("font-family", "Waltograph, Arial, sans-serif");
        return;
    }
    
    const movieCards = resultsContainer.selectAll(".movie-card")
        .data(movies)
        .enter()
        .append("div")
        .attr("class", "movie-card")
        .on("click", function(event, d) {
            selectMovie(d);
        });
    
    movieCards.append("div")
        .attr("class", "movie-title")
        .text(d => d.title);
    
    movieCards.append("div")
        .attr("class", "movie-details")
        .text(d => `${d.release_year} • ⭐ ${d.vote_average.toFixed(1)} • ${d.genres.slice(0, 2).join(", ")}`);
}

function selectMovie(movie) {
    if (!selectedMovies.movie1) {
        selectedMovies.movie1 = movie;
        updateMovieSlot("movie-slot-1", movie);
    } else if (!selectedMovies.movie2) {
        selectedMovies.movie2 = movie;
        updateMovieSlot("movie-slot-2", movie);
    } else {
        // Replace movie1 with new selection
        selectedMovies.movie1 = movie;
        updateMovieSlot("movie-slot-1", movie);
        // Clear movie2 slot
        selectedMovies.movie2 = null;
        clearMovieSlot("movie-slot-2");
    }
    
    if (selectedMovies.movie1 && selectedMovies.movie2) {
        createComparison();
    } else {
        clearComparison();
    }
}

function updateMovieSlot(slotId, movie) {
    const slot = d3.select(`#${slotId}`);
    slot.selectAll("*").remove();
    
    slot.classed("filled", true);
    
    slot.append("div")
        .attr("class", "slot-title")
        .text(movie.title.length > 20 ? movie.title.substring(0, 20) + "..." : movie.title);
    
    slot.append("div")
        .attr("class", "slot-details")
        .text(`${movie.release_year} • ⭐ ${movie.vote_average.toFixed(1)}`);
    
    // Add clear button
    slot.append("button")
        .attr("class", "clear-button")
        .text("×")
        .on("click", function(event) {
            event.stopPropagation();
            clearMovieSlot(slotId);
        });
}

function clearMovieSlot(slotId) {
    if (slotId === "movie-slot-1") {
        selectedMovies.movie1 = null;
    } else {
        selectedMovies.movie2 = null;
    }
    
    const slot = d3.select(`#${slotId}`);
    slot.selectAll("*").remove();
    slot.classed("filled", false);
    slot.text("Click a movie to add here");
    
    // Update comparison
    if (selectedMovies.movie1 && selectedMovies.movie2) {
        createComparison();
    } else {
        clearComparison();
    }
}

function clearComparison() {
    d3.select("#comparison-chart")
        .selectAll("*").remove();
    
    d3.select("#comparison-chart")
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "center")
}

// In your movieComparer_script.js file, find the createComparison() function
// and replace the "Chart dimensions" section with this:

function createComparison() {
    const movie1 = selectedMovies.movie1;
    const movie2 = selectedMovies.movie2;
    
    if (!movie1 || !movie2) return;
    
    const chartContainer = d3.select("#comparison-chart");
    chartContainer.selectAll("*").remove();
    chartContainer.style("display", "block");
    
    // Add chart title
    chartContainer.append("div")
        .attr("class", "chart-title")
        .text("⚔️ Movie Battle Results ⚔️");
    
    // ADD LEGEND HERE - BEFORE THE CHART
    const legend = chartContainer.append("div")
        .attr("class", "comparison-legend")
        .style("margin-bottom", "20px")  // Space below legend
        .style("margin-top", "10px");    // Space above legend
    
    const legend1 = legend.append("div")
        .attr("class", "legend-item");
    
    legend1.append("div")
        .attr("class", "legend-color")
        .style("background", "rgba(86, 22, 67, 1)");
    
    legend1.append("span")
        .text(movie1.title.length > 15 ? movie1.title.substring(0, 15) + "..." : movie1.title);
    
    const legend2 = legend.append("div")
        .attr("class", "legend-item");
    
    legend2.append("div")
        .attr("class", "legend-color")
        .style("background", "rgba(110, 13, 37, 1)");
    
    legend2.append("span")
        .text(movie2.title.length > 15 ? movie2.title.substring(0, 15) + "..." : movie2.title);
    
    // Prepare comparison data
    const metrics = [
        { name: "Rating", value1: movie1.vote_average, value2: movie2.vote_average, max: 10, unit: "/10" },
        { name: "Revenue", value1: movie1.revenue / 1000000, value2: movie2.revenue / 1000000, max: Math.max(movie1.revenue, movie2.revenue) / 1000000 || 1000, unit: "M$" },
        { name: "Runtime", value1: movie1.runtime, value2: movie2.runtime, max: Math.max(movie1.runtime, movie2.runtime) || 200, unit: "min" },
        { name: "Budget", value1: movie1.budget / 1000000, value2: movie2.budget / 1000000, max: Math.max(movie1.budget, movie2.budget) / 1000000 || 200, unit: "M$" }
    ];
    
    // Chart dimensions
    const margin = { top: 60, right: 80, bottom: 60, left: 100 };  // Reduced top margin since legend is above
    const width = 800 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;  // Slightly reduced height
    
    // Create SVG
    const svg = chartContainer.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("background", "rgba(255, 255, 255, 0.05)")
        .style("border-radius", "0px");
    
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Scales
    const yScale = d3.scaleBand()
        .domain(metrics.map(d => d.name))
        .range([0, height])
        .padding(0.4);
    
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(metrics, d => Math.max(d.value1, d.value2))])
        .range([0, width]);
    
    // Create groups for each metric
    const metricGroups = g.selectAll(".metric-group")
        .data(metrics)
        .enter().append("g")
        .attr("class", "metric-group")
        .attr("transform", d => `translate(0,${yScale(d.name)})`);
    
    // Movie 1 bars
    metricGroups.append("rect")
        .attr("class", "bar-movie1")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 0)
        .attr("height", yScale.bandwidth() / 2.5)
        .attr("fill", "rgba(86, 22, 67, 1)")
        .attr("rx", 4)
        .transition()
        .duration(1000)
        .attr("width", d => xScale(d.value1));
    
    // Movie 2 bars
    metricGroups.append("rect")
        .attr("class", "bar-movie2")
        .attr("x", 0)
        .attr("y", yScale.bandwidth() / 2)
        .attr("width", 0)
        .attr("height", yScale.bandwidth() / 2.5)
        .attr("fill", "rgba(110, 13, 37, 1)")
        .attr("rx", 4)
        .transition()
        .duration(1000)
        .delay(200)
        .attr("width", d => xScale(d.value2));
    
    // Add value labels
    metricGroups.append("text")
        .attr("class", "value-label")
        .attr("x", d => xScale(d.value1) + 8)
        .attr("y", yScale.bandwidth() / 5)
        .attr("dy", "0.35em")
        .attr("opacity", 0)
        .text(d => `${d.value1.toFixed(1)}${d.unit}`)
        .transition()
        .duration(500)
        .delay(1200)
        .attr("opacity", 1);
    
    metricGroups.append("text")
        .attr("class", "value-label")
        .attr("x", d => xScale(d.value2) + 8)
        .attr("y", (yScale.bandwidth() / 5) * 3.5)
        .attr("dy", "0.35em")
        .attr("opacity", 0)
        .text(d => `${d.value2.toFixed(1)}${d.unit}`)
        .transition()
        .duration(500)
        .delay(1400)
        .attr("opacity", 1);
    
    // Y axis labels
    g.append("g")
        .selectAll("text")
        .data(metrics)
        .enter()
        .append("text")
        .attr("class", "metric-label")
        .attr("x", -15)
        .attr("y", d => yScale(d.name) + yScale.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(d => d.name);
    
    // REMOVE THE LEGEND FROM HERE - it's now at the top
}
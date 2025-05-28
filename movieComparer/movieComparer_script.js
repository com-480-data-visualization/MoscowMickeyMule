// Movie Comparison Tool - Complete Implementation
console.log("Movie comparer script loaded!");

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
    d3.select("#compare").append("p").text("❌ Error loading movie data").style("color", "red");
});

function createInterface() {
    // Clear existing content
    d3.select("#compare").selectAll("*:not(h1)").remove();
    
    // Main container
    const container = d3.select("#compare")
        .append("div")
        .attr("class", "movie-comparer-container")
        .style("display", "flex")
        .style("gap", "20px")
        .style("max-width", "1200px")
        .style("margin", "0 auto");
    
    // Left panel - Movie Finder
    const leftPanel = container.append("div")
        .attr("class", "movie-finder")
        .style("flex", "1")
        .style("background", "white")
        .style("padding", "20px")
        .style("border-radius", "10px")
        .style("box-shadow", "0 4px 8px rgba(0,0,0,0.1)");
    
    // Search controls
    const searchSection = leftPanel.append("div").attr("class", "search-section");
    
    searchSection.append("h3")
        .text("🔍 Movie Finder")
        .style("margin-top", "0")
        .style("color", "#333");
    
    // Search input
    searchSection.append("input")
        .attr("type", "text")
        .attr("id", "movie-search")
        .attr("placeholder", "Search movies...")
        .style("width", "100%")
        .style("padding", "10px")
        .style("border", "2px solid #ddd")
        .style("border-radius", "5px")
        .style("margin-bottom", "15px")
        .style("font-size", "14px")
        .on("input", handleSearch);
    
    // Filters
    const filtersDiv = searchSection.append("div")
        .style("display", "flex")
        .style("gap", "10px")
        .style("margin-bottom", "15px")
        .style("flex-wrap", "wrap");
    
    // Genre filter
    const genreSelect = filtersDiv.append("select")
        .attr("id", "genre-filter")
        .style("padding", "8px")
        .style("border", "1px solid #ddd")
        .style("border-radius", "5px")
        .on("change", handleSearch);
    
    genreSelect.append("option").attr("value", "").text("All Genres");
    const genres = [...new Set(allMovies.flatMap(d => d.genres))].sort();
    genres.forEach(genre => {
        genreSelect.append("option").attr("value", genre).text(genre);
    });
    
    // Year filter
    const yearSelect = filtersDiv.append("select")
        .attr("id", "year-filter")
        .style("padding", "8px")
        .style("border", "1px solid #ddd")
        .style("border-radius", "5px")
        .on("change", handleSearch);
    
    yearSelect.append("option").attr("value", "").text("All Years");
    const years = [...new Set(allMovies.map(d => d.release_year))].filter(y => y > 0).sort((a,b) => b-a);
    years.forEach(year => {
        yearSelect.append("option").attr("value", year).text(year);
    });
    
    // Results container
    leftPanel.append("div")
        .attr("id", "movie-results")
        .style("max-height", "500px")
        .style("overflow-y", "auto")
        .style("border", "1px solid #eee")
        .style("border-radius", "5px")
        .style("padding", "10px");
    
    // Right panel - Comparison
    const rightPanel = container.append("div")
        .attr("class", "comparison-panel")
        .style("flex", "1")
        .style("background", "white")
        .style("padding", "20px")
        .style("border-radius", "10px")
        .style("box-shadow", "0 4px 8px rgba(0,0,0,0.1)");
    
    rightPanel.append("h3")
        .text("🎬 Your Personal Movie Comparison")
        .style("margin-top", "0")
        .style("color", "#333")
        .style("text-align", "center");
    
    // Movie slots
    const slotsContainer = rightPanel.append("div")
        .style("display", "flex")
        .style("gap", "20px")
        .style("margin-bottom", "20px");
    
    // Movie 1 slot
    slotsContainer.append("div")
        .attr("id", "movie-slot-1")
        .attr("class", "movie-slot")
        .style("flex", "1")
        .style("height", "100px")
        .style("border", "2px dashed #ccc")
        .style("border-radius", "8px")
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "center")
        .style("color", "#999")
        .style("font-size", "14px")
        .text("Click a movie to add here");
    
    // Movie 2 slot
    slotsContainer.append("div")
        .attr("id", "movie-slot-2")
        .attr("class", "movie-slot")
        .style("flex", "1")
        .style("height", "100px")
        .style("border", "2px dashed #ccc")
        .style("border-radius", "8px")
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "center")
        .style("color", "#999")
        .style("font-size", "14px")
        .text("Click a movie to add here");
    
    // Comparison chart container
    rightPanel.append("div")
        .attr("id", "comparison-chart")
        .style("min-height", "300px")
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "center")
        .style("color", "#999")
        .style("font-size", "16px")
        .text("Select two movies to see comparison");
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
            .style("color", "#999")
            .style("text-align", "center");
        return;
    }
    
    const movieCards = resultsContainer.selectAll(".movie-card")
        .data(movies)
        .enter()
        .append("div")
        .attr("class", "movie-card")
        .style("border", "1px solid #eee")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("margin-bottom", "8px")
        .style("cursor", "pointer")
        .style("transition", "all 0.2s")
        .on("mouseover", function() {
            d3.select(this).style("background-color", "#f5f5f5").style("border-color", "#4ecdc4");
        })
        .on("mouseout", function() {
            d3.select(this).style("background-color", "white").style("border-color", "#eee");
        })
        .on("click", function(event, d) {
            selectMovie(d);
        });
    
    movieCards.append("div")
        .style("font-weight", "bold")
        .style("margin-bottom", "5px")
        .text(d => d.title);
    
    movieCards.append("div")
        .style("font-size", "12px")
        .style("color", "#666")
        .text(d => `${d.release_year} • ⭐ ${d.vote_average.toFixed(1)} • ${d.genres.slice(0, 3).join(", ")}`);
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
    }
    
    if (selectedMovies.movie1 && selectedMovies.movie2) {
        createComparison();
    }
}

function updateMovieSlot(slotId, movie) {
    const slot = d3.select(`#${slotId}`);
    slot.selectAll("*").remove();
    
    slot.style("border", "2px solid #4ecdc4")
        .style("background-color", "#f0f9ff");
    
    slot.append("div")
        .style("font-weight", "bold")
        .style("margin-bottom", "5px")
        .style("color", "#333")
        .text(movie.title);
    
    slot.append("div")
        .style("font-size", "12px")
        .style("color", "#666")
        .text(`${movie.release_year} • ⭐ ${movie.vote_average.toFixed(1)}`);
    
    // Add clear button
    slot.append("button")
        .text("×")
        .style("position", "absolute")
        .style("top", "5px")
        .style("right", "5px")
        .style("background", "none")
        .style("border", "none")
        .style("font-size", "18px")
        .style("color", "#999")
        .style("cursor", "pointer")
        .on("click", function(event) {
            event.stopPropagation();
            clearMovieSlot(slotId);
        });
    
    slot.style("position", "relative");
}

function clearMovieSlot(slotId) {
    if (slotId === "movie-slot-1") {
        selectedMovies.movie1 = null;
    } else {
        selectedMovies.movie2 = null;
    }
    
    const slot = d3.select(`#${slotId}`);
    slot.selectAll("*").remove();
    slot.style("border", "2px dashed #ccc")
        .style("background-color", "white")
        .style("position", "static")
        .text("Click a movie to add here");
    
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
        .style("color", "#999")
        .style("font-size", "16px")
        .text("Select two movies to see comparison");
}

function createComparison() {
    const movie1 = selectedMovies.movie1;
    const movie2 = selectedMovies.movie2;
    
    if (!movie1 || !movie2) return;
    
    const chartContainer = d3.select("#comparison-chart");
    chartContainer.selectAll("*").remove();
    chartContainer.style("display", "block");
    
    // Prepare comparison data
    const metrics = [
        { name: "Rating", value1: movie1.vote_average, value2: movie2.vote_average, max: 10 },
        { name: "Revenue (M$)", value1: movie1.revenue / 1000000, value2: movie2.revenue / 1000000, max: Math.max(movie1.revenue, movie2.revenue) / 1000000 || 1000 },
        { name: "Runtime (min)", value1: movie1.runtime, value2: movie2.runtime, max: Math.max(movie1.runtime, movie2.runtime) || 200 },
        { name: "Budget (M$)", value1: movie1.budget / 1000000, value2: movie2.budget / 1000000, max: Math.max(movie1.budget, movie2.budget) / 1000000 || 200 }
    ];
    
    // Chart dimensions
    const margin = { top: 20, right: 30, bottom: 40, left: 100 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = chartContainer.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
    
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Scales
    const yScale = d3.scaleBand()
        .domain(metrics.map(d => d.name))
        .range([0, height])
        .padding(0.2);
    
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
        .attr("width", d => xScale(d.value1))
        .attr("height", yScale.bandwidth() / 2)
        .attr("fill", "#4ecdc4")
        .attr("opacity", 0.8);
    
    // Movie 2 bars
    metricGroups.append("rect")
        .attr("class", "bar-movie2")
        .attr("x", 0)
        .attr("y", yScale.bandwidth() / 2)
        .attr("width", d => xScale(d.value2))
        .attr("height", yScale.bandwidth() / 2)
        .attr("fill", "#ff6b6b")
        .attr("opacity", 0.8);
    
    // Add value labels
    metricGroups.append("text")
        .attr("x", d => xScale(d.value1) + 5)
        .attr("y", yScale.bandwidth() / 4)
        .attr("dy", "0.35em")
        .attr("font-size", "12px")
        .attr("fill", "#333")
        .text(d => d.value1.toFixed(1));
    
    metricGroups.append("text")
        .attr("x", d => xScale(d.value2) + 5)
        .attr("y", (yScale.bandwidth() / 4) * 3)
        .attr("dy", "0.35em")
        .attr("font-size", "12px")
        .attr("fill", "#333")
        .text(d => d.value2.toFixed(1));
    
    // Y axis
    g.append("g")
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .attr("font-size", "12px");
    
    // X axis
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(5))
        .selectAll("text")
        .attr("font-size", "12px");
    
    // Legend
    const legend = svg.append("g")
        .attr("transform", `translate(${margin.left + width - 120}, ${margin.top})`);
    
    legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", "#4ecdc4");
    
    legend.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .attr("font-size", "12px")
        .text(movie1.title.length > 15 ? movie1.title.substring(0, 15) + "..." : movie1.title);
    
    legend.append("rect")
        .attr("x", 0)
        .attr("y", 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", "#ff6b6b");
    
    legend.append("text")
        .attr("x", 20)
        .attr("y", 32)
        .attr("font-size", "12px")
        .text(movie2.title.length > 15 ? movie2.title.substring(0, 15) + "..." : movie2.title);
}
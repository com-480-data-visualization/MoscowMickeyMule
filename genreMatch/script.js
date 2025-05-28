let genres = [];

/*====================
    INITIALIZATION
====================*/

// HERE WE CREATE INIITIAL GENRE LIST AND VISUALIZATION
d3.json("genreMatchTopRatings.json") 
  .then(data => {
    
    // Call the function to update the display with the loaded data
    genres = [...new Set(data.flatMap(movie => movie.genres))] // Take all movies and create flatmap
    .filter(genre => genre !== 'Animation') // Exclude animation
    .sort();

    createGenreList(); // Create the genre list with the unique genres

    //Filter data by active genres
    const filteredData = data.filter(d => 
      activeGenres.size === 0 || 
      Array.from(activeGenres).every(genre => d.genres.includes(genre))
    );
    createTopMoviesSlide(filteredData); // Create the top movies slide
    createAverageRatingSlide(filteredData); // Create the average rating slide
    createTopStudiosSlide(filteredData); // Create the top studios slide
    createTotalMovieSlide(filteredData); // Create the total movie count slide

  })

// FUNCTION TO CREATE THE GENRE LIST
function createGenreList() {
  d3.select("#genre-list")
    .selectAll(".genre-item")
    .data(genres)
    .enter()
    .append("div")
    .attr("class", "genre-item inactive-genres")
    .text(d => d)
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", draggedActive)
      .on("end", draggedToActive)
    );
}
// CREATE ACTIVE GENRE SET (ENSURE ANIMATION IS INSIDE)
const activeGenres = new Set();
activeGenres.add("Animation");

/*====================
    DRAG HANDLING
====================*/

let offsetX, offsetY; // Variables to store the offset

// HANDLE DRAG STARTING EVENT (OPACITY CHANGE)
function dragstarted(event, d) {
    d3.select(this).style("opacity", 0.5);
}

// HANDLE DRAGGING TO ACTIVE FILTERS COLUMN
function draggedActive(event, d) { // While Dragging
  d3.select(this)
    .style("position", "absolute")
    .style("left",(event.x -20) + "px")
    .style("top", (event.y + 35) + "px");
    // console.log("Dragging at:", event.x, event.y);
}

function draggedToActive(event, d) { // When Dragging Ends
  d3.select(this).style("opacity", 1);

  const dropZone = document.getElementById("active-filters");
  const dropZoneRect = dropZone.getBoundingClientRect();

  if (event.sourceEvent.clientX > dropZoneRect.left &&
      event.sourceEvent.clientX < dropZoneRect.right &&
      event.sourceEvent.clientY > dropZoneRect.top &&
      event.sourceEvent.clientY < dropZoneRect.bottom) {
    
    // Move a *copy* of the genre into the active filter list
    d3.select("#active-filters")
      .append("div")
      .attr("class", "genre-item active-genre")
      .datum(d)
      .text(d)
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", draggedInactive)
          .on("end", draggedToInactive)
      );
      
    // Add the genre to the active genres set
    activeGenres.add(d);
    
    console.log("Active genres:", activeGenres);
      // Remove the dragged element from the inactive genres
    d3.select(this).remove();
    // Update the display with the new active genres
    updateDisplay();
  } else {
      // If not dropped in the active filters, return to original position
      d3.select(this)
      .style("position", null)
      .style("left", null)
      .style("top", null);

  }
}

// HANDLE DRAGGING BACK TO INACTIVE GENRES COLUMN
function draggedInactive(event, d) { // While Dragging
  d3.select(this)
    .style("position", "absolute")
    .style("left",(event.x + 185) + "px")
    .style("top", (event.y + 35) + "px");
    // console.log("Dragging at:", event.x, event.y);
}

 // Called when dragged back to inactive to reset the list
 function draggedToInactive(event, d) { // When Dragging Ends
  d3.select(this).style("opacity", 1);

  const dropZone = document.getElementById("genre-list");
  const dropZoneRect = dropZone.getBoundingClientRect();

  if (event.sourceEvent.clientX > dropZoneRect.left &&
      event.sourceEvent.clientX < dropZoneRect.right &&
      event.sourceEvent.clientY > dropZoneRect.top &&
      event.sourceEvent.clientY < dropZoneRect.bottom) {

      // Get all current genres in the list
      const currentGenres = d3.selectAll("#genre-list .genre-item")
          .data()
          .concat(d) // Add the new genre
          .sort(); // Sort alphabetically

      // Remove all existing genres
      d3.selectAll("#genre-list .genre-item").remove();

      // Recreate the list in sorted order
      d3.select("#genre-list")
          .selectAll(".genre-item")
          .data(currentGenres)
          .enter()
          .append("div")
          .attr("class", "genre-item inactive-genres")
          .text(d => d)
          .call(d3.drag()
              .on("start", dragstarted)
              .on("drag", draggedActive)
              .on("end", draggedToActive)
          );
      
      // Remove dragged element from active genre set
      activeGenres.delete(d);
      // Remove the dragged element from the active filters
      d3.select(this).remove();

      // Update the display
      updateDisplay();
  } else {
      // If not dropped in the genre list, reset the element's position
      d3.select(this)
          .style("position", null)
          .style("left", null)
          .style("top", null);
  }
}

// SPARE DRAG ENDED FUNCTION
function dragended(event, d) {
  d3.select(this).style("opacity", 1);
  // Delete the dragged element
  

}


/*====================
    DISPLAY FUNCTIONS AND SLIDES
====================*/

let currentSlide = 0;
const totalSlides = 4;

function initializeSlides() {
    // Show first slide
    document.querySelector(`#data-display-1`).classList.add('active');
    
    // Add click handlers for navigation
    document.querySelector('.prev').addEventListener('click', () => navigateSlides('prev'));
    document.querySelector('.next').addEventListener('click', () => navigateSlides('next'));
}

function navigateSlides(direction) {
    
    // Get current and next slide
    //if (currentSlide + 1 >= totalSlides) {return;}
    const currentSlideEl = document.querySelector(`#data-display-${currentSlide + 1}`);
    
    // Remove active class from current slide
    
    
    // Add appropriate transition class based on direction
    if (direction === 'next') {
        if (currentSlide + 1 >= totalSlides) {
            console.log("No more slides to show.");
            return; // Prevent going beyond the last slide
        }
        currentSlideEl.classList.add('slide-left');
        currentSlide = currentSlide +1;
    } else {
        if (currentSlide <= 0) {
            console.log("No previous slides to show.");
            return; // Prevent going before the first slide
        }
        currentSlideEl.classList.add('slide-right');
        currentSlide = currentSlide - 1;
    }

    currentSlideEl.classList.remove('active');
    
    // Add active class to new slide
    const nextSlideEl = document.querySelector(`#data-display-${currentSlide + 1}`);
    nextSlideEl.classList.add('active');
    console.log("Current Slide:", currentSlide);
}

function updateDisplay() {
  d3.json("genreMatchTopRatings.json")
  .then(data => {
    ratingsData = data;
    
    // Call the function to update the display with the loaded data
    
    //Filter data by active genres
    const filteredData = ratingsData.filter(d => 
      activeGenres.size === 0 || 
      Array.from(activeGenres).every(genre => d.genres.includes(genre))
    );
    createTopMoviesSlide(filteredData); // Create the top movies slide
    createAverageRatingSlide(filteredData); // Create the average rating slide
    createTopStudiosSlide(filteredData); // Create the top studios slide
    createTotalMovieSlide(filteredData); // Create the total movie count slide
  })
}

// TEST FUNCTION TO CREATE A BAR CHART
function createBarChart(data, container) {
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

document.addEventListener('DOMContentLoaded', initializeSlides);

/*====================
    SLIDE 1 - TOP 5 MOVIES
====================*/

// Function to create the top 5 movies slide
function createTopMoviesSlide(data) {
  // Sort by weighted rating in descending order
  const sorted_data = data.sort((a, b) => b.weighted_rating - a.weighted_rating);

  const topFive = sorted_data.slice(0, 5);
  const slide = d3.select("#data-display-1");
  
  // Clear previous content
  slide.selectAll("*").remove();
  
  // Create title
  slide.append("h2").text("Top 5 Movies by weighted Rating");
  
  createBarChart(topFive, "#data-display-1");
}

/*====================
    SLIDE 2 - AVERAGE RATING OF GENRES
====================*/

// Function to create the top 5 movies slide
function createAverageRatingSlide(data) {
  // Calculate average rating from data
  let mean = d3.mean(data, d => d.weighted_rating);
  const slide = d3.select("#data-display-2");
  
  if (isNaN(mean)) {
    console.log("Mean calculation resulted in NaN. Set to 0.");
    mean = 0.0; // Exit if mean is not a number
  }
  // Clear previous content
  slide.selectAll("*").remove();
  
  // Create title
  slide.append("h2")
    .text("Average Rating");
  
  // Create large, centered mean value
  slide.append("div")
    .style("text-align", "center")
    .style("font-size", "64px")
    .style("font-weight", "bold")
    .style("margin-top", "100px")
    .text(mean.toFixed(2));  // Display mean with 2 decimal places
}

/*====================
    SLIDE 3 - TOP 5 STUDIOS BY COUNT
====================*/

// Function to create the top 5 studios slide
function createTopStudiosSlide(data) {
  // Flatten the production companies arrays and remove empty strings
  const allStudios = data.flatMap(d => d.production_companies)
                         .filter(studio => studio !== "");
  
  // Count occurrences of each studio
  const studioCounts = d3.rollup(allStudios, v => v.length, d => d);
  
  // Convert to array and sort by count
  const sortedStudios = Array.from(studioCounts, ([studio, count]) => ({ 
    title: studio,           // Change 'studio' to 'title' to match bar chart format
    weighted_rating: count   // Change 'count' to 'weighted_rating' to match bar chart format
  }))
  .sort((a, b) => b.weighted_rating - a.weighted_rating)
  .slice(0, 5); // Get top 5 studios

  const slide = d3.select("#data-display-3");
  
  // Clear previous content
  slide.selectAll("*").remove();
  
  // Create title
  slide.append("h2").text("Top 5 Studios by Movie Count");
  
  // Create bar chart for studios
  createBarChart(sortedStudios, "#data-display-3");
}

/*====================
    SLIDE 4 - Total Movie Count
====================*/

function createTotalMovieSlide(data) {
  
  // Calculate average rating from data
  const data_size = data.length;
  
  const slide = d3.select("#data-display-4");
  
  // Clear previous content
  slide.selectAll("*").remove();
  
  // Create title
  slide.append("h2")
    .text("Total Movies");
  
  // Create large, centered mean value
  slide.append("div")
    .style("text-align", "center")
    .style("font-size", "64px")
    .style("font-weight", "bold")
    .style("margin-top", "100px")
    .text(data_size);  // Display mean with 2 decimal places
}
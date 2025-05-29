import { createBarChart, createTreemap, generateTween } from './generateChartFunctions.js';

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

  })

// FUNCTION TO CREATE THE GENRE LIST
function createGenreList() {
  d3.select("#genre-list")
    .selectAll(".genre-item")
    .data(genres)
    .enter()
    .append("div")
    .attr("class", "genre-item inactive-genres-safe")
    .text(d => d)
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", draggedActive)
      .on("end", draggedToActive)
    );
}

// FUNCTION TO CREATE GRAYED OUT INACTIVE GENRES
function createGrayedGenres(data) { 
  d3.select("#genre-list")
    .selectAll(".genre-item")
    .each(function(d) {
      // Create a test set with current active genres plus this genre
      const testGenres = new Set(activeGenres);
      testGenres.add(d);
      
      // Check if adding this genre would result in any matches
      const wouldHaveMatches = data.some(movie => 
        Array.from(testGenres).every(genre => 
          movie.genres.includes(genre)
        )
      );

      // Update classes based on whether there would be matches
      d3.select(this)
        .classed("inactive-genres-safe", wouldHaveMatches)
        .classed("inactive-genres-gray", !wouldHaveMatches);
    });
}
// CREATE ACTIVE GENRE SET (ENSURE ANIMATION IS INSIDE)
const activeGenres = new Set();
activeGenres.add("Animation");

// Listen for resize and redraw
window.addEventListener("resize", () => {
  updateDisplay();  // Make sure 'data' and 'container' are in scope
});



/*====================
    DRAG HANDLING
====================*/

let offsetX, offsetY; // Variables to store the offset

// HANDLE DRAG STARTING EVENT (OPACITY CHANGE)
function dragstarted(event, d) {
  const element = d3.select(this);
  const bbox = element.node().getBoundingClientRect();
  const elementWidth = bbox.width;
  const elementHeight = bbox.height;
  
  // Store the initial offset between mouse position and element position
  element
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("opacity", 0.8);
  d3.select(this)
    .style("left", (event.sourceEvent.pageX - elementWidth/2) + "px")
    .style("top", (event.sourceEvent.pageY - elementHeight/2) + "px");
}

function draggedActive(event, d) {
  const element = d3.select(this);
  const bbox = element.node().getBoundingClientRect();
  const elementWidth = bbox.width;
  const elementHeight = bbox.height;
  
  d3.select(this)
      .style("left", (event.sourceEvent.pageX - elementWidth/2) + "px")
      .style("top", (event.sourceEvent.pageY - elementHeight/2) + "px");
}

// HANDLE DRAGGING TO ACTIVE FILTERS COLUMN
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
    
    // Gray out inactive genres that would result in combinations with 0 movies
    d3.select("#genre-list")

    // Add the genre to the active genres set
    activeGenres.add(d);
    
    d3.json("genreMatchTopRatings.json")
      .then(data => {
        createGrayedGenres(data);
      });
    //console.log("Active genres:", activeGenres);
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
function draggedInactive(event, d) {
  const element = d3.select(this);
  const bbox = element.node().getBoundingClientRect();
  const elementWidth = bbox.width;
  const elementHeight = bbox.height;
  
  d3.select(this)
      .style("left", (event.sourceEvent.pageX - elementWidth/2) + "px")
      .style("top", (event.sourceEvent.pageY - elementHeight/2) + "px");
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
          .attr("class", "genre-item inactive-genres-safe")
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

      d3.json("genreMatchTopRatings.json")
      .then(data => {
        createGrayedGenres(data);
      });
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
const totalSlides = 3;

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
    const ratingsData = data;
    
    // Call the function to update the display with the loaded data
    
    //Filter data by active genres
    const filteredData = ratingsData.filter(d => 
      activeGenres.size === 0 || 
      Array.from(activeGenres).every(genre => d.genres.includes(genre))
    );
    createTopMoviesSlide(filteredData); // Create the top movies slide
    createAverageRatingSlide(filteredData); // Create the average rating slide
    createTopStudiosSlide(filteredData); // Create the top studios slide
  })
}
document.addEventListener('DOMContentLoaded', initializeSlides);

/*====================
    SLIDE 1 - TOP 5 MOVIES
====================*/

// Function to create the top 5 movies slide
function createTopMoviesSlide(data) {
  // Sort by weighted rating in descending order
  const sorted_data = data.sort((a, b) => b.weighted_rating - a.weighted_rating);

  const top = sorted_data.slice(0, 25);
  const slide = d3.select("#data-display-1");
  
  // Clear previous content
  slide.selectAll("*").remove();
  
  // Create title
  slide.append("h4").text("Top Movies by Weighted IMBD Rating");
  createTreemap(top, "#data-display-1", 1.5);
  
}

/*====================
    SLIDE 2 - AVERAGE RATING OF GENRES
====================*/

// Function to create the top 5 movies slide
function createAverageRatingSlide(data) {
  
  const data_size = data.length;
  
  const slide_2 = d3.select("#data-display-2-1");
  
  // Clear previous content
  slide_2.selectAll("*").remove();
  
  // Create title
  slide_2.append("h4")
    .text("Total IMBD Animation Movies");
  
  // Create large, centered mean value
  
    generateTween(data_size, "#data-display-2-1", 2863);
  
  // Calculate average rating from data
  let mean = d3.mean(data, d => d.weighted_rating);
  const slide_1 = d3.select("#data-display-2-2");
  
  if (isNaN(mean)) {
    console.log("Mean calculation resulted in NaN. Set to 0.");
    mean = 0.0; // Exit if mean is not a number
  }
  // Clear previous content
  slide_1.selectAll("*").remove();
  
  // Create title
  slide_1.append("h4")
    .text("Average Rating");
  
  generateTween(mean.toFixed(2), "#data-display-2-2");

  
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
    title: studio,           
    weighted_rating: count  
  }))
  .sort((a, b) => b.weighted_rating - a.weighted_rating)
  .slice(0, 30); // Get top 5 studios

  const slide = d3.select("#data-display-3");
  
  // Clear previous content
  slide.selectAll("*").remove();
  
  // Create title
  slide.append("h4").text("Top Producing Studios by Movie Count");
  
  // Create bar chart for studios
  createTreemap(sortedStudios, "#data-display-3", 0.05);
}


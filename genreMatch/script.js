const genres = ["Comedy", "Adventure", "Fantasy", "Sci-Fi", "Horror", "Drama"];


// Load genre data from JSON file
d3.json("genreMatchAll.json")
  .then(data => {
    fullData = data;
    console.log("Full data loaded:", fullData);
    // Call the function to update the display with the loaded data
    // updateDisplay();
  })

// Load second JSON file
d3.json("genreMatchTopRatings.json")
  .then(data => {
    fullData = data;
    console.log("Full data loaded:", fullData);
    // Call the function to update the display with the loaded data
    // updateDisplay();
  })
  

let fullData = [];
const activeGenres = new Set();

// Create draggable genre list
const genreList = d3.select("#genre-list")
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

let offsetX, offsetY; // Variables to store the offset


function dragstarted(event, d) {
    d3.select(this).style("opacity", 0.5);
}

function draggedActive(event, d) {
  d3.select(this)
    .style("position", "absolute")
    .style("left",(event.x -20) + "px")
    .style("top", (event.y + 35) + "px");
    console.log("Dragging at:", event.x, event.y);
}

function draggedInactive(event, d) {
  d3.select(this)
    .style("position", "absolute")
    .style("left",(event.x + 185) + "px")
    .style("top", (event.y + 35) + "px");
    console.log("Dragging at:", event.x, event.y);
}

function dragended(event, d) {
  d3.select(this).style("opacity", 1);
  // Delete the dragged element
  

}
// Create droppable area for active filters

function draggedToActive(event, d) {
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
        // Remove the dragged element from the inactive genres
      d3.select(this).remove();
      // updateDisplay();
    } else {
        // If not dropped in the active filters, return to original position
        d3.select(this)
        .style("position", null)
        .style("left", null)
        .style("top", null);

    }
  }

  function draggedToInactive(event, d) {
    d3.select(this).style("opacity", 1);

    const dropZone = document.getElementById("genre-list");
    const dropZoneRect = dropZone.getBoundingClientRect();

    // Check if the element is dropped inside the genre list drop zone
    if (event.sourceEvent.clientX > dropZoneRect.left &&
        event.sourceEvent.clientX < dropZoneRect.right &&
        event.sourceEvent.clientY > dropZoneRect.top &&
        event.sourceEvent.clientY < dropZoneRect.bottom) {

        // Append a new element to the genre list with the correct text
        d3.select("#genre-list")
            .append("div")
            .attr("class", "genre-item inactive-genres")
            .datum(d)
            .text(d) // Use the bound data to set the text explicitly
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", draggedActive)
                .on("end", draggedToActive) // Rebind the drag-to-active behavior
            );
        
        // Remove dragged element from active genre set
        activeGenres.delete(d);
        // Remove the dragged element from the active filters
        d3.select(this).remove();

        // updateDisplay(); // Update the display if needed
        console.log("Dragged element data:", d);

    } else {
        // If not dropped in the genre list, reset the element's position
        d3.select(this)
            .style("position", null)
            .style("left", null)
            .style("top", null);
    }
}
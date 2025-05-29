# MoscowMickeyMule


This visualization website provides both a macro-level overview of global animation industry trends and a micro-level lens into studio origins—bridging data exploration with historical storytelling.

### 🔍 Map Feature: Tracing the Origins of Animation Studios

This interactive D3 map visualizes the emergence and geographic distribution of animation studios worldwide, based on the [Animation Studio Dataset (Kaggle)](https://www.kaggle.com/datasets/). It includes 348 studios with founding year, country, and coordinates.

- **Year Slider**: Filter studios by founding year to explore historical trends.
- **Studio Dots**: Each studio is represented by a styled circle on the map, with special care taken to avoid clutter in densely populated areas like Japan and the U.S.
- **Interactive Tooltips**: On-hover display of studio name, country, and founding year.
- **Layer Toggle**: Seamlessly switch between the Studio view and the Movie view (powered by the 52K Animation Movies Dataset).
- **Custom Styling**: UI elements styled using the MouseMemoirs font to align with the playful spirit of animation.


### 🎬 Genre Mix-Match Visualization

- **Drag-and-Drop Interface**: Users can select genre buttons and place them into designated zones, dynamically updating the visualizations.
- **Dynamic Data Display**: Visualizations adapt to reflect selected genres, showcasing:
  - **Top Genres**
  - **Average Ratings**
  - **Top Studios**
  - **Total Number of Movies**
- **Sliding Window Layout**: To maintain clarity, statistics are split across separate slides. Users navigate between slides with buttons, each focusing on one data aspect.
- **Treemap Visualizations**: For top genres and studios, treemaps efficiently fill the rectangular display, using size and color differences to highlight leading entries.

### 💡 Insights

- The number of animation studios rose sharply in the early 2000s, echoing the global rise of CGI after _Toy Story_ (1995).
- The U.S. and Japan dominate the studio landscape, with rapid growth seen in South Korea, China, and other parts of Asia in recent decades.
- The genre mix-match visualization offers deeper insights into how genres, studios, and ratings interact, enriching the exploration experience.


### 📦 Data Sources

- **[Animation Studio Dataset (Kaggle)](https://www.kaggle.com/datasets/)** – Core data for studio names, founding year, country.
- **[52K Animation Movies Dataset (Kaggle)](https://www.kaggle.com/datasets/)** – Used for the alternate Movie Layer to show country-based movie production trends.
- **[IMBd Ratings Dataset](https://datasets.imdbws.com/)** - Data used in genre mix-and-match. All animation movies are isolated from the dataset for use.

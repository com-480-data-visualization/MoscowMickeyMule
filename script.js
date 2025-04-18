$(document).ready(function () {
  new fullpage("#fullpage", {
    anchors: ["intro", "map", "genre", "compare"],
    navigation: true,
    navigationPosition: "right",
    css3: true,
    scrollingSpeed: 700,
    autoScrolling: true,
    fitToSection: true,
    responsiveWidth: 768,
  });
});

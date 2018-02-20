wave = "csv/wave2.csv";

var margin = {top: 30, right: 10, bottom: 10, left: 10},
    width = 700 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

var x = d3.scale.ordinal().rangePoints([0, width], 1),
    y = {},
    dragging = {};

var line = d3.svg.line(),
    axis = d3.svg.axis().orient("left"),
    background,
    foreground;

var svg = d3.select("#parallellChart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.csv("csv/parallell2.csv", function(error, data) {

  // Extract the list of dimensions and create a scale for each.
  x.domain(dimensions = d3.keys(data[0]).filter(function(d) {
    return d != "Country" && (y[d] = d3.scale.linear()
        .domain(d3.extent(data, function(p) { return +p[d]; }))
        .range([height, 0]));
  }));

  // Add grey background lines for context.
  background = svg.append("g")
      .attr("class", "background")
    .selectAll("path")
      .data(data)
    .enter().append("path")
      .attr("d", path);

  // Add blue foreground lines for focus.
  foreground = svg.append("g")
      .attr("class", "foreground")
    .selectAll("path")
      .data(data)
    .enter().append("path")
      .attr("d", path)

  // Add a group element for each dimension.
  var g = svg.selectAll(".dimension")
      .data(dimensions)
    .enter().append("g")
      .attr("class", "dimension")
      .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
      .call(d3.behavior.drag()
        .origin(function(d) { return {x: x(d)}; })
        .on("dragstart", function(d) {
          dragging[d] = x(d);
          background.attr("visibility", "hidden");
        })
        .on("drag", function(d) {
          dragging[d] = Math.min(width, Math.max(0, d3.event.x));
          foreground.attr("d", path);
          dimensions.sort(function(a, b) { return position(a) - position(b); });
          x.domain(dimensions);
          g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
        })
        .on("dragend", function(d) {
          delete dragging[d];
          transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
          transition(foreground).attr("d", path);
          background
              .attr("d", path)
            .transition()
              .delay(500)
              .duration(0)
              .attr("visibility", null);
        }));

  // Add an axis and title.
  g.append("g")
      .attr("class", "axis")
      .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
    .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(function(d) { return d; });

  // Add and store a brush for each axis.
  g.append("g")
      .attr("class", "brush")
      .each(function(d) {
        d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
      })
    .selectAll("rect")
      .attr("x", -8)
      .attr("width", 16);


  // Rebind the axis data to simplify mouseover.
  svg.select(".axis").selectAll("text:not(.title)")
      .attr("class", "label")
      .data(data, function(d) { return d.name || d; });

  var projection = svg.selectAll(".axis text,.background path,.foreground path")
      .on("mouseover", mouseover)
      .on("mouseout", mouseout);

  function mouseover(d) {
    svg.classed("active", true);
    projection.classed("inactive", function(p) { return p !== d; });
    projection.filter(function(p) { return p === d; }).each(moveToFront);
    var html = "";
    html += "<div class=\"tooltip_kv\">";
    html += "<span class=\"tooltip_key\">";
    html += d.Country;
    html += "</span>";
    html += "</div>";
            
    $("#tooltip-container2").html(html);
    $("#tooltip-container2").show();

    var coordinates = d3.mouse(this);
            
    var map_width = $('.choropleth')[0].getBoundingClientRect().width;
            
    if (d3.event.pageX < map_width / 2) {
      d3.select("#tooltip-container")
        .style("top", (d3.event.layerY + 15) + "px")
        .style("left", (d3.event.layerX + 15) + "px");
    } else {
      var tooltip_width = $("#tooltip-container").width();
      d3.select("#tooltip-container2")
        .style("top", (d3.event.layerY + 15) + "px")
        .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
            }
  }

  function mouseout(d) {
    svg.classed("active", false);
    projection.classed("inactive", false);
    $("#tooltip-container2").hide();
  }

  function moveToFront() {
    this.parentNode.appendChild(this);
  }
});

function position(d) {
  var v = dragging[d];
  return v == null ? x(d) : v;
}

function transition(g) {
  return g.transition().duration(500);
}

// Returns the path for a given data point.
function path(d) {
  return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
}

function brushstart() {
  d3.event.sourceEvent.stopPropagation();
}

// Handles a brush event, toggling the display of foreground lines.
function brush() {
  var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
      extents = actives.map(function(p) { return y[p].brush.extent(); });
  foreground.style("display", function(d) {
    return actives.every(function(p, i) {
      return extents[i][0] <= d[p] && d[p] <= extents[i][1];
    }) ? null : "none";
  });
}

/* !!!!!!!!!! END OF PARALLELL COORDINATES !!!!!!!!!!!!!!!!!!*/


d3.csv(wave, function(err, data) {
  //var config = {"data0":"Country","data1":"Population","width":960,"height":960}
  var width = 550,
      height = 550;
 
  var projection = d3.geo.mercator()
      .scale((width + 1) / 2 / Math.PI)
      .translate([width / 2, height / 2])
      .precision(.1);
  
  var path = d3.geo.path()
      .projection(projection);
  
  var graticule = d3.geo.graticule();
  
  var svg = d3.select("#canvas-svg").append("svg")
      .attr("width", width)
      .attr("height", height);
  
  svg.append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", path);

  var financialHash = {};  
  var healthHash = {};
  var happinessHash = {};
  var importanceHash = {};

  data.forEach(function(d) { 
    financialHash[d.Country] = {"FinancialAVG":d["FinancialSatisfactionAverage"],
    "Financial1":(parseInt(d["FinancialSatisfaction1"])+parseInt(d["FinancialSatisfaction2"])/2).toFixed(1),
    "Financial2":(parseInt(d["FinancialSatisfaction3"])+parseInt(d["FinancialSatisfaction4"])+parseInt(d["FinancialSatisfaction5"])/3).toFixed(1),
    "Financial3":(parseInt(d["FinancialSatisfaction6"])+parseInt(d["FinancialSatisfaction7"])+parseInt(d["FinancialSatisfaction8"])/3).toFixed(1),
    "Financial4":(parseInt(d["FinancialSatisfaction9"])+parseInt(d["FinancialSatisfaction10"])/2).toFixed(1)}
  });

  data.forEach(function(d) { 
    healthHash[d.Country] = {"Health1":d["HealthVeryGood"],"Health2":d["HealthGood"],"Health3":d["HealthFair"],"Health4":d["HealthPoor"]}
  });

  data.forEach(function(d) {
    happinessHash[d.Country] = {"Happiness1":d["VeryHappy"],"Happiness2":d["QuiteHappy"],"Happiness3":d["NotVeryHappy"],"Happiness4":d["NotHappyAtAll"]}
  });

  data.forEach(function(d) {
    importanceHash[d.Country] = {"Work1":d["WorkVeryImportant"],"Work2":d["WorkRatherImportant"],"Work3":d["WorkNotVeryImportant"],"Work4":d["WorkNotImportantAtAll"],
    "Leisure1":d["LeisureVeryImportant"],"Leisure2":d["LeisureRatherImportant"],"Leisure3":d["LeisureNotVeryImportant"],"Leisure4":d["LeisureNotImportantAtAll"],
    "Friends1":d["FriendsVeryImportant"],"Friends2":d["FriendsRatherImportant"],"Friends3":d["FriendsNotVeryImportant"],"Friends4":d["FriendsNotImportantAtAll"],
    "Religion1":d["ReligionVeryImportant"],"Religion2":d["ReligionRatherImportant"],"Religion3":d["ReligionNotVeryImportant"],
    "Religion4":d["ReligionNotImportantAtAll"]}
  });

  d3.json("https://s3-us-west-2.amazonaws.com/vida-public/geo/world-topo-min.json", function(error, world) {
    var countries = topojson.feature(world, world.objects.countries).features;

    svg.append("path")
       .datum(graticule)
       .attr("class", "choropleth")
       .attr("d", path);
  
    var g = svg.append("g");
  
    g.append("path")
     .datum({type: "LineString", coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]})
     .attr("class", "equator")
     .attr("d", path);
  

    var country = g.selectAll(".country").data(countries);
  
    country.enter().insert("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("id", function(d,i) { return d.id; })
        .attr("title", function(d) { return d.properties.name; })
        .style("fill", function(d) {
          if (financialHash[d.properties.name]) {
            return "#404040"

          } else {
            return "#101010";
          }
        })
        .on("mousemove", function(d) {
            var html = "";
            html += "<div class=\"tooltip_kv\">";
            html += "<span class=\"tooltip_key\">";
            html += d.properties.name;
            html += "</span>";
            html += "</div>";
            
            $("#tooltip-container").html(html);
            $(this).attr("fill-opacity", "0.8");
            $("#tooltip-container").show();
            
            var coordinates = d3.mouse(this);
            
            var map_width = $('.choropleth')[0].getBoundingClientRect().width;
            
            if (d3.event.pageX < map_width / 2) {
              d3.select("#tooltip-container")
                .style("top", (d3.event.layerY + 15) + "px")
                .style("left", (d3.event.layerX + 15) + "px");
            } else {
              var tooltip_width = $("#tooltip-container").width();
              d3.select("#tooltip-container")
                .style("top", (d3.event.layerY + 15) + "px")
                .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
            }
        })

        .on("click", function(d){
          $(".financialChart").html("");
          $(".healthChart").html("");
          $(".happinessChart").html("");
          $("#headerText").html("");
        

          d3.select(".financialChart")
            .selectAll("div")
              .data([financialHash[d.properties.name]["Financial1"],financialHash[d.properties.name]["Financial2"],
                    financialHash[d.properties.name]["Financial3"],financialHash[d.properties.name]["Financial4"]])
            .enter().append("div")
              .style("width", function(d) { return d + "%"; })
              .style("text-align", "right")
              .text(function(d) { return d +"%"; })

          d3.select(".healthChart")
            .selectAll("div")
              .data([healthHash[d.properties.name]["Health1"],healthHash[d.properties.name]["Health2"],
                    healthHash[d.properties.name]["Health3"],healthHash[d.properties.name]["Health4"]])
            .enter().append("div")
              .style("width", function(d) { return d + "%"; })
              .style("text-align", "right")
              .text(function(d) { return d +"%"; })

          d3.select(".happinessChart")
            .selectAll("div")
              .data([happinessHash[d.properties.name]["Happiness1"],happinessHash[d.properties.name]["Happiness2"],
                    happinessHash[d.properties.name]["Happiness3"],happinessHash[d.properties.name]["Happiness4"]])
            .enter().append("div")
              .style("width", function(d) { return d + "%"; })
              .style("text-align", "right")
              .text(function(d) { return d +"%"; })  

          d3.select("#headerText").html(d.properties.name);

        })

        .on("mouseout", function() {
                $(this).attr("fill-opacity", "1.0");
                $("#tooltip-container").hide();

            });
    
    g.append("path")
        .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
        .attr("class", "boundary")
        .attr("d", path);
    
    svg.attr("height", height * 2.2 / 3);
  });
  
  d3.select(self.frameElement).style("height", (height * 2.3 / 3) + "px");
});
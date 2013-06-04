window.onload = function () {
	//var d = fake_sleep_generator(300);
	var d = JSON.parse(document.getElementById('current-graph-container').getAttribute('data-url'));
	d = parse_data(d);
	visualize_sleepdata(d, {
		margin: {top: 0, right: 10, bottom: 20, left: 40},
		height: d3.select("#overview-graph-container")[0][0].offsetHeight,
		width: d3.select("#overview-graph-container")[0][0].offsetWidth,
		hourOffset: 15,
		minBarThickness: 3.8,
		paddingFactor: 0.5
	});
}
 
function round_to_day_with_offset(time, hourOffset) {
	var dayAgo = d3.time.day.offset(time, -1);
	flooredDayAgo = d3.time.day.floor(dayAgo);
	flooredTime = d3.time.day.floor(time);
 
	flooredOffsetTime = d3.time.day.floor(d3.time.hour.offset(time, -hourOffset));
	if (Math.abs(flooredOffsetTime - flooredTime) > 0.1) {
		return d3.time.hour.offset(flooredDayAgo, hourOffset);
	} else {
		return d3.time.hour.offset(flooredTime, hourOffset);
	}
}
 
function round_time_with_offset(time, hourOffset, roundFunc) {
	roundFunc = roundFunc || d3.time.day.round;
	var time = d3.time.hour.offset(time,-hourOffset);
	time = roundFunc(time);
	time = d3.time.hour.offset(time,hourOffset);
	return time;
}

function parse_data(d) {
	var data = [];
	for (var i = 0; i < d.length; i++) {
		var sleepStart = new Date(d[i]['start']);
		var sleepEnd = new Date(d[i]['end']);
		if (sleepStart < sleepEnd) {
			if (sleepEnd - sleepStart < 1000 * 24 * 60 * 60) {
				var sleep = {'start': sleepStart, 'end': sleepEnd};
				data.push(sleep);	
			} else {
				console.log("Slept longer than a day!");
				console.log(sleepEnd - sleepStart);
			}
		} else {
			console.log("Data error");
		}

	}
	return data;
}

function fake_sleep_generator(count) {
	var data = [];
	var sleepStart = new Date();
	sleepStart.setHours(5);
	for (var i = count-1; i >= 0; i--) {
		var sleepOffset = Math.floor(Math.random()*50+3);
		sleepEnd = d3.time.hour.offset(sleepStart,sleepOffset);
 
		var sleep = {'start': sleepStart, 'end': sleepEnd};
		data.push(sleep);
 
		var awakeOffset = Math.floor(Math.random()*16+3);
		sleepStart = d3.time.hour.offset(sleepEnd,awakeOffset);
	}
	return data;
}
 
/*
function fake_sleep_generator(count) {
	var data = [];
	var sleepStart = new Date();
	sleepStart.setHours(0);
	for (var i = count-1; i >= 0; i--) {
		sleepStart = d3.time.day.offset(sleepStart, count);
		var duration = Math.random()*5+3;
		var sleepEnd = d3.time.hour.offset(sleepStart, duration);
		var sleep = {'start': sleepStart, 'end': sleepEnd};
		console.log(sleep);
		data.push(sleep);
	}
	return data;
}*/
 
function longTimeFormat() {
  return function(date) {
  	if (date.getMonth() === 0 && date.getDate() < 8) {
  		return d3.time.format("%Y")(date);
  	}
  	return d3.time.format("%m/%d")(date);
  	//return function (d) { return d.getDay(); };
  };
}

function createSleepGraphBarsFunction(params) {
	if (params === undefined) throw "No Params!";
	
	var hourOffset = params['hourOffset'];
	var x = params['x'];
	var chartHeight = params['chartHeight'];
	var chartWidth = params['chartWidth'];

	if (hourOffset === undefined || 
		x === undefined || 
		chartHeight === undefined ||
		chartWidth === undefined) throw "Undefined Params!";

	if (hourOffset < 0 || hourOffset > 23) throw "hourOffset must be in [0,23] inclusive!";
// in [0,23] inclusive
	return function (d) {
		var segs = [];
	 
		var sleepStart = d['start'];
		var sleepEnd = d['end'];

		var dayStart = round_to_day_with_offset(sleepStart, hourOffset);
		var dayEnd = d3.time.day.offset(dayStart, 1);

		var y, h;

		// Visual Debug by drawing the entire sleep segment going off the edge of the chart
		//y = d3.time.scale().domain([dayStart,dayEnd]).range([0,chartHeight]);
		//h = (y(sleepEnd)-y(sleepStart)); 
		//segs.push({'x': x(dayStart), 'y': y(sleepStart), 'height': h});
		//
		// For debugging end day
		//var wakeupDay = round_to_day_with_offset(sleepEnd, hourOffset);

		while (sleepStart < sleepEnd && 
			   dayStart < sleepEnd) {

			// This method, while elegant, is unstable
			//  for example, it fails to handle {'start': "Sun Nov 06 2011 20:00:00 GMT-0500 (EST)", 
			//                                   'end':"Mon Nov 07 2011 03:15:00 GMT-0500 (EST)"}
			//  with a 3 hour offset.
			//dayStart = round_to_day_with_offset(sleepStart, hourOffset);
			//dayEnd = d3.time.day.offset(dayStart, 1);

			y = d3.time.scale().domain([dayStart,dayEnd]).range([0,chartHeight]);

			h = (Math.min(y(sleepEnd),chartHeight)-y(sleepStart));
			segs.push({'x': x(dayStart), 'y': y(sleepStart), 'height': h});

			sleepStart = round_to_day_with_offset(sleepStart, hourOffset);
			sleepStart = d3.time.day.offset(sleepStart, 1);

			dayStart = d3.time.day.offset(dayStart, 1);
			dayEnd = d3.time.day.offset(dayEnd, 1);
		}

		return segs;		
	}
}

function visualize_sleepdata(data, params) {
	
	var margin = params['margin'];
	var height = params['height'];
	var width = params['width'];
	var hourOffset = params['hourOffset'];
	var minBarThickness = params['minBarThickness'];
	var paddingFactor = params['paddingFactor'];

	if (margin === undefined || 
	height === undefined || 
	width === undefined || 
	hourOffset === undefined || 
	minBarThickness === undefined || 
	paddingFactor === undefined) throw "Undefined params!";

	// Setup
	var margin = {top: 0, right: 10, bottom: 20, left: 40};
	var height = d3.select("#overview-graph-container")[0][0].offsetHeight;
	var width = d3.select("#overview-graph-container")[0][0].offsetWidth;
	var hourOffset = 15; // in [0,23] inclusive
	var minBarThickness = 3.8;
	var paddingFactor = 0.5;
	
	// Configure dimensions
	var chartHeight = height - margin.top - margin.bottom;
	var chartWidth = width - margin.left - margin.right;
	var barThickness = (chartWidth/data.length)*paddingFactor;
	if (barThickness < minBarThickness) {
		barThickness = minBarThickness;
		chartWidth = barThickness/paddingFactor * data.length;
		width = chartWidth + margin.left + margin.right;
	}

	var main_chart_container = d3.select("#overview-graph-container").append("svg")
		.attr("height", height)
		.attr("width", width);

	var main_chart = main_chart_container.append("g");

	main_chart.attr("class", "chart")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.attr("width", chartWidth)
		.attr("height", chartHeight);
 
	var firstDayStart = d3.min(data,function(d) {return d['start']});
	firstDayStart = round_to_day_with_offset(firstDayStart, hourOffset);
 
 	// Also the start of the final day+1, which is how we use it here
	var finalDayEnd = d3.max(data,function(d) {return d['end']});
	finalDayEnd = d3.time.day.offset(finalDayEnd,1);
	finalDayEnd = round_to_day_with_offset(finalDayEnd, hourOffset);
 
	var x = d3.time.scale().domain([firstDayStart,finalDayEnd]).range([0,chartWidth]);

	var xAxis = d3.svg.axis()
				  .ticks(d3.time.mondays)
				  .tickSubdivide(6)
				  .tickSize(4, 2, 0)
				  .tickFormat(longTimeFormat())
                  .scale(x)
                  .orient("bottom");

	var brush = d3.svg.brush()
    	.x(x)
    	.on("brush", brushed);

	function brushed() {
	  //x.domain(brush.empty() ? x2.domain() : brush.extent());
	  //focus.select("path").attr("d", area);
	  //focus.select(".x.axis").call(xAxis);
	  console.log("BRUSHED!");
	}

	main_chart.selectAll("g.sleep")
		.data(data)
		.enter().append("g").attr("class","sleep")
		.attr("data-dayStart", function (d) {return d['start'];})
		.attr("data-dayEnd", function (d) {return d['end'];})
		.selectAll("rect.segment").data(createSleepGraphBarsFunction({
			hourOffset: hourOffset,
			x: x,
			chartHeight: chartHeight,
			chartWidth: chartWidth
		})).enter().append("rect").attr("class","segment")
		.attr("x", function(d) {
			return d['x'];
		})
		.attr("y", function(d) {
			return d['y'];
		})
	    .attr("height", function(d) {
	    	return d['height'];
	    })
	    .attr("width", function(d) {
	    	return barThickness;
	    });

	    main_chart.append("g")
      		.attr("class", "x brush")
      		.call(brush)
    		.selectAll("rect")
      		.attr("y", 0)
      		.attr("height", chartHeight);

      	main_chart.append("g")
      		.attr("class", "axis")
      		.attr("transform", "translate(0," + (chartHeight + margin.top) + ")")
      		.call(xAxis);
}
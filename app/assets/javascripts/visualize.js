window.onload = function () {
	//var d = fake_sleep_generator(60);
	console.log("Get DATA");
	var d = JSON.parse(document.getElementById('current-graph-container').getAttribute('data-url'));
	console.log("Parse Data");
	d = parse_data(d);
	console.log("Vis Data");
	//console.log(d);
	visualize_sleepdata(d);	
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
	roundFunc = roundFunc || d3.time.day.round
	var time = d3.time.hour.offset(time,-hourOffset);
	time = roundFunc(time);
	time = d3.time.hour.offset(time,hourOffset);
	return time;
}

function parse_data(d) {
	var data = [];
	for (var i = 0; i < d.length; i++) {
		console.log(i);
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
			//throw "DIE!";
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
 
function visualize_sleepdata(data) {
	var chartHeight = 110;
	var chartWidth = 1500;
	var hourOffset = 8; // Must be positive in current implementation
	var barThickness = 10;
	var barPadding = 1;
 
	var main_chart = d3.select("#overview-graph-container").append("svg");
	main_chart.attr("class", "chart").attr("height", chartHeight);
 
	var veryBeginning = d3.min(data,function(d) {return d['start']});
	veryBeginning = round_to_day_with_offset(veryBeginning, hourOffset);
 
	var veryEnd = d3.max(data,function(d) {return d['end']});
	veryEnd = d3.time.day.offset(veryEnd,1);
	veryEnd = round_to_day_with_offset(veryEnd, hourOffset);
 
	var x = d3.time.scale().domain([veryBeginning,veryEnd]).range([0,1]);

	var x_brush = d3.time.scale().domain([veryBeginning,veryEnd]).range([0,chartWidth]);
 
	var brush = d3.svg.brush()
    	.x(x_brush)
    	.on("brush", brushed);

	function brushed() {
	  //x.domain(brush.empty() ? x2.domain() : brush.extent());
	  //focus.select("path").attr("d", area);
	  //focus.select(".x.axis").call(xAxis);
	  console.log("BRUSHED!");
	}

    main_chart.append("g")
      .attr("class", "x brush")
      .call(brush)
    .selectAll("rect")
      .attr("y", -6)
      .attr("height", chartHeight + 7);

	main_chart.selectAll("g.sleep")
		.data(data)
		.enter().append("g").attr("class","sleep")
		.attr("data-dayStart", function (d) {return d['start'];})
		.attr("data-dayEnd", function (d) {return d['end'];})
		.selectAll("rect.segment").data(function(d) {
 
			var segs = [];
 
			var sleepStart = d['start'];
			var sleepEnd = d['end'];
 
			var dayStart = round_to_day_with_offset(sleepStart, hourOffset);
			var dayEnd = d3.time.day.offset(dayStart, 1);
			var y = d3.time.scale().domain([dayStart,dayEnd]).range([0,1]);
 
			var h = (y(sleepEnd)-y(sleepStart));
 
			var wakeupDay = round_to_day_with_offset(sleepEnd, hourOffset);
 
			//segs.push({'x': x(dayStart)*chartWidth, 'y': y(sleepStart)*chartHeight, 'height': h*chartHeight});
 
			while (sleepStart < sleepEnd) {
				dayStart = round_to_day_with_offset(sleepStart, hourOffset);
				dayEnd = d3.time.day.offset(dayStart, 1);
				y = d3.time.scale().domain([dayStart,dayEnd]).range([0,1]);
 
				h = (Math.min(y(sleepEnd),1)-y(sleepStart));
				segs.push({'x': x(dayStart)*chartWidth, 'y': y(sleepStart)*chartHeight, 'height': h*chartHeight});
 
				sleepStart = round_to_day_with_offset(sleepStart, hourOffset);
				sleepStart = d3.time.day.offset(sleepStart, 1);			
			}
			
			//segs.push({'x': x(wakeupDay)*chartWidth, 'y': (y(sleepEnd)%1)*chartHeight, 'height': 2});
 
			return segs;
		}).enter().append("rect").attr("class","segment")
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
}
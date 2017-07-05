var spiderPlotGraph = (function() {
	var myPlot;
    var showControls = true;
	var xAxisMax = 0;
    var xAxisMin = 0;
    var grouplist = [];
	
	return {
		setGraphNode: function(graphDiv) {
            myPlot = graphDiv;
        },
        setControlsVisibility: function(show) {
            showControls = show;
        },
        renderPlot: function(animals, groupMap, study) {
            grouplist.length = 0; // reset on every render
            var traces = animals.filter(function(animal) { 
                if(!showControls && groupMap[animal.group_name].isControl) {
                    return false;
                }
                return true;
            }).map(function(animal) {
                var group = groupMap[animal.group_name];

                var showLegend = false;
                
                if(grouplist.indexOf(group.groupLabel) === -1) {
                    grouplist.push(group.groupLabel);
                    showLegend = true;
                }
				
                if(group.nearEndMeasDay > xAxisMax) xAxisMax = group.nearEndMeasDay;
                if(group.nearStartMeasDay < xAxisMin) xAxisMin = group.nearStartMeasDay;

                return {
                    name: group.groupLabel,
                    x: animal.measurements.map(function(meas) {return meas.measurement_day}),
                    y: animal.measurements.map(function(meas) {return meas.measurement_value}),
                    text: animal.measurements.map(function(meas) {
                        return " ID: <b>" + animal.animal_name 
                            + "</b> ; DAY: <b>" + meas.measurement_day 
                            + "</b> ; VOLUME: <b>" + Math.round(meas.measurement_value) + "</b> ";
                        }
                    ),
                    type: 'scatter',
                    mode: 'lines',
                    showlegend: showLegend,
                    legendgroup: group.groupLabel,
                    hoverinfo: 'text',
                    marker: {
                        color: (group.color !== null) ? group.color : PlotLib.colors[group.index % PlotLib.colors.length]
                    }
                }
            });

            // plot titles might take more space than the available width; if so, the title needs to be broken on 2 lines
            var title = PlotLib.fitTextOnScreen(study.curated_study_name, myPlot.offsetWidth);
            var layout = {
                // autosize: false,
                title: title,
                titlefont: PlotLib.titlefont,
                yaxis: {
                    title: 'Tumor Volume (mm<sup>3</sup>)',
                    ticks: "outside",
                    ticksuffix: " "
                },
                xaxis: {
                    title: 'Day of Study'
                },
                width: myPlot.offsetWidth,
                height: myPlot.offsetHeight,
                legend: {
                    bgcolor: 'none',
                    x: 0.05,
                    y: 0.95
                },
                hovermode: 'closest'
            };

            Plotly.newPlot(myPlot, traces, layout, PlotLib.modebar);
        }
    };
}());
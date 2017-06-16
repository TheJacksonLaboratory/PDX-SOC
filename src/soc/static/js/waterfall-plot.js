var waterfallPlotGraph = (function() {
    var waPlot;
    
    // hard modebar object copy
    // var modebarWF = JSON.parse(JSON.stringify(PlotLib.modebar));
    // waterfall specific modebar options
    // modebarWF.modeBarButtonsToRemove.push("zoomIn2d", "zoomOut2d", "zoom2d");
	
    return {
        setGraphNode: function(graphDiv) {
            waPlot = graphDiv;
        },
        renderPlot: function(yAxisType, animals, groups, study) {
            // shallow array copy
            animals = animals.slice(0);
            
            let yAxisKey;
            if(yAxisType === 'rel-vol') {
                yAxisKey = 'percent_change_volume';
            } else if(yAxisType === 'rel-change') {
                yAxisKey = 'measurement_fold_change';
            }

            animals.sort(function(animal1, animal2) {
                return animal2[yAxisKey] - animal1[yAxisKey];
            });
            animals.forEach(function(animal, i) {
                animal.index = i;
            });

            var traces = groups.map(function(group) {
                var grpLbl =
                    group.groupLabel + ' [days ' +
                    group.nearStartMeasDay + '-' + group.nearEndMeasDay + ']';
                return {
                    name: grpLbl,
                    x: group.animals.map(function(animal) {return animal.index}),
                    y: group.animals.map(function(animal) {return animal[yAxisKey]}),
                    text: group.animals.map(function(animal) {
                        let textTooltip = " ID: <b>" + animal.animal_name 
                            + "</b><br> Start Day: <b>" + animal.start_day_measurement.measurement_value
                            + "</b><br> End Day: <b>" + animal.end_day_measurement.measurement_value
                            + "</b><br> Value: <b>" + animal[yAxisKey] + "</b> ";
                        return textTooltip;
                    }),
                    type: 'bar',
                    showlegend: true,
                    hoverinfo: 'text',
                    marker: {
                        color: (group.color !== null) ? group.color : PlotLib.colors[group.index % PlotLib.colors.length]
                    }
                };
            });

            var yAxisTitle;
            if(yAxisType === 'rel-vol') {
                yAxisTitle = 'Change in Tumor Volume (%)';
            } else if(yAxisType === 'rel-change') {
                yAxisTitle = 'Fold Change in Tumor Volume (mm<sup>3</sup>)';
            }

			var layout = {
                title: study.curated_study_name,
                titlefont: PlotLib.titlefont,
                yaxis: {
                    title: yAxisTitle,
                    showline: true,
                    ticks: "outside",
                    ticksuffix: " ",
                    showticklabels: true
                },
                xaxis: {
                    title: 'Animals',
                    showticklabels: false
                },
                width: waPlot.offsetWidth,
                height: waPlot.offsetHeight,
                legend: {
                    bgcolor: 'lighgrey',	
                    xanchor: 'right',
                    yanchor: 'top'
                },
                bargap: 0.1
            };
            Plotly.newPlot(waPlot, traces, layout, PlotLib.modebar);
        }
    };
}());
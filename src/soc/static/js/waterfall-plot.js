var waterfallPlotGraph = (function() {
    var myPlot;
    
    // hard modebar object copy
    var modebarWF = JSON.parse(JSON.stringify(modebar));
    // waterfall specific modebar options
    modebarWF.modeBarButtonsToRemove.push("zoomIn2d", "zoomOut2d", "zoom2d");
	
    return {
        setGraphNode: function(graphDiv) {
            myPlot = graphDiv;
        },
        renderPlot: function(yAxisType, animals, groups, study) {
            // shallow array copy
            animals = animals.slice(0);
            
            var yAxisKey;
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
                        return " <b>" + animal[yAxisKey] + "</b> ";
                    }),
                    type: 'bar',
                    showlegend: true,
                    hoverinfo: 'text',
                    marker: {
                        color: (group.color !== null) ? group.color : colors[group.index % colors.length]
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
                // autosize: false,
                title: study.curated_study_name,
                titlefont: titlefont,
                yaxis: {
                    title: yAxisTitle,
                    showline: true,
                    ticks: "outside",
                    ticksuffix: " ",
                    showticklabels: true
                },
                xaxis: {
                    title: 'Animals',
                    ticks: "",
                    showticklabels: false
                },
                width: myPlot.offsetWidth,
                height: myPlot.offsetHeight,
                legend: {
                    bgcolor: 'lighgrey',
                    xanchor: 'right',
                    yanchor: 'top'
                },
                bargap: 0.1
            };
            Plotly.newPlot(myPlot, traces, layout, modebarWF);
        }
    };
}());
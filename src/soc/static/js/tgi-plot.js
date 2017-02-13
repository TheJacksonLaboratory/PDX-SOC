var tgiPlotGraph = (function() {
    var myPlot;
    
    function groupEndDayMean(group) {
        var meanStddevResult = meanStddev(group.animals.map(function(animal) {
            return animal.end_day_measurement.measurement_value;
        }));
        return meanStddevResult.mean;
    }
	
    return {
        setGraphNode: function(graphDiv) {
            myPlot = graphDiv;
        },
        renderPlot: function(groups, study) {
            var vehicleGroup = groups[0];
            
            var vehicleFinalMean = groupEndDayMean(vehicleGroup);
            
            groups = groups.slice(0,1).concat(groups.slice(1).sort(function(a, b) {
                return groupEndDayMean(b) - groupEndDayMean(a);
            }));
            
            var tgiTraces1 = groups.map(function(group) {
                var roundedMean = Math.round(100 * (groupEndDayMean(group) / vehicleFinalMean));
                var hoverInfo = 'skip';
                // bars for groups (including control) that have higer increase than control will show text on hover
                if(100 <= roundedMean) {
                    hoverInfo = 'x+text';
                }
            
                return {
                    name: group.groupLabel,
                    x: [group.groupLabel],
                    y: [roundedMean],
                    text: (group.isControl === 1) ? [" CONTROL GROUP "] : [group.groupLabel + " : " + (roundedMean - 100) + "% increase"],
                    type: 'bar',
                    hoverinfo: hoverInfo,
                    marker: {
                        color: (group.color !== null) ? group.color : colors[group.index % colors.length]
                    }
                };
            });
            
            var tgiTraces2 = groups.map(function(group) {
                var roundedMean = Math.round(100 * (groupEndDayMean(group) / vehicleFinalMean));
                var hoverInfo = 'skip';
                var reductionFromControl = 0;
                if(100 > roundedMean) {
                    reductionFromControl = 100 - roundedMean;
                    hoverInfo = 'x+text';
                }
                
                return {
                    name: group.groupLabel,
                    x: [group.groupLabel],
                    y: (100 > roundedMean) ? [reductionFromControl - 0.5] : [reductionFromControl],
                    text:[group.groupLabel + " : " + reductionFromControl + "% reduction"],
                    textposition: 'bottom',
                    hoverinfo: hoverInfo,
                    type: 'bar',
                    width: 0.02,
                    showlegend: false,
                    marker: {
                        color: (group.color !== null) ? group.color : colors[group.index % colors.length]
                    }
                };
            });
            
            var tgiTraces3 = groups.map(function(group) {
                var horizontalBar = 0;
                if(100 > Math.round(100 * (groupEndDayMean(group) / vehicleFinalMean))) {
                    horizontalBar = 0.5;
                }
                return {
                    hoverinfo: 'skip',
                    x: [group.groupLabel],
                    y: [horizontalBar],
                    type: 'bar',
                    showlegend: false,
                    marker: {
                        color: (group.color !== null) ? group.color : colors[group.index % colors.length]
                    }
                };
            });
            
            var tgiFinal = tgiTraces1.concat(tgiTraces2);
            var tgiFinal1 = tgiFinal.concat(tgiTraces3);
            var annotationContent = [];
            
            var tgiLayout = {
                autosize: false,
                title: study.curated_study_name,
                yaxis: {
                    title: 'Tumor Volume Percentage (%)'
                },
                barmode:'relative',
                xaxis: {
                    showticklabels: true,
                    tickangle: 15,
                    tickfont: {
                        family: 'Arial, sans-serif',
                        size: 14
                    }
                },
                width: myPlot.offsetWidth,
                height: myPlot.offsetHeight,
                margin: {
                    b: 120
                },
                annotations: annotationContent
            };
            
            for(var i = 0 ; i < groups.length ; i++) { 
                var annotationText;
                var roundedMean = Math.round(100 * (groupEndDayMean(groups[i]) / vehicleFinalMean));
                if(100 > roundedMean) {
                    // annotationText = (100 - roundedMean) + "% reduction";
                    annotationText = (100 - roundedMean) + "%";
                } else if(100 === roundedMean) {
                    if(groups[i].index === 0) {
                        annotationText = "CONTROL GROUP";
                    } else {
                        annotationText = "no change";
                    }
                } else {
                    // annotationText = (roundedMean - 100) + "% increase";
                    annotationText = (roundedMean - 100) + "%";
                }
                
                var result = {
                    x: groups[i].groupLabel,
                    y: roundedMean,
                    text: annotationText,
                    xanchor: 'center',
                    yanchor: 'bottom',
                    showarrow: false
                };
                annotationContent.push(result);
            }
            
            Plotly.newPlot(myPlot, tgiFinal1, tgiLayout, modebar);
        }
    };
}());
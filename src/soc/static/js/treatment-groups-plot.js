"use strict"

var treatmentGroupPlot = (function() {
    let tgPlot;

    return {
        setGraphNode: function(graphDiv) {
            tgPlot = graphDiv;
        },
        renderPlot: function(yAxisType, measurements, treatments, groups, study) {
            // build-up per group traces for treatments
			// plot TREATMENTS
            let traceTreatments = groups.map(function(group) { 
                // group treatments by day
                let treatTextByDay = group.uniqTreatDays.map(function(measday) { 
                    return "DAY: " + measday + ", " + group.groupLabel; 
                });

                return {
                    x: group.uniqTreatDays,
                    y: group.uniqTreatDays.map(function() { 
                        return group.groupLabel
                    }),
                    text: treatTextByDay,
                    type: "scatter",
                    showlegend: false,
                    mode: "markers",
                    marker: {
                        color: (group.color !== null) ? group.color : PlotLib.colors[group.index % PlotLib.colors.length]
                    },
                    hoverinfo: "text"
                }
            });

            traceTreatments.reverse();

			// plot MEASUREMENTS
            let traceMeasurements = groups.map(function(group) {
				var measGrpByDay = group.uniqMeasureDays.map(function() {
                    return [];
                });
                
                group.animals.forEach(function(animal) {
                    animal.measurements.forEach(function(measurement) {
                        var dayIndex = PlotLib.binarySearch(group.uniqMeasureDays, measurement.measurement_day);
                        if(dayIndex >= 0) {
                            var currVal;
                            if(yAxisType === 'abs-vol') {
                                currVal = measurement.measurement_value;
                            } else if(yAxisType === 'rel-change') {
                                var startVal = animal.start_day_measurement.measurement_value;
                                currVal = (measurement.measurement_value - startVal) / startVal;
                            }
                            measGrpByDay[dayIndex].push(currVal);
                        }
                    });
                });
                
                var means = [];
                var errorVals = [];
                measGrpByDay.forEach(function(measDayGrp) {
                    var meanStdVal = PlotLib.meanStderrStddev(measDayGrp);
                    if(yAxisType === 'abs-vol') {
                        means.push(Math.round(meanStdVal.mean));
                        errorVals.push(Math.round(meanStdVal.stdErr));
                    } else if(yAxisType === 'rel-change') {
                        means.push(PlotLib.roundTo(meanStdVal.mean, 2));
                        errorVals.push(PlotLib.roundTo(meanStdVal.stdErr, 2));
                    }
                });
				
				
                return {
                    name: group.groupLabel,
                    x: group.uniqMeasureDays,
                    y: means,
                    xaxis: "x2",
                    yaxis: "y2",
                    text: measGrpByDay.map(function(dayGrp, index) {
                        let msg = "   <b>DAY:</b> " + group.uniqMeasureDays[index];
                        msg = msg + ",  <b>x&#772;:</b> " + means[index];
                        msg = msg + ",  <b>&#963;<sub>x&#772;</sub>:</b> &#8723;" + errorVals[index];
                        msg = msg + ",  <b>N:</b> " + dayGrp.length + "  ";
                        return msg;
                    }),
                    error_y: {
                        type: 'data',
                        array: errorVals,
                        visible: true,
                        color: (group.color !== null) ? group.color : PlotLib.colors[group.index % PlotLib.colors.length]
                    },
                    type: "scatter",
                    hoverinfo: 'text',
                    marker: {
                        color: (group.color !== null) ? group.color : PlotLib.colors[group.index % PlotLib.colors.length]
                    }
				}
            });


            let data = new Array();
            for(let i = 0; i < groups.length; i++) {
                if(traceTreatments[i]) {
                    data.push(traceTreatments[i]);
                }
                if(traceMeasurements[i]) {
                    data.push(traceMeasurements[i]);
                }
            }
			
            // determine X-axis range
            let minDay = null;
            let maxDay = null;
            measurements.forEach(function(measurement) {
                let day = measurement['measurement_day'];
                if(minDay === null || day < minDay) {
                    minDay = day;
                }
                if(maxDay === null || day > maxDay) {
                    maxDay = day;
                }
            });
			
            treatments.forEach(function(treatment) {
                var day = treatment['treatment_day'];
                if(minDay === null || day < minDay) {
                    minDay = day;
                }
                if(maxDay === null || day > maxDay) {
                    maxDay = day;
                }
            });
			
            let yAxisTitle;
            if(yAxisType === 'abs-vol') {
                yAxisTitle = 'Tumor Volume (mm<sup>3</sup>)';
            } else if(yAxisType === 'rel-change') {
                yAxisTitle = 'Fold Change in Tumor Volume';
            }

            // plot titles might take more space than the available width; if so, the title needs to be broken on 2 lines
            let title = PlotLib.fitTextOnScreen(study.curated_study_name, tgPlot.offsetWidth);
            let layout = {
                title: title,
                titlefont: PlotLib.titlefont,
                yaxis: {
                    title: "Treatments",
                    domain: [0, 0.35],
                    showline: true,
					zeroline: false,
                    showticklabels: false
                },
                xaxis: {
                    title: "Day of Study",
                    range: [minDay, maxDay],
					zeroline: false,
                    showline: true,
                    ticks: "outside",
                    ticksuffix: " ",
                    showticklabels: true
                },
                yaxis2: {
                    title: yAxisTitle,
                    domain: [0.36, 1],
                    zeroline: false,
                    showline: true,
                    ticks: "outside",
                    ticksuffix: " ",
                    showticklabels: true
                },
                xaxis2: {
					anchor: "y2",
                    range: [minDay, maxDay],
                    zeroline: false,
                    showline: false,
                    showticklabels: false
				},
                width: tgPlot.offsetWidth,
                height: tgPlot.offsetHeight,
				legend: {
                    bgcolor: 'none',
                    x: 0.05,
                    y: 0.95
                },
                hovermode: 'closest'
            };

            Plotly.newPlot(tgPlot, data, layout, PlotLib.modebar);
		}
	};
}());
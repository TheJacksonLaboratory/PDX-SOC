var treatmentGroupPlotGraph = (function() {
    var myPlot;
    
    return {
        setGraphNode: function(graphDiv) {
            myPlot = graphDiv;
        },
        renderPlot: function(yAxisType, measurements, treatments, groups, study) {
            // build up per-group traces for measurements
            var treatmentGrpTraces = groups.map(function(group) {
                var measGrpByDay = group.uniqMeasureDays.map(function() {
                    return [];
                });
                
                group.animals.forEach(function(animal) {
                    animal.measurements.forEach(function(measurement) {
                        var dayIndex = binarySearch(group.uniqMeasureDays, measurement.measurement_day);
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
                    var meanStdVal = meanStderrStddev(measDayGrp);
                    if(yAxisType === 'abs-vol') {
                        means.push(Math.round(meanStdVal.mean));
                        errorVals.push(Math.round(meanStdVal.stdErr));
                    } else if(yAxisType === 'rel-change') {
                        means.push(roundTo(meanStdVal.mean, 2));
                        errorVals.push(roundTo(meanStdVal.stdErr, 2));
                    }
                });

                return {
                    name: group.groupLabel,
                    x: group.uniqMeasureDays,
                    y: means,
                    text: measGrpByDay.map(function(dayGrp, index) {
                        var msg = "   <b>DAY:</b> " + group.uniqMeasureDays[index];
                        msg = msg + ",  <b>x&#772;:</b> " + means[index];
                        msg = msg + ",  <b>&#963;<sub>x&#772;</sub>:</b> &#8723;" + errorVals[index];
                        msg = msg + ",  <b>N:</b> " + dayGrp.length + "  ";
                        return msg;
                    }),
                    error_y: {
                        type: 'data',
                        array: errorVals,
                        visible: true,
                        color: (group.color !== null) ? group.color : colors[group.index % colors.length]
                    },
                    type: 'scatter',
                    hoverinfo: 'text',
                    marker: {
                        color: (group.color !== null) ? group.color : colors[group.index % colors.length]
                    }
                }
            });
            
            // build up per-group traces for treatments
            var treatmentGrpTraces2 = groups.map(function(group) {
                // group treatments by day for plot
                var treatTextByDay = group.uniqTreatDays.map(function() {return []});
                group.animals.forEach(function(animal) {
                    animal.treatments.forEach(function(treatment) {
                        var dayIndex = binarySearch(group.uniqTreatDays, treatment.treatment_day);
                        if(dayIndex >= 0) {
                            var treatmentText =
                                treatment.dose_activity + ' (' +
                                treatment.test_material_amount + ' ' +
                                treatment.administration_route_units + ')';
                                insertUnique(treatTextByDay[dayIndex], treatmentText, compareBasic);
                        }
                    });
                });

                return {
                    name: group.groupLabel + ' treatments',
                    x: group.uniqTreatDays,
                    y: group.uniqTreatDays.map(function() {return group.groupLabel}),
                    text: treatTextByDay.map(function(treatmentTextArray) {
                        return treatmentTextArray.join(', ');
                    }),
                    xaxis: 'x2',
                    yaxis: 'y2',
                    type: 'scatter',
                    showlegend: false,
                    mode: 'lines+markers',
                    marker: {
                        color: (group.color !== null) ? group.color : colors[group.index % colors.length]
                    },
                    hoverinfo: 'text+x'
                };
            });
            treatmentGrpTraces2.reverse();
            
            var minDay = null;
            var maxDay = null;
            measurements.forEach(function(measurement) {
                var day = measurement['measurement_day'];
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
			
            var yAxisTitle;
            if(yAxisType === 'abs-vol') {
                yAxisTitle = 'Tumor Volume (mm<sup>3</sup>)';
            } else if(yAxisType === 'rel-change') {
                yAxisTitle = 'Fold Change in Tumor Volume';
            }
            
            var treatmentGrpLayout = {
                // autosize: false,
                title: study.curated_study_name,
                titlefont: titlefont,
                xaxis: {
                    range: [minDay, maxDay],
                    showticklabels: false
                },
                yaxis: {
                    title: yAxisTitle,
                    domain: [0.3, 1.0]
                },
                xaxis2: {
                    title: 'Day of Study',
                    anchor: 'y2',
                    range: [minDay, maxDay]
                },
                yaxis2: {
                    title: 'Treatments',
                    domain: [0.0, 0.3],
                    tickmode: 'array',
                    tickvals: groups.map(function(group) {return group.groupLabel}),
                    showticklabels: false
                },
                width: myPlot.offsetWidth,
                height: myPlot.offsetHeight,
                hovermode: 'closest'
            };
            
            Plotly.newPlot(myPlot, treatmentGrpTraces.concat(treatmentGrpTraces2), treatmentGrpLayout, modebar);
		}
	};
}());
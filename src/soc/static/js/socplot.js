"use strict";

/**
 * This function takes two parameters (x, y) and will return a number less than,
 * greater than or equal to zero depending on whether x is less than,
 * greater than or equal to y respectively. The '<' and '>' operators
 * are used to order x and y.
 * @param x
 * @param y
 * @return {number}
 */
function compareBasic(x, y) {
    if(x < y) {
        return -1;
    } else if(x > y) {
        return 1;
    } else {
        return 0;
    }
}

/**
 * This function simply returns (x - y) and thus is a suitable comparison function
 * to use for sorting or searching numeric values
 * @param x {number}
 * @param y {number}
 * @return {number}
 */
function compareNumeric(x, y) {
    return x - y;
}

/**
 * Binary search which returns the matchin index -(insertIndex + 1) in the case that no match is found
 * @param array a sorted array
 * @param x the value we're searching for
 * @param [compFunc=compareNumeric] the function used to compare values for the binary search. This
 *          function takes two parameters (x, y) and will return a number less than, greater than or equal
 *          to zero depending on whether x is less than, greater than or equal to y respectively. This
 *          implementation guarantees that x is always the second parameter given to compFunc
 *          (so it is possible to perform a comparison where x is of a different type than the
 *          contents of the given array)
 * @return {number} the index
 */
function binarySearch(array, x, compFunc) {
    if(typeof compFunc === 'undefined') {
        compFunc = compareNumeric;
    }

    var low = 0;
    var high = array.length - 1;
    while (low <= high) {
        var mid = (low + high) >> 1;
        var midVal = array[mid];
        var compVal = compFunc(midVal, x);
        if(compVal < 0) {
            low = mid + 1;
        } else if(compVal > 0) {
            high = mid - 1;
        } else {
            return mid;
        }
    }

    return -(low + 1);
}

/**
 * Insert x into the given sorted array if it isn't already present (this function has no effect if the element is
 * already in the array).
 * @param array a sorted array
 * @param x the value to insert
 * @param [compFunc=compareNumeric] the function used to compare values for the binary search. This
 *          function takes two parameters (x, y) and will return a number less than, greater than or equal
 *          to zero depending on whether x is less than, greater than or equal to y respectively. This
 *          implementation guarantees that x is always the second parameter given to compFunc
 *          (so it is possible to perform a comparison where x is of a different type than the
 *          contents of the given array)
 */
function insertUnique(array, x, compFunc) {
    var idx = binarySearch(array, x, compFunc);
    if(idx < 0) {
        idx = -idx - 1;
        array.splice(idx, 0, x);
    }
}

/**
 *
 * @param nums
 * @return {{mean: number, stdDev: number}}
 */
function meanStddev(nums) {
    var sum = 0.0;
    var sumSq = 0.0;
    var count = nums.length;
    nums.forEach(function(num) {
        if(!isNaN(num)) {
            sum += num;
            sumSq += num * num;
        } else {
            count--;
        }
    });

    var mean = sum / count;
    return {
        mean: mean,
        stdDev: Math.sqrt((sumSq / count) - Math.pow(mean, 2)),
        count: count
    };
}

/**
 *
 * @param nums
 * @return {{mean: number, stdDev: number, stdErr: number}}
 */
function meanStderrStddev(nums) {
    var retVal = meanStddev(nums);
    retVal.stdErr = retVal.stdDev / Math.sqrt(retVal.count);

    return retVal;
}

var colors = [
    "#000000", "#1F78B4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f",
    "#FF7F00", "#cab2d6", "#6a3d9a"
];

var modebar = {
    displayModeBar: true, 
    displaylogo: false, 
    modeBarButtonsToRemove: ['sendDataToCloud']
};

// we want to capture the measurements nearest the start/stop of treatment
function findNearestMeasureDayIdx(uniqMeasurementDays, treatmentDay) {
    var idx = binarySearch(uniqMeasurementDays, treatmentDay);
    if(idx < 0) {
        idx = -idx - 1;
        if(idx > 0) {
            if(idx === uniqMeasurementDays.length) {
                idx--;
            } else {
                // see which of the neighboring days is closer
                var currDiff = uniqMeasurementDays[idx] - treatmentDay;
                var prevDiff = treatmentDay - uniqMeasurementDays[idx - 1];
                if(prevDiff < currDiff) {
                    idx--;
                }
            }
        }
    }

    return idx;
}


function WaterfallPlot(graphDiv) {
    this.graphDiv = graphDiv;

    this.renderPlot = function(yAxisType, animals, groups, study) {
        // shallow array copy
        animals = animals.slice(0);

        var yAxisKey;
        if(yAxisType === 'rel-vol') {
            yAxisKey = 'measurement_diff';
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
                hoverinfo: 'x+text',
                marker: {
                    color: (group.color !== null) ? group.color : colors[group.index % colors.length]
                }
            };
        });

        var yAxisTitle;
        if(yAxisType === 'rel-vol') {
            yAxisTitle = 'Change in Tumor Volume (mm<sup>3</sup>)';
        } else if(yAxisType === 'rel-change') {
            yAxisTitle = 'Fold Change in Tumor Volume (mm<sup>3</sup>)';
        }

        var layout = {
            title: study.curated_study_name,
            yaxis: {
                title: yAxisTitle
            },
            xaxis: {
                title: 'Animals',
                tickmode: 'array',
                tickvals: animals.map(function(animal) {return animal.index}),
                ticktext: animals.map(function(animal) {return animal.animal_name})
            },
            legend: {
                xanchor: 'right',
                yanchor: 'top'
            },
            bargap: 0.1
        };
        Plotly.newPlot(graphDiv, traces, layout, modebar);
    }
}


function TreatmentGroupPlot(graphDiv) {
    this.graphDiv = graphDiv;

    this.renderPlot = function(yAxisType, measurements, treatments, groups, study) {
		// build up per-group traces for measurements
        var treatmentGrpTraces = groups.map(function(group) {
            var measGrpByDay = group.uniqMeasureDays.map(function() {return []});
            
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
				means.push(Math.round(meanStdVal.mean));
                errorVals.push(Math.round(meanStdVal.stdErr));
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
            title: study.curated_study_name,
            xaxis: {
                range: [minDay, maxDay],
                showticklabels: false
            },
            yaxis: {
                title: yAxisTitle,
                domain: [0.3, 1.0]
            },
            xaxis2: {
                title: 'Day',
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
			hovermode: 'closest'
        };
        Plotly.newPlot(graphDiv, treatmentGrpTraces.concat(treatmentGrpTraces2), treatmentGrpLayout, modebar);
    };
}


function SpiderPlot(graphDiv) {
    this.graphDiv = graphDiv;
    var xAxisMax = 0;
    var xAxisMin = 0;
    this.renderPlot = function(animals, groupMap, study) {
        var spiderTraces = animals.map(function(animal) {
            var group = groupMap[animal.group_name];
            
            if(group.nearEndMeasDay > xAxisMax) xAxisMax = group.nearEndMeasDay;
            if(group.nearStartMeasDay < xAxisMin) xAxisMin = group.nearStartMeasDay;
            
            return {
                name: animal.animal_name,
                x: animal.measurements.map(function(meas) {return meas.measurement_day}),
                y: animal.measurements.map(function(meas) {return meas.measurement_value}),
				text: animal.measurements.map(function(meas) 
                    {
                        return " ID: <b>" + animal.animal_name 
                            + "</b> ; DAY: <b>" + meas.measurement_day 
                            + "</b> ; VOLUME: <b>" + Math.round(meas.measurement_value) + "</b> ";
                    }
                ),
                type: 'scatter',
                mode: 'lines',
                showlegend: false,
				hoverinfo: 'text',
                marker: {
                    color: (group.color !== null) ? group.color : colors[group.index % colors.length]
                }
            }
        });
        
		var spiderLayout = {
            title: study.curated_study_name,
            titlefont: {
                family: 'helvetica',
                size: 19
            },	
            yaxis: {
                title: 'Tumor Volume (mm<sup>3</sup>)',
                titlefont: {
                    family: 'helvetica',
                    size: 19
                }
            },
            xaxis: {
                title: 'Days Since Measurement Initiation',
                titlefont: {
                    family: 'helvetica',
                    size: 19
                } // , 
                // range: [xAxisMin - 0.5, xAxisMax + 0.5]
            },
            hovermode: 'closest'
        };
        Plotly.newPlot(graphDiv, spiderTraces, spiderLayout, modebar);
    };
}


function TGIPlot(graphDiv) {
    this.graphDiv = graphDiv;
    
    function groupEndDayMean(group) {
        var meanStddevResult = meanStddev(group.animals.map(function(animal) {
            return animal.end_day_measurement.measurement_value;
        }));
        return meanStddevResult.mean;
    }

    this.renderPlot = function(groups, study) {
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
			margin: {
				b: 120
			}, 
			annotations: annotationContent
        };
		
        for(var i = 0 ; i < groups.length ; i++) {
            var annotationText;
            var roundedMean = Math.round(100 * (groupEndDayMean(groups[i]) / vehicleFinalMean));
			if(100 > roundedMean) {
                annotationText = (100 - roundedMean) + "% reduction" ;
			} else if(100 === roundedMean) {
                if(groups[i].index === 0) {
                    annotationText = "CONTROL GROUP";
                } else {
                    annotationText = "no change";
                }
            } else {
                annotationText = (roundedMean - 100) + "% increase";
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
		
        Plotly.newPlot(graphDiv, tgiFinal1, tgiLayout, modebar);
    };
}

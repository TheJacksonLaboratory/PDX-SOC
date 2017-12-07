"use strict"

/**
* @file: treatment-groups-plot.js
* @fileOverview treatment groups plot rendering file
* @author georgi.kolishovski@jax.org
* @version 1.0
*/

/**
 * Copyright 2017 The Jackson Laboratory
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var treatmentGroupPlot = (function() {
    var tgPlot;
    var groupsToShow = [];

    return {
        setGraphNode: function(graphDiv) {
            tgPlot = graphDiv;
        },
        updateVisibleGroups: function(groupName) {
            var index = groupsToShow.indexOf(groupName);
            if(index !== -1) {
                groupsToShow.splice(index, 1);
            } else {
                groupsToShow.push(groupName);
            }
        },
        setLegendToggles: function(groups) {
            var container = document.getElementById("tg-legend-toggle-btns");

            for(var i in groups) {
                var htmlLabel = document.createElement("label");
                if(!groups[i].isControl) {
                    htmlLabel.className="btn btn-default togglesTooltip active";
                    htmlLabel.title = "Hide " + groups[i].groupLabel;

                    htmlLabel.style.background = (groups[i].color !== null) ? 
                        groups[i].color : PlotLib.colors[groups[i].index % PlotLib.colors.length];

                    groupsToShow.push(groups[i].groupName);

                    var labelParts = groups[i].groupLabel.split("+");
                    var htmlLabelText = "";
                    for(var p in labelParts) {
                        htmlLabelText += "+" + labelParts[p].trim().substring(0,1);
                    }

                    var textnode = document.createTextNode(htmlLabelText.substring(1));
                } else {
                    // control group is a special case
                    htmlLabel.className="btn btn-default togglesTooltip";
                    htmlLabel.title = "Show " + groups[i].groupLabel;
                    htmlLabel.style.background = "#FFFFFF";
                    htmlLabel.style.color = "#000000";
                    var textnode = document.createTextNode("Ctrl");
                }

                var input = document.createElement("input");
                input.type="checkbox";
                input.name = groups[i].groupLabel;
                input.autocomplete = "off";
                input.value = groups[i].groupName;
                htmlLabel.appendChild(input);
     
                htmlLabel.appendChild(textnode);

                container.appendChild(htmlLabel);
            }
        },
        renderPlot: function(yAxisType, measurements, treatments, groups, study) {
            // build-up per group traces for treatments
			// plot TREATMENTS
            var traceTreatments = groups.map(function(group) { 
                // group treatments by day
                var treatTextByDay = group.uniqTreatDays.map(function(measday) { 
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
            var traceMeasurements = groups.filter(function(group) {
                if(groupsToShow.indexOf(group.groupName) === -1) {
                    return false;
                }
                return true;
            }).map(function(group) {
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
                        color: (group.color !== null) ? group.color : PlotLib.colors[group.index % PlotLib.colors.length]
                    },
                    type: "scatter",
                    hoverinfo: 'text',
                    marker: {
                        color: (group.color !== null) ? group.color : PlotLib.colors[group.index % PlotLib.colors.length]
                    }
				}
            });


            var data = new Array();
            for(var i = 0; i < groups.length; i++) {
                if(traceTreatments[i]) {
                    data.push(traceTreatments[i]);
                }
                if(traceMeasurements[i]) {
                    data.push(traceMeasurements[i]);
                }
            }
			
            // determine X-axis range
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

            var tickVals = PlotLib.plotTickVals(minDay, maxDay, 5.0); // 5.0 is the tick step
 
            var yAxisTitle;
            if(yAxisType === 'abs-vol') {
                yAxisTitle = 'Tumor Volume (mm<sup>3</sup>)';
            } else if(yAxisType === 'rel-change') {
                yAxisTitle = 'Fold Change in Tumor Volume';
            }

            // plot titles might take more space than the available width; if so, the title needs to be broken on 2 lines
            var title = PlotLib.fitTextOnScreen(study.curated_study_name, tgPlot.offsetWidth);
            var layout = {
                autosize: false,
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
                    range: [minDay - 0.5, maxDay + 0.5],
                    zeroline: false,
                    showline: true,
                    ticks: "",
                    showticklabels: true,
                    tickmode: "array",
                    tickvals: tickVals,
                    ticktext: tickVals
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
                    range: [minDay - 0.5, maxDay + 0.5],
                    zeroline: false,
                    showline: false,
                    showticklabels: false,
                    tickmode: "array",
                    tickvals: tickVals,
                    ticktext: tickVals
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
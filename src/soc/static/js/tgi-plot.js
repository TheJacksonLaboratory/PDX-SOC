/**
* @file: tgi-plot.js
* @fileOverview TGI plot rendering file
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


var tgiPlotGraph = (function() {
    var myPlot;
    var marginBottom = 0;

    // hard modebar object copy
    var modebarTGI = JSON.parse(JSON.stringify(PlotLib.modebar));
    // TGI specific modebar options
    modebarTGI.modeBarButtonsToRemove.push("zoomIn2d", "zoomOut2d", "zoom2d");

    /**
    *  calculates the group tumor volume mean at the end of the study.
    *  
    *  @param {object} storing group information
    *  @return {number} the mean tumor volume across all the animals in that group
    *  
    */
    function groupEndDayMean(group) {
        var meanStddevResult = PlotLib.meanStddev(group.animals.map(function(animal) {
            return animal.end_day_measurement.measurement_value;
        }));
        return meanStddevResult.mean;
    }
	
    /**
    *  parses the information in an SVG <path> {d} attribute
    *	
    *  @param: {string} - ex. "M24.27,420V21H97.07V420Z"
    *  @return: {array} - ex. [{"M":[24.27, 420]}, {"V":[21]}, {"H": [97.07]}, {"V":[420]}]
    */
    function parsePathCoordinates(s) {
        var res = [];
        var commands = s.split(/(?=[MmLlHhVvCcSsQqTtAaZz])/);
        
        for(var i  = 0; i < commands.length; i++) {
            var o = {};    
            var command = commands[i].substring(0,1);
			
            switch(command) {
                case "M": case "m": case "L": case "l":
                    var val = commands[i].substring(1).split(",");
				    o[command] = [parseFloat(val[0]), parseFloat(val[1])];
				    break;
                case "H": case "h": case "V": case "v":
                    o[command] = [parseFloat(commands[i].substring(1))];
                    break;
                default:
                    console.log("TGI plot: unrecognized path command: " + command);
                    break;
			}
			
            res.push(o);
		}
        
        return res;
    }


    return {
        setGraphNode: function(graphDiv) {
            myPlot = graphDiv;
        },
        renderPlot: function(groups, study) {
            var vehicleGroup = groups[0];
            
            var vehicleFinalMean = groupEndDayMean(vehicleGroup);
            // reorders the treatment groups based on their final tumor volume mean 
            // the group having the smallest tumor volume mean is positioned last in the array 
            groups = groups.slice(0,1).concat(groups.slice(1).sort(function(a, b) {
                return groupEndDayMean(b) - groupEndDayMean(a);
            }));

            var bottomBars = groups.map(function(group) {
                var roundedMean = Math.round(100 * (groupEndDayMean(group) / vehicleFinalMean));
                var hoverInfo = 'skip';
                // bars for those groups (including control) that have higher Tumor Volume Mean than control 
                // need to show text here because they will have no 'reduction' bars and annnotations
                if(100 < roundedMean) { hoverInfo = "x+text"; }

                if(PlotLib.getLabelLenPx(group.groupLabel) > marginBottom) {
                    marginBottom = PlotLib.getLabelLenPx(group.groupLabel);
                }

                return {
                    name: group.groupLabel,
                    x: [group.groupLabel],
                    y: [roundedMean],
					xaxis: "x",
                    yaxis: "y",
                    text: (group.isControl === 1) ? [" CONTROL "] : [group.groupLabel + " : " + (roundedMean - 100) + "% increase"],
                    type: "bar",
                    hoverinfo: hoverInfo,
                    marker: {
                        color: (group.color !== null) ? group.color : PlotLib.colors[group.index % PlotLib.colors.length],
                        line: {
                            width: 1
                        }
                    },
                    width: 0.6
                };
            });

            var errorBars = groups.map(function(group) {
                var roundedMean = Math.round(100 * (groupEndDayMean(group) / vehicleFinalMean));
                
				// calculate the standard error (end day measurement for all animals in the group)
                // collect the ...
				var lastdaymeas = [];
				
                group.animals.forEach(function(animal) {
                    lastdaymeas.push(animal.end_day_measurement.measurement_value);
                });

                return {
                    x: [group.groupLabel],
                    y: [roundedMean],
                    text: [roundedMean].map(function(m) {
                        var msg = "<b>x&#772;:</b> " 
                            + Math.round(PlotLib.meanStderrStddev(lastdaymeas).mean) 
                            + ", <b>&#963;<sub>x&#772;</sub>:</b> &#8723; " 
                            + Math.round(PlotLib.meanStderrStddev(lastdaymeas).stdErr);
						return msg;
					}),
                    error_y: {
                        type: "data",
                        array: [Math.round(100 * (PlotLib.meanStderrStddev(lastdaymeas).stdErr/ vehicleFinalMean))],
                        visible: group.isControl ? false : true,
                        color: "black"
                    },
                    mode: group.isControl ? "none" : "markers",
                    hoverinfo: "text",
                    type: "bar",
                    showlegend: false,
                    marker: {
                        color: (group.color !== null) ? group.color : PlotLib.colors[group.index % PlotLib.colors.length],
						line: {
							width: 0
						}
                    },
                    offset: 0.194,
					width: 0.1
                }			
            });

            var maxMean = Math.round(100 * (groupEndDayMean(groups[1]) / vehicleFinalMean));
            
			var refLine = {
                x: [groups[0].groupLabel, groups[groups.length-1].groupLabel],
                y: [99.7, 99.7],
                xaxis: "x",
                yaxis: "y",
                type: 'scatter'	,
                mode: 'lines',
                hoverinfo: 'none',
                showlegend: false,
                line: {
                    color: "black",
                    width: 2
                }
            }; 

            var tgiData = new Array();
 
            tgiData.push.apply(tgiData, bottomBars);
            // tgiData.push.apply(tgiData, errorBars);
            tgiData.push(refLine);

            var annotationContent = [];
			
            var maxTickValue = 100;
            if(maxMean > 100) {
                maxTickValue = PlotLib.roundToMultiple(maxMean, 20);
            }

			var tickVals = new Array((maxTickValue / 20) + 1); // put tick mark / label every 20 steps / percentages
			var tickText = new Array((maxTickValue / 20) + 1); 
            for(let i = 0; i < tickVals.length; i++) {
                tickVals[i] = i * 20;
                // convert to string and append a space for better padded tick label
                tickText[i] = (100 - (i * 20)).toString() + " "; 
            }
 
            // plot titles might take more space than the available width; if so, the title needs to be broken on 2 lines
            var title = PlotLib.fitTextOnScreen(study.curated_study_name, myPlot.offsetWidth);
            var tgiLayout = {
                autosize: false,
                title: title,
                titlefont: PlotLib.titlefont,
                yaxis: {
                    title: '% TGI',
                    zeroline: false,
                    showline: true,
                    showgrid: true,
                    tickvals: tickVals,
                    ticktext: tickText,
                    showticklabels: true,
                    ticks: "outside"
                },
                xaxis: {
                    type: "category",
                    showticklabels: true,
                    tickangle: -90,
                    zeroline: false,
                    showline: true,
                    zerolinecolor: "black",
                    zerolinewidth: 10,
                    linecolor: 'black',
                    linewidth: 1
                },
                width: myPlot.offsetWidth,
                height: myPlot.offsetHeight,
                margin: {
                    b: marginBottom
                },
                annotations: annotationContent,
            };

            for(var i = 0 ; i < groups.length ; i++) { 
                var annotationText;
                var showArrow = false;
                var roundedMean = Math.round(100 * (groupEndDayMean(groups[i]) / vehicleFinalMean));
                var arrowPoint = roundedMean + 8;
				if(100 > roundedMean) {
                    annotationText = (100 - roundedMean) + "%";
                    if(100 > arrowPoint) {
                        showArrow = true;
                    }
                } else if(100 === roundedMean) {
                    if(groups[i].index === 0) {
                        annotationText = "CONTROL";
                    } else {
                        annotationText = "no change";
                    }
                } else {
                    annotationText = "-" + (roundedMean - 100)  + "%";
                }

                var result = {
                    x: groups[i].groupLabel,
                    y: roundedMean,
                    text: annotationText,
                    xanchor: "center",
                    yanchor: "bottom",
                    showarrow: false,
                };

                var arrow = {
                    x: groups[i].groupLabel,
                    y: arrowPoint,
                    text: "",
                    xanchor: "center",
                    yanchor: "bottom",
                    showarrow: showArrow,
                    ay: 100,
                    ax: 0,
                    ayref: "y"
                }

                annotationContent.push(result); annotationContent.push(arrow);
            }

            Plotly.newPlot(myPlot, tgiData, tgiLayout, modebarTGI);
        }
    };
}());
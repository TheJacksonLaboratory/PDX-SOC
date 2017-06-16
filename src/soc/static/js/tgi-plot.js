var tgiPlotGraph = (function() {
    var myPlot;

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
    
    /**
    *
    *  @param: groups in sorted order (control is first)
    *  @return: 
    */
	function setAnchorLines(groups) {
        console.log(groups);
		groups.map(function(group) {
            if(group.hasOwnProperty("reduction")){
                if(group.reduction > 10) { // TO-DO
                    console.log(group);
				}
			}
		});
	}
	
    /**
    *  draws a thicker horizontal line
    *  usually at the 100% mark
    */
	
    function setReferenceLine() {
        var plotID = null;
        var line_index = -1;
		var line_label = "100";
        var line = null;
        
        if(myPlot.id !== "undefined") { plotID = myPlot.id; }
        
        var plotvis = Plotly.d3.select("[id=" + plotID + "]");
        
        plotvis.selectAll("g.ytick")
            .filter(function(d, i){
                if(this.textContent === line_label) {
                    line_index = i;
                }
            });
        
		// on top of this x-line the reference line will be drawn
        line = plotvis.selectAll('.ygrid')
            .filter('.crisp')
            .filter(function(d,i) {return i === (line_index - 1) ;});
        
		// get the reference line starting point y-position
        var ly = Plotly.d3.transform(line.attr("transform")).translate[1];
        
        var barLayer = plotvis.select(".barlayer").selectAll("path");
        // get the reference line starting point x-position
        var lx = parsePathCoordinates(barLayer[0][0].getAttribute("d"))[0].M[0];
		
        // get the reference line end point position 
        var endPoint = parsePathCoordinates(line.attr("d"))[1].h[0]; 
        
        plotvis.select(".gridlayer")
            .append("path")
            .attr("d", "M" + lx + "," + ly + "h" + (endPoint - lx))
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("fill", "none");
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
                if(100 <= roundedMean) { hoverInfo = "x+text"; }

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

            var errorBars = groups.map(function(group){
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

			var tgiLayout = {
                // autosize: false,
                title: study.curated_study_name,
                titlefont: PlotLib.titlefont,
				yaxis: {
                    // range: (maxMean > 100) ? [0, maxMean] : [0, 100],
                    // domain: [0, 1],
                    title: '% TGI',
                    zeroline: false,
                    showline: true,
                    showgrid: true,
                    ticks: "outside",
                    ticksuffix: " "
				},
                xaxis: {
                    type: "category",
                    showticklabels: true,
                    tickangle: 20,
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
                    b: 120
                },
                annotations: annotationContent
			};
                
            for(var i = 0 ; i < groups.length ; i++) { 
                var annotationText;
                var showArrow = false;
                var roundedMean = Math.round(100 * (groupEndDayMean(groups[i]) / vehicleFinalMean));
                var arrowPoint = roundedMean + 8;
				if(100 > roundedMean) {
                    // annotationText = (100 - roundedMean) + "% reduction";
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
                    // annotationText = (roundedMean - 100) + "% increase";
                    annotationText = (roundedMean - 100) + "%";
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
            // setReferenceLine();
            // setAnchorLines(groups);
        }
    };
}());
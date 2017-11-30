var spiderPlotGraph = (function() {
    var myPlot;
    var xAxisMax = 0;
    var xAxisMin = 0;
    var grouplist = [];
    var groupsToShow = [];

    return {
        setGraphNode: function(graphDiv) {
            myPlot = graphDiv;
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
            var container = document.getElementById("spider-legend-toggle-btns");

            for(var i in groups) {
                var htmlLabel = document.createElement("label");
                var texnode;
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

                    textnode = document.createTextNode(htmlLabelText.substring(1));
                } else {
                    // control group is a special case
                    htmlLabel.className="btn btn-default togglesTooltip";
                    htmlLabel.title = "Show " + groups[i].groupLabel;
                    htmlLabel.style.background = "#FFFFFF";
                    htmlLabel.style.color = "#000000";
                    textnode = document.createTextNode("Ctrl");
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
        renderPlot: function(animals, groupMap, study) {
            grouplist.length = 0; // reset on every render
            var traces = animals.filter(function(animal) {
                if(groupsToShow.indexOf(animal.group_name) === -1) {
                    return false;
                }
                return true;
            }).map(function(animal) {
                var group = groupMap[animal.group_name];

                // because there are more traces (one per sample) than
                // legend keys (one per group) that need to be displayed 
                // only a few traces will have { showlegend: true } 				
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
                        color: (group.color !== null) 
                            ? group.color : PlotLib.colors[group.index % PlotLib.colors.length]
                    }
                }
            });

            var tickVals = PlotLib.plotTickVals(xAxisMin, xAxisMax, 5.0); // 5.0 is the tick step

            // plot titles might be longer than the available width; 
			// such titles are broken into two lines
            var title = PlotLib.fitTextOnScreen(study.curated_study_name, myPlot.offsetWidth);
            var layout = {
                autosize: false,
                title: title,
                titlefont: PlotLib.titlefont,
                yaxis: {
                    title: 'Tumor Volume (mm<sup>3</sup>)',
                    ticks: "outside",
                    ticksuffix: " "
                },
                xaxis: {
                    title: 'Day of Study',
                    range: [xAxisMin - 0.5, xAxisMax + 0.5],
                    showticklabels: true,
                    ticks: "",
                    tickmode: "array",
                    tickvals: tickVals,
                    ticktext: tickVals
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
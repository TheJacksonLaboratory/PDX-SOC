"use strict"

/**
* @file: socstudy.js
* @fileOverview 
* @author Georgi Kolishovski
* @version 1.0
*/

var socstudy;

(function(socstudy) {
    // module scoped variables
    var study = {};
    var treatments = [];
    var measurements = [];
    var animals = [];
    var groupLabels = [];

    var DownloadAsPng = (function() {
        function DownloadAsPng(id) {
            var that = this;
            that.id = id;
            $("[id=btn-" + that.id + "-modebar-download]").on("click", function() {
                var gd = $("[id=" + that.id + "-plot]")[0];
                var fn = (study.model_TM ? study.model_TM : study.model_J) + "-" + that.id + "-plot";
                PlotLib.downloadPlotlyImage(gd, gd.offsetWidth, gd.offsetHeight, fn);
            });
        }
        return DownloadAsPng;
    })();
    PlotLib.DownloadAsPng = DownloadAsPng;

    var Pan = (function() {
        function Pan(id) {
            var that = this;
            that.id = id;
            $("[id=btn-" + that.id + "-modebar-pan]").on("click", function() {
                var title = $(this).attr("title");
                $.each($("[id=" + that.id + "-plot] .modebar-btn"), function(index, modebarButton) {
                    if(modebarButton.getAttribute("data-title") === title) {
                        modebarButton.click();
                    }
                });
            });
        }
        return Pan;
    })();
    PlotLib.Pan = Pan;
	
    var ZoomIn = (function() {
        function ZoomIn(id) {
            var that = this;
            that.id = id;
            $("[id=btn-" + that.id +  "-modebar-zoomin]").on("click", function(event) {
				
                var title = $(this).attr("title");
                $.each($("[id=" + that.id + "-plot] .modebar-btn"), function(index, modebarButton) {
                    if(modebarButton.getAttribute("data-title") === title) {
                        modebarButton.click();
                    }
                });
            });
        }
        return ZoomIn;
    })();
    PlotLib.ZoomIn = ZoomIn;

    var ZoomOut = (function() {
        function ZoomOut(id) {
            var that = this;
            that.id = id;
            $("[id=btn-" + that.id + "-modebar-zoomout]").on("click", function() {
                var title = $(this).attr("title");
                $.each($("[id=" + that.id + "-plot] .modebar-btn"), function(index, modebarButton) {
                    if(modebarButton.getAttribute("data-title") === title) {
                        modebarButton.click();
                    }
                });
            });
        }
        return ZoomOut;
    })();
    PlotLib.ZoomOut = ZoomOut;

    var ResetAxes = (function() {
        function ResetAxes(id) {
            var that = this;
            that.id = id;
            $("[id=btn-" + that.id + "-modebar-reset]").on("click", function() {
                var title = $(this).attr("title");
                $.each($("[id=" + that.id + "-plot] .modebar-btn"), function(index, modebarButton) {
                    if(modebarButton.getAttribute("data-title") === title) {
                        modebarButton.click();
                    }
                });
            });
        }
        return ResetAxes;
    })();
    PlotLib.ResetAxes = ResetAxes;

    var PlotModeBar = (function() {
        function PlotModeBar() {
            this.buttons = [];
        }
        return PlotModeBar;
    })();
    PlotLib.PlotModeBar = PlotModeBar;

    var TreatmentGroupsModeBarBuilder = (function() {
        function TreatmentGroupsModeBarBuilder() { }

        TreatmentGroupsModeBarBuilder.prototype.build = function() {
            var modebar = new PlotModeBar();
            modebar.buttons.push(new DownloadAsPng("treatment-groups"));
            modebar.buttons.push(new Pan("treatment-groups"));
            modebar.buttons.push(new ZoomIn("treatment-groups"));
            modebar.buttons.push(new ZoomOut("treatment-groups"));
            modebar.buttons.push(new ResetAxes("treatment-groups"));
            return modebar;
        }
        return TreatmentGroupsModeBarBuilder;
    })();
    PlotLib.TreatmentGroupsModeBarBuilder = TreatmentGroupsModeBarBuilder;

    var SpiderModeBarBuilder = (function() {
        function SpiderModeBarBuilder() { }

        SpiderModeBarBuilder.prototype.build = function() {
            var modebar = new PlotModeBar();
            modebar.buttons.push(new DownloadAsPng("spider"));
            modebar.buttons.push(new Pan("spider"));
            modebar.buttons.push(new ZoomIn("spider"));
            modebar.buttons.push(new ZoomOut("spider"));
            modebar.buttons.push(new ResetAxes("spider"));
            return modebar;
        }
        return SpiderModeBarBuilder;
    })();
    PlotLib.SpiderModeBarBuilder = SpiderModeBarBuilder;

    var WaterfallModeBarBuilder = (function() {
        function WaterfallModeBarBuilder() { }

        WaterfallModeBarBuilder.prototype.build = function() {
            var modebar = new PlotModeBar();
            modebar.buttons.push(new DownloadAsPng("waterfall"));
            return modebar;
        }

        return WaterfallModeBarBuilder;
    })();
    PlotLib.WaterfallModeBarBuilder = WaterfallModeBarBuilder;

    var TGIModeBarBuilder = (function() {
        function TGIModeBarBuilder() { }

        TGIModeBarBuilder.prototype.build = function() {
            var modebar = new PlotModeBar();
            modebar.buttons.push(new DownloadAsPng("tgi"));
            return modebar;
        }

        return TGIModeBarBuilder;
    })();
    PlotLib.TGIModeBarBuilder = TGIModeBarBuilder;

    /**
    * class to execute the actual plot(s) rendering;
    * plot rendering operation has been separated in
    * a class witihn the module so that design patterns could
    * be applied as the application becomes more complex
    */
    var ModeBarBuilder = (function() {
        function ModeBarBuilder() { }

        ModeBarBuilder.prototype.build = function(builder) {
            return builder.build();
        }
        return ModeBarBuilder;
    })();

    // public module members
    socstudy.ModeBarBuilder = ModeBarBuilder;

    /* 
	* receives data from template & sets module variables
	* @param {Object} params:
    *                                  {study: study_data,
    *                                   measurements: measurements_data,
    *                                   treatments: treatments_data,
    *                                   animals: animals_data,
    *                                   groupLabels: groupLabels_data}
	*/
    socstudy.initStudyData = function(params) {
        if(params.study !== "undefined") {
            study = params.study;
        }

        if(params.treatments !== "undefined") {
            treatments = params.treatments;
        }

        if(params.measurements !== "undefined") {
            measurements = params.measurements;
        }

        if(params.animals !== "undefined") {
            animals = params.animals;
        }

        if(params.groupLabels !== "undefined") {
            groupLabels = params.groupLabels;
        };

        setDataStructs();
    }

    var groupMap = {};
    var groups = [];
    var animalMap = {};

    /*
    * constructs data structures used during plot rendering
    * 
    * 
    */
    function setDataStructs() {
        animals.forEach(function(animal) {
            animal.measurements = [];
            animal.treatments = [];

            var grpName = animal['group_name'];
            var animalName = animal['animal_name'];
            if(typeof(groupMap[grpName]) === 'undefined') {
                var group = {
                    color: null,
                    doseActivities: [],
                    doseUnits: [],
                    doseAmounts: [],
                    isControl: 0,
                    recistCat: null,
                    uniqTreatDays: [],
                    uniqMeasureDays: [],
                    animals: [],
                    groupName: grpName,
                    groupLabel: null
                };
                groupMap[grpName] = group;
                groups.push(group);
            }

            groupMap[grpName].animals.push(animal);
            animalMap[animalName] = animal;
        });

        // sort groups alphabetically
        groups.sort(function(g1, g2) {
            return g1.groupName.localeCompare(g2.groupName);
        });

        measurements.forEach(function(measurement) {
            var grpName = measurement['group_name'];
            var animalName = measurement['animal_name'];
            var grp = groupMap[grpName];
            var day = measurement['measurement_day'];
            PlotLib.insertUnique(grp.uniqMeasureDays, day);
            animalMap[animalName].measurements.push(measurement);
        });

        treatments.forEach(function(treatment) {
            var grpName = treatment['group_name'];
            var animalName = treatment['animal_name'];
            var grp = groupMap[grpName];
            var day = treatment['treatment_day'];
            PlotLib.insertUnique(grp.uniqTreatDays, day);
            PlotLib.insertUnique(grp.doseActivities, treatment['dose_activity'], PlotLib.compareBasic);
			
            // var units = PlotLib.cleanupRouteOfAdminUnits(treatment['administration_route_units']);
            PlotLib.insertUnique(grp.doseUnits, treatment['administration_route_units'], PlotLib.compareBasic);
            PlotLib.insertUnique(grp.doseAmounts, treatment['test_material_amount']);
            animalMap[animalName].treatments.push(treatment);
        });

        // setup group labels: 
        // group labels are displayed on the plots and are different from group names, 
        // which are not displayed on the plots
        $.each(groupMap, function(grpName, group) {
            group.nearStartMeasIdx = PlotLib.findNearestMeasureDayIdx(group.uniqMeasureDays, 0);
            group.nearEndMeasIdx = 
                PlotLib.findNearestMeasureDayIdx(group.uniqMeasureDays, group.uniqMeasureDays[group.uniqMeasureDays.length - 1]);
            group.nearStartMeasDay = group.uniqMeasureDays[group.nearStartMeasIdx];
            group.nearEndMeasDay = group.uniqMeasureDays[group.nearEndMeasIdx];

            for(var i = 0; i < groupLabels.length; i++) {
                if(groupLabels[i].group_name === group.groupName) {
                    if(groupLabels[i].curated_group_name !== "") {
                        group.groupLabel = groupLabels[i].curated_group_name;
                    } else if(group.doseActivities.length <= 0)  { 
                        group.groupLabel = "No Treatment";
                    } else {
                        group.groupLabel = 
                            groupLabels[i].drug + 
                            ' (' + group.doseAmounts.join(', ') + ' ' + group.doseUnits.join(', ') + ')';
                    }
                    // additional group properties
                    group.recistCat = groupLabels[i].recist;
                    if(groupLabels[i].is_control === 1) group.isControl = 1;
                    if(groupLabels[i].color !== null) group.color = groupLabels[i].color;
                }
            }
        });
        
		// vehicle group needs to be at first position
        var controlIndex = 0;
        for(var i = 0; i < groups.length; i++) { 
            if(groups[i].isControl === 1) {
                controlIndex = i;
            }
        }
		groups.splice(0, 0, groups[controlIndex]);
        groups.splice(controlIndex+1, 1);
        
        groups.forEach(function(group, i) {
            group.index = i;
        });
        
        animals.forEach(function(animal) {
            var grpName = animal['group_name'];
            var grp = groupMap[grpName];

            var measStart = null;
            var measEnd = null;
            animal.measurements.forEach(function(measurement) {
                if(measurement.measurement_day === grp.nearStartMeasDay) {
                    measStart = measurement;
                }
                if(measurement.measurement_day === grp.nearEndMeasDay) {
                    measEnd = measurement;
                }
            });

            if(measEnd === null && animal.measurements.length) {
                var lastMeas = animal.measurements[animal.measurements.length - 1];
                if(lastMeas.measurement_day < grp.nearEndMeasDay) {
                    // indicates that the animal died early
                    // TODO add some visual indication for these animals
                    measEnd = lastMeas;
                }
            }

            if(measStart === null || measEnd === null) {
                console.error('bad measurement for animal: ' + animal.animal_name);
            }
            animal.start_day_measurement = measStart;
            animal.end_day_measurement = measEnd;
            animal.measurement_diff = measEnd.measurement_value - measStart.measurement_value;
            animal.percent_change_volume = Math.round((animal.measurement_diff / measStart.measurement_value) * 100);
            animal.measurement_fold_change = PlotLib.roundTo((animal.measurement_diff / measStart.measurement_value), 2);
        });

        var treatGrpChgTypeSel = $("[id=treatment-group-change-type-select]");
        var treatmentGroupPlotNode = document.getElementById('treatment-groups-plot');
        treatmentGroupPlot.setGraphNode(treatmentGroupPlotNode);
        // event handler
        treatGrpChgTypeSel.change(function() {
            treatmentGroupPlot.renderPlot(treatGrpChgTypeSel.val(), measurements, treatments, groups, study);
        });
        treatmentGroupPlot.renderPlot(treatGrpChgTypeSel.val(), measurements, treatments, groups, study);

        var spiderPlotNode = document.getElementById('spider-plot');
        spiderPlotGraph.setGraphNode(spiderPlotNode);
        spiderPlotGraph.renderPlot(animals, groupMap, study);

        var recistPanelNode = document.getElementById("recist-info-panel");
        recistPanel.setPanelNode(recistPanelNode);
        recistPanel.renderTable(groups, study);

        var waterfallChgTypeSel = $("[id=waterfall-change-type-select]");
        var waterfallPlotNode = document.getElementById('waterfall-plot');
        waterfallPlotGraph.setGraphNode(waterfallPlotNode);
        // event handler
        waterfallChgTypeSel.change(function() {
            waterfallPlotGraph.renderPlot(waterfallChgTypeSel.val(), animals, groups, study);
        });
        waterfallPlotGraph.renderPlot(waterfallChgTypeSel.val(), animals, groups, study);

        var tgiPlotNode = document.getElementById('tgi-plot');
        tgiPlotGraph.setGraphNode(tgiPlotNode);
        tgiPlotGraph.renderPlot(groups, study);

        var mb1 = new socstudy.ModeBarBuilder(); mb1.build(new TreatmentGroupsModeBarBuilder());
        var mb2 = new socstudy.ModeBarBuilder(); mb2.build(new SpiderModeBarBuilder());
        var mb3 = new socstudy.ModeBarBuilder(); mb3.build(new WaterfallModeBarBuilder());
        var mb4 = new socstudy.ModeBarBuilder(); mb4.build(new TGIModeBarBuilder());

        $("[id=spider-toggle-controls]").on("click", function() {
            if($(this).attr("aria-pressed") === "false") {
                $(this).text("HIDE CONTROL DATA");
                $(this).css("font-weight", "600");
                spiderPlotGraph. setControlsVisibility(true);
                spiderPlotGraph.renderPlot(animals, groupMap, study);
            } else {
                $(this).text("PLOT CONTROL DATA");
                $(this).css("font-weight", "600");
                spiderPlotGraph. setControlsVisibility(false); 
                spiderPlotGraph.renderPlot(animals, groupMap, study);
            }
        });

        $("[id=waterfall-toggle-controls]").on("click", function() {
            if($(this).attr("aria-pressed") === "false") {
                $(this).text("HIDE CONTROL DATA");
                $(this).css("font-weight", "600");
                waterfallPlotGraph. setControlsVisibility(true);
                waterfallPlotGraph.renderPlot(waterfallChgTypeSel.val(), animals, groups, study);
            } else {
                $(this).text("SHOW CONTROL DATA");
                $(this).css("font-weight", "600");
                waterfallPlotGraph. setControlsVisibility(false);
                waterfallPlotGraph.renderPlot(waterfallChgTypeSel.val(), animals, groups, study);
            }
        });
    }

})(socstudy || (socstudy = {}));
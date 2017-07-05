"use strict";

/**
*
*
*
*/

var PlotLib; 

(function(PlotLib) {

    // COMMON PLOT PROPERTIES

    // colors for some common treatment groups are assigned in the database (table 'colors')
    // colors in the below list are assigned randomly to less-common groups, which 
    // do not have assigned special color values from the database

    // color codes from the below list should not repeat those in the database
    PlotLib.colors = [
        "#000000", 
        "#1F78B4", 
        "#B2DF8A", 
        "#33A02C", 
        "#FB9A99", 
        "#E31A1C", 
        "#FDBF6F", 
        "#FF7F00", 
        "#CAB2D6", 
        "#6A3D9A"
    ];


    PlotLib.modebarButtonDataTitles = {
        downloadAsPng: "Download plot as a png",
        zoomIn: "Zoom in",
        zoomOut: "Zoom out",
        resetAxes: "Reset axes"
    };

    // modebar settings; individual plots can change them
    PlotLib.modebar = {
        displayModeBar: true, 
        displaylogo: false, 
        modeBarButtonsToRemove: ["sendDataToCloud"]
    };

    // uniform title styles; individual plots can change them
    PlotLib.titlefont = {
        font: "Arial",
        size: 15
    };

    // MODULE METHODS

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
    PlotLib.binarySearch = function(array, x, compFunc) {
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
    * small viewports might cut-off plot titles; 
    * to fit the title, break it so it displays on two lines;
    * @param {string} text
    * @param {numeric} containerWidth
    * @return {string}
    * TO-DO: make it go deeper than two levels
    */
    PlotLib.fitTextOnScreen = function(text, containerWidth) {
        // titles are centered on the screen; 
        // allow some white space around them (left: 50px & right: 50px)
        var titlePaddingPx = 100;

        // create dummy span
        this.e = document.createElement('span');
        // set font-size
        this.e.style.fontSize = PlotLib.titlefont.size;
        // set font-face / font-family
        this.e.style.fontFamily = PlotLib.titlefont.font;
        // set text
        this.e.innerHTML = text;
        document.body.appendChild(this.e);

        var w = this.e.offsetWidth + titlePaddingPx;
        var bottomText = "";

        while(w > containerWidth) {
            var textParts = removeWordsFromEnd(this.e.innerHTML, 1);
            this.e.innerHTML = textParts[0]; // titleParts[0] contains the top title text
            w = this.e.offsetWidth + titlePaddingPx;
            bottomText = textParts[1] + " " + bottomText;
        }
        var topText = this.e.innerHTML;

        // cleanup
        document.body.removeChild(this.e);

        if(bottomText !== "") {
            return topText + "<br>" + bottomText + "<br>";
        }

        return topText;
    }

    /**
    *
    *
    *
    */
    PlotLib.cleanupRouteOfAdminUnits = function(a) {
        var units = a.split("/");

		return (units[0] + "/" + units[1]);
    }	


    /**
     * This function takes two parameters (x, y) and will return a number less than,
     * greater than or equal to zero depending on whether x is less than,
     * greater than or equal to y respectively. The '<' and '>' operators
     * are used to order x and y.
     * @param x
     * @param y
     * @return {number}
     */
    PlotLib.compareBasic = function(x, y) {
        if(x < y) {
            return -1;
        } else if(x > y) {
            return 1;
        } else {
            return 0;
        }
    }


    /**
     * this function simply returns (x - y) and thus is a suitable comparison function
     * to use for sorting or searching numeric values
     * @param x {number}
     * @param y {number}
     * @return {number}
     */
    function compareNumeric(x, y) {
        return x - y;
    }


    /**
     * insert x into the given sorted array if it isn't already present (this function has no effect if the element is
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
    PlotLib.insertUnique = function(array, x, compFunc) {
        var idx = PlotLib.binarySearch(array, x, compFunc);
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
    PlotLib.meanStddev = function(nums) {
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
    PlotLib.meanStderrStddev = function(nums) {
        var retVal = PlotLib.meanStddev(nums);
        retVal.stdErr = retVal.stdDev / Math.sqrt(retVal.count);

        return retVal;
    }


    // we want to capture the measurements nearest the start/stop of treatment
    PlotLib.findNearestMeasureDayIdx = function(uniqMeasurementDays, treatmentDay) {
        var idx = PlotLib.binarySearch(uniqMeasurementDays, treatmentDay);
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


    /**
    * removes n words from the end of sentence
    * @param {string} sentence - sentence of words
    * @param {numeric} n - number of words to be removed from the END of sentence
    * @return {string} shortSentence - the sentence with the last n words removed
    */
    function removeWordsFromEnd(sentence, n) {
        var words = sentence.trim().split(" ");
        var shortenSentence = "";
        if(n >= words.length) { // check that n is smaller than the number of words
            return null;
        }

        for(var i = 0; i < words.length - n; i++) {
            shortenSentence = shortenSentence + " " + words[i];
        }
        return [shortenSentence, words.splice(words.length - n, words.length).join(" ")];
    }

    /**
    *  rounding decimal points in JavaScript is not stable;
    *  this function should resolve this and be used in the application
    *  @param {numeric} n
    *  @param {numeric} digits
    *  @return {numeric} 
    */
    PlotLib.roundTo = function(n, digits) {
        if(digits === undefined) {
            digits = 0;
        }
       
        var multiplicator = Math.pow(10, digits);
        n = parseFloat((n * multiplicator).toFixed(11));  
        var test = (Math.round(n) / multiplicator); 
        return +(test.toFixed(digits));
    }
})(PlotLib || (PlotLib = {}));
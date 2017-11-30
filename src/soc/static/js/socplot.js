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
     * detect IE
     * returns version of IE or false, if browser is not Internet Explorer
     */
    function detectIE() {
        var ua = window.navigator.userAgent;

        // Test values; Uncomment to check result …

        // IE 10
        // ua = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)';
  
        // IE 11
        // ua = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko';

        // Edge 12 (Spartan)
        // ua = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36 Edge/12.0';
 
        // Edge 13
        // ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586';

        var msie = ua.indexOf('MSIE ');
        if(msie > 0) {
            // IE 10 or older => return version number
            return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
        }

        var trident = ua.indexOf('Trident/');
        if(trident > 0) {
            // IE 11 => return version number
            var rv = ua.indexOf('rv:');
            return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
        }

        var edge = ua.indexOf('Edge/');
        if(edge > 0) {
            // Edge (IE 12+) => return version number
            return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
        }

        // other browser
        return false;
}


    /**
     * implements Plotly's downloadImage() using defined parameters
     * TO-DO; detect and handle IE (11) browser cases; currently IE11 does not work
     * @param gd {object}
     * @param w {number} - image width
     * @param h {number} - image height
     * @param fn {string} - file extension
     */
    PlotLib.downloadPlotlyImage = function(gd, w, h, fn) {
        // browser version; IE11 exports only with svg files
        var version = detectIE();
        
		Plotly.downloadImage(gd, {
            format: (version === false ? "png" : "svg"),
            height: h,
            width: w,
            filename: fn
        });
    }

	
    /**
     * calculates the values for the ticks on an axis
     * @param {number} min 
     * @param {number} max
     * @return
     */
    PlotLib.plotTickVals = function(min, max, step) {
        if(min === null || min === "undefined" || max === null || max === "undefined") {
            return;
        }

        var tickVals = [];
        var intervalLen = max - min;
        var tickStep = step; // show tick mark every 5 units (days)
        var numTicks = Math.floor(intervalLen / tickStep);

        tickVals.push(min);

        for(let i = 1; i < numTicks + 1; i++) {
            let val = tickVals[i-1] + tickStep;
            // first tick value must be the minimal, but next values (till the very last) 
            // should be rounded to multiples of tickStep;			
            if(val % tickStep !== 0) {
                val = val + (tickStep - (val % tickStep));
            }
            // do not show ticks if they are too close to the last one
            if((max-val) > 2) {
                tickVals.push(val);
            }
        }
        tickVals.push(max);

        return tickVals;
    }

    /**
     * measures the length in pixels of the string in label
     * @param label {string}
     * @return {number}
     */
    PlotLib.getLabelLenPx = function(label) {
        var extraPadding = 10;

        this.e = document.createElement("span");

        // set font-size
        this.e.style.fontSize = PlotLib.titlefont.size;
        // set font-face / font-family
        this.e.style.fontFamily = PlotLib.titlefont.font;
        // set text
        this.e.innerHTML = label;
        document.body.appendChild(this.e);

        var w = this.e.offsetWidth;

        // cleanup
        document.body.removeChild(this.e);

        return (w + extraPadding);
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
     * checks if an object is equal to any object in an array: they should have identical properties 
     * and identical values for each of the properties
     * @param array
     * @param o
     */
    PlotLib.insertUniqueObject = function(array, o) {
        if(array.length === 0) {
            array.push(o);
        } else {
            for(var i = 0; i < array.length; i++) {
                if(JSON.stringify(array[i]) === JSON.stringify(o)) {
                    return;
                }
            }
            array.push(o);
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


	/**
	* 
	* @param {number} numToRound 
	* @param {number} multiple
	* @return {number} 
	*/
	PlotLib.roundToMultiple = function(numToRound, multiple) {
        if(multiple === 0) {
			return numToRound;
		}
		
		var remainder = numToRound % multiple;
		if(remainder === 0) {
			return numToRound;
		}
		return numToRound + multiple - remainder; 
	}


    /**
     * sorts an array of objects using some object member/key
     * @param {Object[]} - an array of objects
     * @param {string} key - the key to be used for sorting the objects
     */
    PlotLib.sortByKey = function(array, key) {
        return array.sort(function(a, b) {
            var x = a[key]; var y = b[key]; console.debug(x); console.debug(y);
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
    }


    /**
     * handle legend toggle buttons styling 
     * @param {Object} elm - HTML element reference
     */
    PlotLib.updateToggleBtnStyle = function(elm) {
        var c = elm.attr("class");
        if(c.indexOf("active") === -1) {
            // get the color from the background-color option
            var color = elm.css("color");
            elm.css("background", color);
            elm.css("color", "#FFFFFF");
            var t = $("p.soc-tooltip").text();
            var tn = t.replace("Show", "Hide");
            $("p.soc-tooltip").text(tn); // update tooltip text
            elm.data('tipText', tn); // update element data attribute
        } else {
            // get the color from the color option
            var color = elm.css("backgroundColor");
            elm.css("background", "#FFFFFF");
            elm.css("color", color);
            var t = $("p.soc-tooltip").text();
            var tn = t.replace("Hide", "Show");
            $("p.soc-tooltip").text(tn);
            elm.data('tipText', tn);
        }   
    }
})(PlotLib || (PlotLib = {}));
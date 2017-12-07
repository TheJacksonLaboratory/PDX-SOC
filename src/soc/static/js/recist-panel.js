/**
 *  @file recist-panel.js 
 *  @fileOverview constructs a table to display RECIST information
 *  @author georgi.kolishovski@jax.org
 *  @verison 1.0
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

var recistPanel = (function() {
    var myTable;

    return {
        setPanelNode: function(panelNode)  {
            myTable = panelNode;
        },
        renderTable: function(groups, study) {
            var data = [];

            groups.forEach(function(group) {
                data.push({
                    'Group Name': group.groupLabel, 
                    'Plot Color Key': (group.color !== null) ? group.color : PlotLib.colors[group.index % PlotLib.colors.length],
                    'RECIST Category': group.recistCat
                });
            });

            tabulate(data, ['Group Name', "Plot Color Key", 'RECIST Category']);
        }
    }


    /**
     * dynamically creates a table to display the RECIST data 
     * @param {Object[]} data - an array of RECIST data objects
     * @param {string} data[]."Group Name"
     * @param {string} data[]."Plot Color Key"
     * @param {string} data[]."RECIST Category"
     * @param {string[]} columns - an array containing the table column names - "Group Name", "Plot Color Key", "RECIST Category"
     * @return {Object} - DOM table object
     */
    function tabulate(data, columns) {
        var vis = Plotly.d3.select(myTable);

        var table = vis.append("table"). classed("recist", true);
        var thead = table.append("thead");
        var tbody = table.append("tbody");

        thead.append('tr')
            .selectAll('th')
            .data(columns).enter()
          .append('th')
            .text(function (column) { return column; });

        var rows = tbody.selectAll('tr')
            .data(data)
            .enter()
            .append('tr');

        var cells = rows.selectAll('td')
            .data(function (row) {
                return columns.map(function (column) {
                    return {column: column, value: row[column]};
                });
            })
            .enter()
            .append('td')
            .style("background", function(d) { if(d.column === "Plot Color Key") return d.value; })
            .text(function (d) { if(d.column !== "Plot Color Key") return d.value; });

        return table;
    }
})();
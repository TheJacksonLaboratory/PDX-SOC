/**
*  @file recist-panel.js 
*  @fileOverview constructs a table holding the RECIST information
*  @author 
*  @verison 1.0
*/

var recistPanel = (function() {
    var recistPanel;
    
    /**
    *
    * 
    *
    *  TO-DO: consider moving this function to utilities module
    */
	function tabulate(data, columns) {
        var vis = Plotly.d3.select(recistPanel);

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
			.style("background", function(d) { if(d.column === "Color") return d.value; })
            .text(function (d) { if(d.column !== "Color") return d.value; });

        return table;
	}
	
    return { 
        setPanelNode: function(panelNode)  {
            recistPanel = panelNode;
        },
        renderTable: function(groups, study) {
            var data = [];
            
            groups.forEach(function(group) {
                data.push({
					["Group Name"]: group.groupLabel, 
					["Color"]:  (group.color !== null) ? group.color : colors[group.index % colors.length],
					["RECIST Category"]: group.recistCat
				});
			}); 
            
            tabulate(data, ['Group Name', "Color", 'RECIST Category']);
		}
	}
    
	recistPanel = this.recistPanel;
})();
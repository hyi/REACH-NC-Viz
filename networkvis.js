var defWidth = 960, defHeight = 600, radius = 20;
var width, height;
var e = document.documentElement;
var g = document.getElementsByTagName('body')[0];
width = window.innerWidth || e.clientWidth || g.clientWidth;
height = window.innerHeight || e.clientHeight || g.clientHeight;
if(width <= 0) 
	width = defWidth;	
else
	width -= 100;	
if(height <= 0) 
 	height = defHeight; 
else
	height -= 260; // account for height of upper and lower gui elements
document.getElementById("datainfo").style.width=width+"px";	

var netSource = "Pub", oriData, linkData, nodeData, pubData=null, grantData=null;
var link, node;
var lastSelNode = null, lastSelLink = null;
var maxNumOfPubs=1, maxNumOfGrants=1, lastSelExpertId=-1, lastSelEdgeSource=-1, lastSelEdgeTarget=-1, selEdgeSource=-1, selEdgeTarget=-1;
var lastSearchStr = "", lastSearchNodes = new Array();
var recsForExpert, totalRecsForExpert=-1;
var ftable, fcotable;
var linkedByIndex = {};
var unitChecked = new Array(true, true, true, true, true, true, true); // by default, all units are checked
var unitVals = new Array("UNCCH, School of Information and Library Science", 
						"UNCCH, College of Arts and Sciences", 
						"UNCCH, School of Medicine", 
						"UNCCH, School of Dentistry", 
						"UNCCH, Gillings School of Global Public Health", 
						"UNCCH, Eshelman School of Pharmacy", 
						"UNCCH, Administration");
//var unitColors = new Array("#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2");
var unitColors = new Array("#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f", "#af8dc3"); //"#e5c494");
var color = d3.scale.ordinal()
          .range(unitColors)
          .domain(unitVals);	
$("#SILS").css('background-color',color(unitVals[0]));
$("#SILS").css('opacity',0.9);
//$("#SILS").css('font-weight','bold');
$("#AS").css('background-color',color(unitVals[1]));
$("#AS").css('opacity',0.9);
//$("#AS").css('font-weight','bold');
$("#Med").css('background-color',color(unitVals[2]));
$("#Med").css('opacity',0.9);
//$("#Med").css('font-weight','bold');
$("#Dent").css('background-color',color(unitVals[3]));
$("#Dent").css('opacity',0.9);
//$("#Dent").css('font-weight','bold');
$("#SPH").css('background-color',color(unitVals[4]));
$("#SPH").css('opacity',0.9);
//$("#SPH").css('font-weight','bold');
$("#Pharm").css('background-color',color(unitVals[5]));
$("#Pharm").css('opacity',0.9);
//$("#Pharm").css('font-weight','bold');
$("#Admin").css('background-color',color(unitVals[6]));
$("#Admin").css('opacity',0.9);
//$("#Admin").css('font-weight','bold');
var tooltip = d3.select("body").append("div")   
    .attr("class", "tooltip")               
    .style("visibility", "hidden");

var bDynamicLayout = true;
document.getElementById("togglelayout").value = "Pause Layout";

var zoom = d3.behavior.zoom();    
var svg = d3.select("#chart").append("svg")
	.attr("width", width)
	.attr("height", height)
	.append("g")
	.call(zoom.scaleExtent([1, 4]).on("zoom", zoom_redraw))
	.append("g");
	
var overlayRect = svg.append("rect")
	.attr("class", "overlay")
	.attr("width", width)
	.attr("height", height);	

var force = d3.layout.force()
		//.gravity(.06)
		.charge(-120)
		.linkDistance(140)
		.linkStrength(2)
		.size([width, height]);
		
window.onresize = updateWindow;
function updateWindow(){
    width = window.innerWidth || e.clientWidth || g.clientWidth;
    height = window.innerHeight|| e.clientHeight|| g.clientHeight;
    if(width <= 0) 
		width = defWidth;
	else
		width -= 100;		
	if(height <= 0) 
	 	height = defHeight; 
	else
		height -= 260; // account for height of upper and lower gui elements
	overlayRect.attr("width", width).attr("height", height);
	svg.attr("width", width).attr("height", height);
    document.getElementById("datainfo").style.width=width+"px";	
	force.size([width, height]);
}
		
function zoom_redraw() {
	 svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    //svg.attr("transform", "scale(" + d3.event.scale + ")");
} 

function addCommasWithDollarSign(nStr) {
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
			x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return "$" + x1 + x2;
}

function queryExpertInfo(eid) {
	if(netSource == "Pub") {
		$.getJSON('http://reachnc1.unc.edu/bbsp/getOneExpertPubJSON.php?eid='+eid,  
				function(records, status, xhr) {
					recsForExpert = records;
					totalRecsForExpert = records.length;
				});
	}
	else { // grants
		$.getJSON('http://reachnc1.unc.edu/bbsp/getOneExpertGrantJSON.php?eid='+eid,  
				function(records, status, xhr) {
					recsForExpert = records;
					totalRecsForExpert = records.length;
				});
	}
}

// contentstr has a separator '+' for details on cogrants or copubs
function populateCoCollabHTMLTable(captionstr, contentstr) {
	fcotable = $("<table class='info' id='infotbl'></table>");
	fcotable.append($("<caption></caption>").append(captionstr));
	var contentary = contentstr.split("+");
	if(contentary.length>0) {
		if(netSource == "Pub")
			fcotable.append($("<tr></tr>").append($("<th class='header'>Co-authored Publication Title</th>")));
		else
			fcotable.append($("<tr></tr>").append($("<th class='header'>Co-authored Grant Title</th>")));
		for(var j=0; j<contentary.length; j++) {
			fcotable.append($("<tr></tr>").append($("<td>" + contentary[j] + "</td>")));		
		}
	}
	$("#datainfo").html(fcotable);
}

function appendOneRowToTable(table, c1, c2, c3, c4, c5, c6, c7) {
	table.append(
		$("<tr></tr>")
			.append($("<td>" + c1 + "</td>"))
			.append($("<td>" + c2 +"</td>"))
			.append($("<td>" + c3 + "</td>"))
			.append($("<td>" + c4 + "</td>"))
			.append($("<td>" + c5 + "</td>"))					
			.append($("<td>" + c6 + "</td>"))
			.append($("<td>" + c7 + "</td>"))
	);
}

function populateHTMLTable(captionstr) {
	if(totalRecsForExpert <= 0) return;
	
	ftable = $("<table class='info' id='infotbl'></table>");
	ftable.append($("<caption></caption>").append(captionstr));
	var col1, col2, col3, col4, col5, col6, col7;
	if(netSource == "Pub") {
		ftable.append(
		  $("<tr></tr>")
		  .append($("<th class='header'>Title</th>"))
		  .append($("<th class='header'>Authors</th>"))
		  .append($("<th class='header'>Journal Title</th>"))
		  .append($("<th class='header'>Volume</th>"))
		  .append($("<th class='header'>Issue</th>"))
		  .append($("<th class='header'>Year</th>"))
		  .append($("<th class='header'>Pagination</th>"))
		);
	}
	else {// grants
		ftable.append(
		  $("<tr></tr>")
		  .append($("<th class='header'>Lead PI Name</th>"))
		  .append($("<th class='header'>Title</th>"))
		  .append($("<th class='header'>Sponsor</th>"))
		  .append($("<th class='header'>Amount</th>"))
		  .append($("<th class='header'>Other Personnel</th>"))
		  .append($("<th class='header'>Start Date</th>"))
		  .append($("<th class='header'>End Date</th>"))
		);
	}
	for(var j=0; j<totalRecsForExpert; j++) {
		if(netSource == "Pub") {
			col1 = recsForExpert[j].Title;
			col2 = recsForExpert[j].Authors;
			col3 = recsForExpert[j].JournalTitle;
			col4 = recsForExpert[j].Volume;
			col5 = recsForExpert[j].Issue;
			col6 = recsForExpert[j].PubYear;
			col7 = recsForExpert[j].Pagination;
		}
		else {// grants
			col1 = recsForExpert[j].PiName;
			col2 = recsForExpert[j].Title;
			col3 = recsForExpert[j].Sponsor;
			col4 = recsForExpert[j].FundingAmount;
			col5 = recsForExpert[j].Personnel;
			col6 = recsForExpert[j].StartDate;
			col7 = recsForExpert[j].EndDate;
		}
		if(col1==null) 
			col1="";	
		else
			col1 = new String(col1);
		if(col2==null) 
			col2="";	
		else
			col2 = new String(col2);
		if(col3==null) 
			col3="";	
		else
			col3 = new String(col3);	
		if(col4==null) 
			col4="";
		else {
			if(netSource == "Pub")
				col4 = new String(col4);
			else // grants
				col4 = addCommasWithDollarSign(col4);
		}
		if(col5==null) 
			col5="";	
		else
			col5 = new String(col5);	
		if(col6==null) 
			col6="";	
		else
			col6 = new String(col6);	
		if(col7==null) 
			col7="";	
		else
			col7 = new String(col7);
		appendOneRowToTable(ftable, col1, col2, col3, col4, col5, col6, col7);	
	}
	$("#datainfo").html(ftable);
}

var node_drag = d3.behavior.drag()
    .on("dragstart", dragstart)
    .on("drag", dragmove)
    .on("dragend", dragend);	
function dragstart(d, i) {
	d3.event.sourceEvent.stopPropagation(); // very important; otherwise, panning will interfare with node dragging
	force.stop(); // stops the force auto positioning before you start dragging
}

function dragmove(d, i) {
	d.px += d3.event.dx;
	d.py += d3.event.dy;
	d.x += d3.event.dx;
	d.y += d3.event.dy; 
	tick(); // this is the key to make it work together with updating both px,py,x,y on d !
}

function dragend(d, i) {
	d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
	tick();
	if(bDynamicLayout)
		force.resume();
}

function isConnected(a, b) {
	return linkedByIndex[a.ClientId + "-" + b.ClientId] || linkedByIndex[b.ClientId + "-" + a.ClientId] || a.ClientId == b.ClientId;
}

function tick() {
	// add the curvy lines
	link.attr("d", function(d) {
		var dx = d.target.x-d.source.x, dy = d.target.y-d.source.y, dr = Math.sqrt(dx * dx + dy * dy);
		return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
	});
	node.attr("transform", function(d) { 
		d.x = Math.max(radius, Math.min(width - radius, d.x));
		d.y = Math.max(radius, Math.min(height - radius, d.y));
		return "translate(" + d.x + "," + d.y + ")"; 
	});

	// add the straight lines
	//link.attr("x1", function(d) { return d.source.x; })
	//	.attr("y1", function(d) { return d.source.y; })
	//	.attr("x2", function(d) { return d.target.x; })
	//	.attr("y2", function(d) { return d.target.y; });
};
/*
function fadeRelativeToNode(opacity) {
		return function(d) {
			node.style("stroke-opacity", function(o) {
				var thisOpacity = isConnected(d, o) ? 1 : opacity;
				this.setAttribute('fill-opacity', thisOpacity);
				if(thisOpacity == 1 && opacity < 1 && d!=o) 
					d3.select(this).select("text").transition()
						.duration(200)
						.style("visibility", "visible");
				else
					d3.select(this).select("text").transition()
						.duration(200)
						.style("visibility", "hidden");
				return thisOpacity;
			});

			link.style("stroke-opacity", opacity).style("stroke-opacity", function(o) {
				return o.source === d || o.target === d ? 1 : opacity;
			});
			if(opacity < 1) {
				var tooltipstr = d.FirstName + " " + d.LastName + ", " + d.Affiliation;
				if(netSource == "Pub")
					tooltipstr += ", Number of Publications: " + d.NumOfPubs;
				else // grants
					tooltipstr += ", Number of Grants: " + d.NumOfGrants;
				tooltip.transition()        
					.duration(200)      
					.style("visibility", "visible");      
				tooltip.html(tooltipstr)  
					.style("left", (d3.event.pageX) + "px")     
					.style("top", (d3.event.pageY - 28) + "px");					
			}
			else {
				tooltip.transition()        
					.duration(500)      
					.style("visibility", "hidden");
			}
		}
	}  
*/	
function fadeRelativeToNode(opacity) {
	return function(d) {
		if(opacity < 1) {
			node.style("stroke-opacity", function(o) {
				var thisOpacity = isConnected(d, o) ? 1 : opacity;
				this.setAttribute('fill-opacity', thisOpacity);
				if(thisOpacity == 1 && d!=o) 
					d3.select(this).select("text").transition()
						.duration(200)
						.style("visibility", "visible");
				else
					d3.select(this).select("text").transition()
						.duration(200)
						.style("visibility", "hidden");
				return thisOpacity;
			});
	
			link.style("stroke-opacity", function(o) {
				return o.source === d || o.target === d ? 1 : opacity;});
				
			var tooltipstr = d.FirstName + " " + d.LastName + ", " + d.Affiliation;
			if(netSource == "Pub")
				tooltipstr += ", Number of Publications: " + d.NumOfPubs;
			else // grants
				tooltipstr += ", Number of Grants: " + d.NumOfGrants;
			tooltip.transition()        
				.duration(200)      
				.style("visibility", "visible");      
			tooltip.html(tooltipstr)  
				.style("left", (d3.event.pageX) + "px")     
				.style("top", (d3.event.pageY - 28) + "px");					
		}
		else { // return to no-fading
			node.style("stroke-opacity", function(o) {
				this.setAttribute('fill-opacity', 0.9);
				d3.select(this).select("text").transition()
						.duration(200)
						.style("visibility", "hidden");
			});
			
			link.style("stroke-opacity", 0.6);
			tooltip.transition()        
				.duration(500)      
				.style("visibility", "hidden");
		}
	}
}
 
/*
function fadeRelativeToLink(opacity) {
	return function(d) {
		if (typeof(node) != "undefined") {
			node.style("stroke-opacity", function(o) {
				var thisOpacity = (o==d.source || o==d.target ? 1 : opacity);
				this.setAttribute('fill-opacity', thisOpacity);
				return thisOpacity;
			});
			node.style("visibility", function(o) {
				var thisOpacity = (o==d.source || o==d.target ? 1 : opacity);
				this.setAttribute('fill-opacity', thisOpacity);
				return thisOpacity;
			});
		}

		link.style("stroke-opacity", opacity).style("stroke-opacity", function(o) {
			return o === d ? 1 : opacity;
		});
		if(opacity < 1 && d3.event != null) {
			tooltip.transition()        
				.duration(200)      
				.style("visibility", "visible");      
			tooltip.html("Number of connections between node " + d.source.FirstName + " " + d.source.LastName + " and node " + d.target.FirstName + " " + d.target.LastName + ": "+d.NumOfConn)   
				.style("left", (d3.event.pageX) + "px")     
				.style("top", (d3.event.pageY - 28) + "px");
		}
		else {
			tooltip.transition()        
				.duration(500)      
				.style("visibility", "hidden");
		}
	}
}
*/
			
function updateData() {
	link = svg.selectAll("path.link")
		.data(linkData, function(d) {return d.ClientId+"-"+d.Co_ClientId;}); // very important to add index via function to data to ensure subsequent filtering works
		
	var path = link.enter().append("path")
		.attr("class", "link")
		.style("stroke-width", function(d) { return Math.sqrt(d.NumOfConn); }) 
		.style("stroke-opacity", .3)
		//.on("mouseover", fadeRelativeToLink(0.3))
		//.on("mouseout", fadeRelativeToLink(1))
		.on("click", function(d) {
			var captionstr;
			if(typeof d.source.FirstName != 'undefined') 
				captionstr = "Number of connections between " + d.source.FirstName + " " + d.source.LastName + " and " + d.target.FirstName + " " + d.target.LastName + " is "+d.NumOfConn;
			else
				captionstr = "Number of connections is " + d.NumOfConn;	
			selEdgeSource = d.source.ExpertId;
			selEdgeTarget = d.target.ExpertId;
			if(lastSelEdgeSource != selEdgeSource || lastSelEdgeTarget != selEdgeTarget) {
				if(netSource == "Pub") {
					var jsonstr = 'http://reachnc1.unc.edu/bbsp/getCoPubJSON.php?eid='+d.source.ExpertId+'&co_eid='+d.target.ExpertId;
					d3.json(jsonstr, function(error, records) {
						var cstr = "";
						for(var i=0; i<records.length; i++) {
							cstr += records[i].Co_PubTitle + "+";
						}
						cstr = cstr.substring(0, cstr.length-1);
						populateCoCollabHTMLTable(captionstr, cstr);		
					});
				}
				else // grants
					populateCoCollabHTMLTable(captionstr, d.Detail);
				lastSelEdgeSource = selEdgeSource;
				lastSelEdgeTarget = selEdgeTarget;
				// clear out previously clicked/hgted other links if any
				if(lastSelLink != null)
					lastSelLink.style("stroke", "#999");
				lastSelLink = d3.select(this);
				lastSelLink.transition() 
					.duration(500)
					.style("stroke", "red");
			}
			else { // clear out the selection if the selected link is clicked again
				d3.select(this).transition() 
					.duration(500)
					.style("stroke", "#999");
				lastSelLink = null;	
				lastSelEdgeSource = -1;
				lastSelEdgeTarget = -1;
				$("#datainfo").html("");
			}
			// clear out previously clicked/hgted other nodes if any
			if(lastSelNode != null) {
				lastSelNode.style("stroke", d3.rgb(142, 186, 229).darker());
				lastSelNode = null;
				lastSelExpertId = -1;
			}
		});
	
	path.append("title").text(function(d) {
		var retstr;
		if(typeof d.source.FirstName != 'undefined') 
			retstr = d.NumOfConn + " between " + d.source.FirstName + " " + d.source.LastName + " and " + d.target.FirstName + " " + d.target.LastName;
		else
			retstr = d.NumOfConn + " connections";
		return retstr;
		});
	link.exit().remove(); // very important, otherwise, old data will not be removed
		
	node = svg.selectAll(".node")
		.data(nodeData, function(d) { return d.ClientId;}); // very important to add index via function to data to ensure subsequent filtering and coloring work
		
	var gnode =	node.enter().append("g")
		.attr("class", "node")  
		.attr("id", function(d) {return d.ExpertId;})
		.on("click", function(d) {
			var captionstr = d.FirstName + " " + d.LastName + ", " + d.Affiliation;
			if(netSource == "Pub") 
				captionstr += ", Number of Publications: " + d.NumOfPubs;	
			else // grants
				captionstr += ", Number of Grants: " + d.NumOfGrants;
			var jsonstr;
			if(lastSelExpertId != d.ExpertId) {
				if(netSource == "Pub")
					jsonstr = 'http://reachnc1.unc.edu/bbsp/getOneExpertPubJSON.php?eid='+d.ExpertId;
				else // grants
					jsonstr = 'http://reachnc1.unc.edu/bbsp/getOneExpertGrantJSON.php?eid='+d.ExpertId;			
				d3.json(jsonstr, function(error, records) {
					recsForExpert = records;
					totalRecsForExpert = records.length;
					if(totalRecsForExpert<=0)
						$("#datainfo").html(captionstr);
					else
						populateHTMLTable(captionstr);
				});
				lastSelExpertId = d.ExpertId;
				// clear out previously clicked/hgted other nodes if any
				if(lastSelNode != null)
					lastSelNode.style("stroke", d3.rgb(142, 186, 229).darker());
				lastSelNode = d3.select(this).select("circle");				
				lastSelNode.transition() 
					.duration(200)
					.style("stroke", d3.rgb(255, 0, 0));
			}
			else {// clear out the selection if the selected node is clicked again
				$("#datainfo").html("");
				lastSelNode = null;
				lastSelExpertId = -1;
				d3.select(this).select("circle").transition() 
					.duration(200)
					.style("stroke", d3.rgb(142, 186, 229).darker());			
			}
			// clear out previously clicked/hgted link if any
			if(lastSelLink != null) {
				lastSelLink.style("stroke", "#999");
				lastSelLink = null;
				lastSelEdgeSource = -1;
				lastSelEdgeTarget = -1;
			}			
		})
		.call(force.drag)
			.on("mouseover", fadeRelativeToNode(0.2))
			.on("mouseout", fadeRelativeToNode(1))
		.call(node_drag);	

	gnode.append("circle")
		.attr("r", function(d) { 
			var val=3;
			if(netSource == "Pub")
				val += d.NumOfPubs*1.0*radius/maxNumOfPubs;
			else // grants;
				val += d.NumOfGrants*1.0*radius/maxNumOfGrants;
			return val; 
			})
		.style("fill", function(d) { return color(d.Unit); })
		//.style("fill", d3.rgb(142, 186, 229))
		.style("opacity", 0.9)
		.style("stroke", d3.rgb(142, 186, 229).darker());	
	gnode.append("text")
		.attr("x", 12)
		.attr("dy", ".35em")
		.style("visibility", "hidden")
		.text(function(d) { return d.FirstName + " " + d.LastName; });		
	
	node.exit().remove();
	
	bDynamicLayout = true;
	document.getElementById("togglelayout").value = "Pause Layout";
	
	linkedByIndex = {};	
	linkData.forEach(function(d) {
		linkedByIndex[d.ClientId + "-" + d.Co_ClientId] = 1;
	});
	
	force
		.nodes(node.data())
		.links(link.data())
		.start();
		
	force.on("tick", tick);	
}
	
d3.json("getPubJSON.php", function(error, data) { // entry for retrieving initial data for visualization
	data.links.forEach (function(d) {
		d.source = +d.source;
		d.target = +d.target;
		d.NumOfConn = +d.NumOfConn;		
	});
	data.nodes.forEach(function(d) {
		d.NumOfPubs = +d.NumOfPubs;
		if(d.NumOfPubs > maxNumOfPubs)
			maxNumOfPubs = d.NumOfPubs;
	});
	oriData = data;
	linkData = data.links;
	nodeData = data.nodes;
	pubData =  JSON.parse(JSON.stringify(data));
	updateData();
});

// ** Update data section (Called from the onclick when changing between publication and grant)
function handleNetworkSourceChange(thisSource) {
	if(netSource == thisSource.value) return;
	netSource = thisSource.value;	
	if(netSource == "Pub" && pubData != null) {
		oriData = pubData;
		linkData = pubData.links;
		nodeData = pubData.nodes;
		updateData();
		// reset all unit checkboxes to checked
		var elements = document.getElementsByClassName('unit');
		for(var i = 0; i < elements.length; i++) {
	    	elements[i].checked = true;
		}
		for(var index=0; index < unitChecked.length; index++) 
			unitChecked[index] = true;		
	}
	else if(netSource == "Grant" && grantData != null) {
		oriData = grantData;
		linkData = grantData.links;
		nodeData = grantData.nodes;
		updateData();
		// reset all unit checkboxes to checked
		var elements = document.getElementsByClassName('unit');
		for(var i = 0; i < elements.length; i++) {
	    	elements[i].checked = true;
		}
		for(var index=0; index < unitChecked.length; index++) 
			unitChecked[index] = true;
	}
	else { // first time to check grant, need to retrieve grant data
		d3.json("getGrantJSON.php", function(error, data) {
			data.links.forEach (function(d) {
				d.source = +d.source;
				d.target = +d.target;
				d.NumOfConn = +d.NumOfConn;
			});
			data.nodes.forEach(function(d) {
				d.NumOfGrants = +d.NumOfGrants;
				if(d.NumOfGrants > maxNumOfGrants)
					maxNumOfGrants = d.NumOfGrants;
			});
			oriData = data;
			linkData = data.links;
			nodeData = data.nodes;
			grantData = JSON.parse(JSON.stringify(data));
			updateData();
			// reset all unit checkboxes to checked
			var elements = document.getElementsByClassName('unit');
			for(var i = 0; i < elements.length; i++) {
		    	elements[i].checked = true;
			}
			for(var index=0; index < unitChecked.length; index++) 
				unitChecked[index] = true;
			});
	}	
}

function handleNodeFilter() {
	var filterOutVals = new Array();
	var idx;
	for(idx = 0; idx < unitChecked.length; idx++) {
		if(!unitChecked[idx])  // filter it out
			filterOutVals.push(unitVals[idx]);
	}
	if(filterOutVals.length > 0) {
		linkData = oriData.links.filter(function(l) {
			//var retval = l.source.Affiliation.indexOf(filterOutVals[0]) == -1 && l.target.Affiliation.indexOf(filterOutVals[0]) == -1;
			var retval = (l.source.Unit != filterOutVals[0] && l.target.Unit != filterOutVals[0]);
			for(var i=1; i<filterOutVals.length; i++)
				//retval = retval && (l.source.Affiliation.indexOf(filterOutVals[i]) == -1 && l.target.Affiliation.indexOf(filterOutVals[i]) == -1);
				retval = (retval && (l.source.Unit != filterOutVals[i]) && (l.target.Unit != filterOutVals[i]));
			return retval;				
		});
		nodeData = oriData.nodes.filter(function(n) {
			//var retval = n.Affiliation.indexOf(filterOutVals[0]) == -1;
			var retval = (n.Unit != filterOutVals[0]);
			for(var i=1; i<filterOutVals.length; i++)
				//retval = retval && (n.Affiliation.indexOf(filterOutVals[i]) == -1);
				retval = (retval && (n.Unit != filterOutVals[i]));
			return retval;				
		});
	}
	else {
		nodeData = oriData.nodes;
		linkData = oriData.links;
	}
	updateData();	
}
// handle checkbox unit click events
function handleClick_SILS(cb) {
	if(unitChecked[0] == cb.checked) return;
	unitChecked[0] = cb.checked;
	handleNodeFilter();	
}

function handleClick_AS(cb) {
	if(unitChecked[1] == cb.checked) return;
	unitChecked[1] = cb.checked;
	handleNodeFilter();
}

function handleClick_Med(cb) {
	if(unitChecked[2] == cb.checked) return;
	unitChecked[2] = cb.checked;
	handleNodeFilter();
}

function handleClick_Dent(cb) {
	if(unitChecked[3] == cb.checked) return;
	unitChecked[3] = cb.checked;
	handleNodeFilter();
} 

function handleClick_SPH(cb) {
	if(unitChecked[4] == cb.checked) return;
	unitChecked[4] = cb.checked;
	handleNodeFilter();
} 

function handleClick_Pharmacy(cb) {
	if(unitChecked[5] == cb.checked) return;
	unitChecked[5] = cb.checked;
	handleNodeFilter();
} 

function handleClick_Admin(cb) {
	if(unitChecked[6] == cb.checked) return;
	unitChecked[6] = cb.checked;
	handleNodeFilter();
}

function ResetView() {
	zoom.scale(1);
	zoom.translate([0, 0]);
	//svg.transition().duration(500).attr('transform', 'translate(' + zoom.translate() + ') scale(' + zoom.scale() + ')');
	svg.attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")");
}

function ToggleLayout(ref) {
	if(bDynamicLayout) {
		ref.value="Resume Layout";
		bDynamicLayout = false;
		force.stop();
	}
	else {
		ref.value="Pause Layout";
		bDynamicLayout = true;	
		force.resume();
	}
}

function RestoreNode(id) {
	var selectorstr = "g.node[id='"+id+"']"; 
	d3.select(selectorstr).select("text").transition()
		.duration(200)
		.style("visibility", "hidden");	
	d3.select(selectorstr).select("circle").transition()
		.duration(200)	
		.style("stroke", d3.rgb(142, 186, 229).darker());	
}

function HgtNode(id) {
	var selectorstr = "g.node[id='"+id+"']";
	d3.select(selectorstr).select("text").transition()
		.duration(200)
		.style("visibility", "visible");	
	d3.select(selectorstr).select("circle").transition()
		.duration(200)	
		.style("stroke", d3.rgb(255, 0, 0));	
}

function updateSearch(querystr) {
	var k;
	if(querystr == "") {
		if(lastSearchNodes.length > 0) {
			for(k=0; k<lastSearchNodes.length; k++) 
				RestoreNode(lastSearchNodes[k]);
			lastSearchNodes.splice(0, lastSearchNodes.length);
		}
		lastSearchStr = "";
	}
	else if (querystr != lastSearchStr) {
		// clear out previously highlighted nodes
		if(lastSearchNodes.length > 0) {
			for(k=0; k<lastSearchNodes.length; k++) 
				RestoreNode(lastSearchNodes[k]);
			lastSearchNodes.splice(0, lastSearchNodes.length);
		}
		var partsOfStr = querystr.split(','); // comma is used for boolean or of different search terms
		var compoundstr = "";
		for(k=0; k<partsOfStr.length; k++) {
			partsOfStr[k].trim();
			if(partsOfStr[k]=="") continue;
			if(k==0) // last part
				compoundstr += partsOfStr[k];
			else
				compoundstr += "|" + partsOfStr[k];	
		}
		lastSearchStr = querystr;
		if(compoundstr == "") return;	
		var reqry = new RegExp(compoundstr, "i"); // do a case-insensitive and boolean or search match
	    nodeData.forEach(function(d) {
			if((d.FirstName + " " + d.LastName).match(reqry) || d.Affiliation.match(reqry)) {
				lastSearchNodes.push(d.ExpertId);
				HgtNode(d.ExpertId);
			}
		});
	       
  	}		
}

<?php
$con = mysql_connect("localhost","hongyi","REACH-NC") or die('Cannot connect to the DB');
mysql_select_db("reachnc3_archive", $con) or die('Cannot select the DB');
$qrystr = "SELECT * FROM Expert_BBSP_Pub";
$result = mysql_query($qrystr) or die('Errant query');
	
// output in json format
$ncnt = 0;
$myarrayNode = array();
while($row = mysql_fetch_assoc($result))
{
	$myarrayNode[] = $row;
	$ncnt++;
}
$qrystr = "SELECT * FROM Coauthors_BBSP";
$result = mysql_query($qrystr) or die('Errant query');

$myarrayEdge = array();
while($row = mysql_fetch_assoc($result))
{
	if($row['source'] < $ncnt && $row['target'] < $ncnt)
		$myarrayEdge[] = $row;
}

$myarray = array();
$myarray['nodes'] = $myarrayNode;
$myarray['links'] = $myarrayEdge;
echo json_encode($myarray);
mysql_close($con);
?>

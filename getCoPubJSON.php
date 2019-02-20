<?php
if(isset($_GET['eid']) && isset($_GET['co_eid'])) 
{
	$eid = $_GET['eid'];
	$co_eid = $_GET['co_eid'];
	$con = mysql_connect("localhost","hongyi","REACH-NC") or die('Cannot connect to the DB');
	mysql_select_db("reachnc3_archive", $con) or die('Cannot select the DB');
	$qrystr = "SELECT Co_PubTitle, Co_PubYear, Co_PubJournalTitle FROM Coauthors where ExpertId=" .$eid ." and Co_ExpertId=" .$co_eid ." order by Co_PubYear DESC";
	$result = mysql_query($qrystr) or die('Errant query');
	
	// output in json format
	$myarray = array();
	while($row = mysql_fetch_assoc($result))
	{
	$myarray[] = $row;
	}
	echo json_encode($myarray);
	mysql_close($con);
}
else 
	echo "eid and co_eid have to be passed in to get co_publication of two experts";
?>

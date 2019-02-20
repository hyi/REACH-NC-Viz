<?php
if(isset($_GET['eid'])) 
{
	$eid = $_GET['eid'];
	$con = mysql_connect("localhost","hongyi","REACH-NC") or die('Cannot connect to the DB');
	mysql_select_db("reachnc3_archive", $con) or die('Cannot select the DB');
	$qrystr = "SELECT Title, Volume, Issue, PubYear, JournalTitle, Pagination, Authors FROM Publications where ExpertId=" .$eid ." order by PubYear DESC";
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
	echo "eid has to be passed in to get publication of the expert";
?>

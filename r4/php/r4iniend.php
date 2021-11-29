<?php
if(!defined('R4ALREADYINIT')) {
	define('R4ALREADYINIT', true);

	require 'r4.class.php';
	require 'db.class.php';

	$db = new DB();

	if(defined('INDEXDB')) {
		$dbtable = (defined('DBTABLE'))  ? DBTABLE : '';
		$db->connect(INDEXDB, $dbtable);
	}

} else {

	if(isset($db)) {
		$db->close();
	}

}
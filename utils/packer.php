<?php

$r4path = dirname(__FILE__);

require $r4path .'/vendor/JSPacker.class.php';

$usePacker = $argv[1] ?? '';

//R4 CSS
$content = implode(PHP_EOL, getFilesContent($r4path .'/../css', ['css']));

//Project CSS
$content .= PHP_EOL . implode(PHP_EOL, getFilesContent('./src/_assets/css/global', ['css']));

$content = minimizeCSS($content);

file_put_contents('./public/_assets/r4/r4.min.css', $content);



//JS R4
$content = getFilesContent($r4path .'/../js', ['js']);

$result = '';
foreach($content as $cont) {
	if($usePacker) {
		$packer = new JavaScriptPacker($cont, 'Normal', true, false);
		$result .= $packer->pack();
	} else {
		$result .= $cont;
	}
}

file_put_contents('./public/_assets/r4/r4.min.js', $result);



//HTML PUBLIC
/*
Not working
require './utils/vendor/TinyHtmlMinifier.php';
$tinyHtmlMinifier = new TinyHtmlMinifier([
	'collapse_whitespace' => true,
	'disable_comments' => false,
]);

$content = [];
$content = getFilesContent('./public', ['htm', 'html']);

foreach($content as $file => $html) {
	echo $file;
	file_put_contents($file, $tinyHtmlMinifier->minify($html));
}
*/


function getFilesContent($dir, $ext) {
	$allContent = [];
	if($handle = opendir($dir)) {
		while(false !== ($file = readdir($handle))) {
			if(($file != '.') && ($file != '..') && (!is_link($dir .'/'. $file))) {
				if(!is_dir($dir .'/'. $file)) {
					if(in_array(pathinfo($dir .'/'. $file, PATHINFO_EXTENSION), $ext)) {
						$allContent[$dir .'/'. $file] = file_get_contents($dir .'/'. $file);
					}
				}
			}
		}
	}
	return $allContent;
}

function minimizeCSS($input) {
	// Remove comments
	$output = preg_replace('#/\*.*?\*/#s', '', $input);
	// Remove whitespace
	$output = preg_replace('/\s*([{}|:;,])\s+/', '$1', $output);
	// Remove trailing whitespace at the start
	$output = preg_replace('/\s\s+(.*)/', '$1', $output);
	// Remove unnecesairy ;'s
	$output = str_replace(';}', '}', $output);
	//Put imports at the begin
	preg_match_all('|@import (.+?)\;|i', $output, $imports);
	$import = $imports[0];

	if(count($import)) {
		$output = preg_replace('|@import (.+?)\;|i', '', $output);
		$output = implode('', $import) .' '. $output;
	}

	return $output;
}

function removeSpaces($string){
	$string = preg_replace("/\s{2,}/", " ", $string);
	$string = str_replace("\n", "", $string);
	$string = str_replace(', ', ",", $string);
	return $string;
}

function removeCSSComments($css){
	$file = preg_replace("/(\/\*[\w\'\s\r\n\*\+\,\"\-\.]*\*\/)/", "", $css);
	return $file;
}
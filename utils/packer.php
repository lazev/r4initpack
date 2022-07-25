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

$content2 = getFilesContent('./src/_assets/js/global', ['js']);

$content = array_merge($content, $content2);

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


//JS PUBLIC
$content = [];
$content = getFilesContent('./public', ['js']);

foreach($content as $file => $cont) {
	if(substr($file, -7) == '.min.js') continue;
	$packer = new JavaScriptPacker($cont, 'Normal', true, false);
	file_put_contents($file, $packer->pack());
}

//CSS PUBLIC
$content = [];
$content = getFilesContent('./public', ['css']);

foreach($content as $file => $cont) {
	if(substr($file, -8) == '.min.css') continue;
	file_put_contents($file, minimizeCSS($cont));
}


//HTML PUBLIC
$content = [];
$content = getFilesContent('./public', ['htm', 'html', 'json']);

foreach($content as $file => $cont) {
	file_put_contents($file, minimizeHTML($cont));
}


function getFilesContent($dir, $ext) {
	$allContent = [];

	$arrFiles = scandir($dir);
	foreach($arrFiles as $filename) {

		$file = $dir .'/'. $filename;

		if(substr($filename, 0, 1) == '.') continue;

		if(is_link($file)) continue;

		if(is_dir($file)) {
			$subret = getFilesContent($file, $ext);
			$allContent = array_merge($allContent, $subret);
		}
		else {
			if(in_array(pathinfo($file, PATHINFO_EXTENSION), $ext)) {
				$allContent[$file] = file_get_contents($file);
			}
		}
	}

	return $allContent;
}


function minimizeHTML($input) {

	//Save pre
	preg_match_all('|<pre(.*?)>(.*?)\</pre>|sim', $input, $pre);
	foreach($pre[0] as $key => $val) {
		$input = str_replace($val, '<!~~r4SavePreHTMLElem'. $key .'~~>', $input);
	}

	//remove redundant (white-space) characters
	$replace = array(
		//remove tabs before and after HTML tags
		'/\>[^\S ]+/s' => '>',
		'/[^\S ]+\</s' => '<',
		//shorten multiple whitespace sequences; keep new-line characters because they matter in JS!!!
		'/([\t ])+/s'  => ' ',
		//remove leading and trailing spaces
		'/^([\t ])+/m' => '',
		'/([\t ])+$/m' => '',
		// remove JS line comments (simple only); do NOT remove lines containing URL (e.g. 'src="http://server.com/"')!!!
		'~//[a-zA-Z0-9 ]+$~m' => '',
		//remove empty lines (sequence of line-end and white-space characters)
		'/[\r\n]+([\t ]?[\r\n]+)+/s' => "\n",
		//remove empty lines (between HTML tags); cannot remove just any line-end characters because in inline JS they can matter!
		'/\>[\r\n\t ]+\</s' => '><',
		//remove "empty" lines containing only JS's block end character; join with next line (e.g. "}\n}\n</script>" --> "}}</script>"
		'/}[\r\n\t ]+/s' => '}',
		'/}[\r\n\t ]+,[\r\n\t ]+/s' => '},',
		//remove new-line after JS's function or condition start; join with next line
		'/\)[\r\n\t ]?{[\r\n\t ]+/s' => '){',
		'/,[\r\n\t ]?{[\r\n\t ]+/s' => ',{',
		//remove new-line after JS's line end (only most obvious and safe cases)
		'/\),[\r\n\t ]+/s'  => '),',
		//remove quotes from HTML attributes that does not contain spaces; keep quotes around URLs!
		'~([\r\n\t ])?([a-zA-Z0-9]+)="([a-zA-Z0-9_/\\-]+)"([\r\n\t ])?~s' => '$1$2=$3$4', //$1 and $4 insert first white-space character found before/after attribute
		//Remove HTML comments
		'/<!--(.*)-->/Uis' => ''
	);

	$output = preg_replace(array_keys($replace), array_values($replace), $input);

	//remove optional ending tags (see http://www.w3.org/TR/html5/syntax.html#syntax-tag-omission )
	$remove = array(
		'</option>', '</li>', '</dt>', '</dd>', '</tr>', '</th>', '</td>'
	);

	$output = str_ireplace($remove, '', $output);

	//Restore PRE
	foreach($pre[0] as $key => $val) {
		$output = str_replace('<!~~r4SavePreHTMLElem'. $key .'~~>', $val, $output);
	}

	return $output;
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
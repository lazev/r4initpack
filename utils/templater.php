<?php

$rootFolder = './public/';

$headerFile = './src/_assets/templates/templates.html';

$headerCont = file_get_contents($headerFile);

$headerArr  = explode('<!--/R4TEMPLATE-->', $headerCont);

foreach($headerArr as $head) {

	$head = trim($head);

	if(!empty($head)) {

		preg_match_all('|\<!--R4TEMPLATE-(.*)--\>|', $head, $match);

		$version = $match[0][0];
		$head   .= PHP_EOL .'<!--/R4TEMPLATE-->';

		searchAll($rootFolder, $version, $head);
	}
}

moduleSearchAll($rootFolder);


function searchAll($rootFolder, $version, $head) {
	global $headerFile;

	$arrFiles = scandir($rootFolder);

	foreach($arrFiles as $file) {
		if(substr($file, 0, 1) == '.') continue;
		if($rootFolder . $file == $headerFile) continue;

		if(is_dir($rootFolder . $file) && !is_link($rootFolder . $file))  {

			searchAll($rootFolder . $file .'/', $version, $head);

		} else {

			if((substr($rootFolder . $file, -4) == 'html') || (substr($rootFolder . $file, -3) == 'htm')) {
				replacer($rootFolder . $file, $version, $head);
			}
		}
	}
}


function replacer($filename, $version, $head) {

	$filecont = file_get_contents($filename);

	if($version) {
		$filecont = str_replace($version, $head, $filecont);
	}

	$filecont = replaceCaches($filecont, $filename);

	file_put_contents($filename, $filecont);
}



function replaceCaches($content, $filename) {
	preg_match_all('|R4Cache::(\S*)\"|m', $content, $outArr);

	foreach($outArr[1] as $item) {
		$sep = '?';
		$tritem = $item;

		if(strpos($item, '?') !== false) {
			$sep = '&';
			$tritem = explode('?', $item)[0];
		}

		if(!file_exists('src/'. $tritem)) {
			echo PHP_EOL . PHP_EOL . 'File not found: '. $tritem .' in '. $filename;
		} else {
			$content = str_replace(
				'R4Cache::'. $item,
				$item . $sep . filemtime('src/'.$tritem),
				$content
			);
		}

	}

	return str_replace('R4Cache::', '', $content);
}



function moduleSearchAll($rootFolder) {
	global $headerFile;

	$arrFiles = scandir($rootFolder);

	foreach($arrFiles as $file) {
		if(substr($file, 0, 1) == '.') continue;
		if($rootFolder . $file == $headerFile) continue;

		if(is_dir($rootFolder . $file) && !is_link($rootFolder . $file)) {

			if($file == 'templates') {

				$templ = '';
				$templateFiles = scandir($rootFolder . $file .'/');

				foreach($templateFiles as $tfile) {
					$tpath = $rootFolder . $file .'/'. $tfile;

					if((substr($tpath, -4) == 'html') || (substr($tpath, -3) == 'htm')) {
						$templ .= file_get_contents($tpath);
					}
				}
				if(file_exists($rootFolder .'index.html')) {
					moduleReplacer($rootFolder .'index.html', $templ);
				}

			} else {
				moduleSearchAll($rootFolder . $file .'/');
			}
		}
	}
}


function moduleReplacer($filename, $templates) {
	$filecont = file_get_contents($filename);
	$filecont = str_replace('</body>', $templates .'</body>', $filecont);

	file_put_contents($filename, $filecont);
}
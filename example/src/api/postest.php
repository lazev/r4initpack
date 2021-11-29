<?php
$url     = strtolower($_REQUEST['url'])    ?: 'https://localhost/api/produtos/';
$method  = strtolower($_REQUEST['method']) ?: 'get';
$payload = $_REQUEST['payload'];
?>

<form action="postest.php" method="get">
	<input type="text" name="method" value="<?php echo $method; ?>" size="10">

	<input type="text" name="url" placeholder="URL" value="<?php echo $url; ?>" size="70">

	<button type="submit">Vai</button><br>

	<textarea name="payload" style="width: 730px; height: 140px"><?php echo $payload; ?></textarea>

</form>

<?php

$token = base64_encode('id3:ZiQ7hEvb9cYEku7Cm89zGZy5ZoLbIa8SgHUceO4IHoLbafeLapbgY+3qrYr0cdFA/1+coJ66LRFEcQRph6cSDw==');

$header = [
	'Authorization: Basic '. $token,
	'Content-Type: application/json',
	'Accept: application/json'
];

$ch = curl_init();

curl_setopt_array($ch, [
	CURLOPT_POST           => ($method == 'post') ? true : false,
	CURLOPT_URL            => $url,
	CURLOPT_HTTPHEADER     => $header,
	CURLOPT_POSTFIELDS     => $payload,
	CURLOPT_CUSTOMREQUEST  => $method,
	CURLOPT_MAXREDIRS      => 10,
	CURLOPT_TIMEOUT        => 10,
	CURLOPT_SSL_VERIFYHOST => 2,
	CURLOPT_SSL_VERIFYPEER => false, //true,
	CURLOPT_FOLLOWLOCATION => true,
	CURLOPT_RETURNTRANSFER => true,
	CURLOPT_HEADER         => false
]);

echo '<pre>';

// for($ii=0; $ii<10; $ii++) {
// 	$ret    = curl_exec($ch);
// 	$retArr = json_decode($ret, 1);
// 	print_r($retArr);
// }

$ret    = curl_exec($ch);
$retArr = json_decode($ret, 1);

print_r($retArr);

echo '</pre>';
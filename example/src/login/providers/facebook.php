<?php
class Facebook {

	public $nameId = 'facebook';
	public $errMsg = '';
	public $errObs = '';

	private $clientId        = '835715783770816';
	private $clientSecret    = '4edd31478ff5aea307c502acf43a0eba';
	private $redirectUri     = ROOT_URL .'login/providers/returl.php?retfb';
	private $graphApiVersion = 'v11.0';
	private $scope           = [];
	private $client          = '';

	public function __construct() {
		require ROOT .'_assets/vendor/autoload.php';

		$this->client = new \League\OAuth2\Client\Provider\Facebook([
			'clientId'        => $this->clientId,
			'clientSecret'    => $this->clientSecret,
			'redirectUri'     => $this->redirectUri,
			'graphApiVersion' => $this->graphApiVersion
		]);
	}


	public function getAuthorizationUrl() {
		return $this->client->getAuthorizationUrl([
			'scope' => $this->scope
		]);
	}


	public function getAccessToken($grant, $params) {
		try {
			return $this->client->getAccessToken($grant, $params);
		} catch (Exception $e) {
			$this->errMsg = $e->getMessage();
			return false;
		}
	}


	public function getResourceOwner($token) {
		try {

			$arr = $this->client->getResourceOwner($token)->toArray();
			return [
				'provider'   => $this->nameId,
				'providerId' => $arr['id'],
				'name'       => $arr['name'],
				'emails'     => $arr['email'],
				'picture'    => $arr['picture_url']
			];

		} catch (Exception $e) {
			$this->errMsg = $e->getMessage();
			return false;
		}
	}
}
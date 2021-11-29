<?php
class Google {

	public $nameId = 'google';
	public $errMsg = '';
	public $errObs = '';

	private $clientId     = '554836546389-7aa3kiuuaa3fe9ip7d4ioeps8pipqn8p.apps.googleusercontent.com';
	private $clientSecret = '45sj5F2-GQgpvqPGYtoLsYUL';
	private $redirectUri  = ROOT_URL .'login/providers/returl.php?retgg';
	private $scope        = [];
	private $client       = '';

	public function __construct() {
		require ROOT .'_assets/vendor/autoload.php';

		$this->client = new \League\OAuth2\Client\Provider\Google([
			'clientId'        => $this->clientId,
			'clientSecret'    => $this->clientSecret,
			'redirectUri'     => $this->redirectUri
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
				'providerId' => $arr['sub'],
				'name'       => $arr['name'],
				'emails'     => $arr['email'],
				'picture'    => $arr['picture']
			];

		} catch (Exception $e) {
			$this->errMsg = $e->getMessage();
			return false;
		}
	}
}
<?php
class LinkedIn {

	public $nameId = 'linkedin';
	public $errMsg = '';
	public $errObs = '';

	private $clientId     = '';
	private $clientSecret = '';
	private $redirectUri  = ROOT_URL .'login/providers/returl.php?retli';
	private $scope        = [];
	private $client       = '';

	public function __construct() {
		require ROOT .'_assets/vendor/autoload.php';

		$this->client = new \League\OAuth2\Client\Provider\LinkedIn([
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
			//RETORNO NÃO VERIFICADO
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
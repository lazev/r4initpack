const Login = {

	fbAuthUrl: '',
	ggAuthUrl: '',
	igAuthUrl: '',
	liAuthUrl: '',

	setPaths: () => {
		Login.pathAjax   = _CONFIG.rootURL +'login/ajax.php';
		Login.pathFields = _CONFIG.rootURL +'login/fields.json';
	},


	init: async () => {
		Login.setPaths();
		Login.initFields();
		Login.getInit();
		Login.hasher();
	},


	getInit: () => {
		let params = {
			com: 'getInit'
		};
		$().getJSON(Login.pathAjax, params)
		.then(ret => {
			if(ret.logged) {
				Login.afterLogin();
			}

			Login.fbAuthUrl = ret.fbAuthUrl;
			Login.ggAuthUrl = ret.ggAuthUrl;
			Login.igAuthUrl = ret.igAuthUrl;
			Login.liAuthUrl = ret.liAuthUrl;
		});
	},


	initFields: async () => {
		await Fields.createFromFile(Login.pathFields)
		.then(() => {
			Login.setEvents();
		});
	},


	setEvents: () => {
		$('#formLogin').submit(event => {
			event.preventDefault();
			Login.login();
		});

		$('#login_btnFb').click(() => {
			window.location = Login.fbAuthUrl;
		});

		$('#login_btnGg').click(() => {
			window.location = Login.ggAuthUrl;
		});

		$('#login_btnWa').click(() => {
			WebAuth.create();
		});

		$('#boxMsg').click((ev) => {
			$(ev.target).slideUp();
		});
	},


	hasher: () => {
		if(!window.location.hash || window.location.hash == '#') return;

		let hash = window.location.hash.substr(1);

		let hasMsg = false;

		if(hash == 'access_denied') {
			hasMsg = true;
			$('#boxMsg').html('É necessário autorizar para continuar.');
		}
		else if(hash == 'code_expired') {
			hasMsg = true;
			$('#boxMsg').html('Autenticação expirou. Por favor, tente novamente.');
		}
		else if(hash.indexOf('msg') > -1) {
			hasMsg = true;
			let obj = $().getHashParams(hash);
			$('#boxMsg').html(obj.msg +'<br><i>'+ obj.obs +'</i>');
		}

		if(hasMsg) {
			$('#boxMsg').slideDown();
			window.location.hash = '';
		}
	},


	login: () => {
		let params = {
			com: 'login',
			user: $('#login_user').val(),
			pass: $('#login_pass').val(),
			save: $('#login_save').val()
		};

		$().getJSON(Login.pathAjax, params)

		.then(dados => {
			if(dados.logged) {
				Login.afterLogin();
			}
		})

		.catch(dados => {

		});
	},


	afterLogin: () => {
		window.location = _CONFIG.rootURL +'inicio/';
	}
};
const Login = {

	fbAuthUrl: '',
	ggAuthUrl: '',
	igAuthUrl: '',
	liAuthUrl: '',

	pathAjax:       _CONFIG.rootURL +'login/ajax.php',
	pathFields:     _CONFIG.rootURL +'login/fields.json',
	pathAfterLogin: _CONFIG.rootURL +'inicio/',


	init: async () => {
		Login.initFields();
		Login.getInit();
		Login.hasher();
	},


	getInit: () => {
		let params = {
			com: 'getInit'
		};
		R4.getJSON(Login.pathAjax, params)
		.then(ret => {
			if(ret.logged) {
				//Login.afterLogin();
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
		$('#formLogin').on('submit', (item, ev) => {
			ev.preventDefault();
			Login.login();
		});

		$('#login_btnFb').on('click', (item, ev) => {
			window.location = Login.fbAuthUrl;
		});

		$('#login_btnGg').on('click', (item, ev) => {
			window.location = Login.ggAuthUrl;
		});

		$('#login_btnWa').on('click', (item, ev) => {
			WebAuth.create();
		});

		$('#boxMsg').on('click', (item, ev) => {
			$(ev.target).slideUp();
		});
	},


	hasher: () => {
		if(!window.location.hash || window.location.hash == '#') return;

		let hash = window.location.hash.substr(1);

		let hasMsg = false;

		if(hash == 'access_denied') {
			hasMsg = true;
			$('#boxMsg').innerHTML = 'É necessário autorizar para continuar.';
		}
		else if(hash == 'code_expired') {
			hasMsg = true;
			$('#boxMsg').innerHTML = 'Autenticação expirou. Por favor, tente novamente.';
		}
		else if(hash.indexOf('msg') > -1) {
			hasMsg = true;
			let obj = R4.getHashParams(hash);
			$('#boxMsg').innerHTML = obj.msg +'<br><i>'+ obj.obs +'</i>';
		}

		if(hasMsg) {
			Effects.slideDown($('#boxMsg'));
			window.location.hash = '';
		}
	},


	login: () => {
		R4.getJSON(Login.pathAjax, {
			com: 'login',
			user: $('#login_user').val(),
			pass: $('#login_pass').val(),
			save: $('#login_save').val()
		})
		.then(dados => {
			if(dados.logged) {
				Login.afterLogin();
			}
		})
		.catch(dados => {

		});
	},


	afterLogin: () => {
		window.location = Login.pathAfterLogin;
	}
};
const SignUp = {

	setPaths: () => {
		SignUp.pathAjax   = _CONFIG.rootURL +'signup/ajax.php';
		SignUp.pathFields = _CONFIG.rootURL +'signup/fields.json';
	},


	init: async () => {
		SignUp.setPaths();
		SignUp.initFields();
	},


	initFields: async () => {
		await Fields.createFromFile(SignUp.pathFields)
		.then(() => {

			$('#formSignUp').submit(event => {
				event.preventDefault();
				SignUp.save();
			});
		});
	},


	save: () => {
		if(SignUp.valid()) {

			let params = {
				com:   'save',
				user:  $('#signUp_user').val(),
				pass:  $('#signUp_pass').val(),
				pass2: $('#signUp_pass2').val(),
			};

			R4.getJSON(SignUp.pathAjax, params)
			.then(dados => {
				if(dados.ok) {
					window.location = _CONFIG.rootURL +'inicio/';
				}
			})
			.catch(dados => {
				if(dados.status == '10') {
					Warning.show('<a href="'+ _CONFIG.rootURL +'login/">Clique aqui para recuperar o acesso</a>');
				}
			});
		}
	},


	valid: () => {
		return true;

	}

};
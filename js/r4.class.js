//Evento que roda a função R4Init após carregamento da página
document.addEventListener('DOMContentLoaded', function() {
	R4.init((typeof R4Init === 'function') ? R4Init : null);
});


//Métodos disponíveis em todos elementos chamados com o seletor $('')
let methods = {

	on: function(ev, func) {
		this.addEventListener(ev, func);
	},

	trigger: function(ev) {
		let event = new Event(ev);
		this.dispatchEvent(event);
	},

	val: function(val) {
		if(arguments.length === 0) return Fields.getVal(this);
		else return Fields.setVal(this, val);
	},

	attr: function(name, value) {
		if(arguments.length === 1) {
			return this.getAttribute(name);
		} else {
			this.setAttribute(name, value);
		}
	},

	visible: function() {
		return (this.offsetParent !== null);
	}
};


//Seletor de elementos (dom)
var $ = function(el) {

	let elem, k;

	if(typeof el === 'object') elem = el;
	else elem = document.querySelector(el);

	if(elem)
		for(k in methods)
			elem.__proto__[k] = methods[k];

	return elem;
};


//Roda uma função em uma lista de elementos
var $each = function(el, func) {
	let list = document.querySelectorAll(el);

	if(typeof func === 'function') {
		list.forEach((item, key) => {
			func( $(item), key );
		});
	}

	return list;
};


//Criador de elementos
var $new = function(html, fn) {
	let parent = document.createElement('div');
	parent.innerHTML = html;
	let el = $(parent.firstChild);
	return el;
};


//Conjunto de funções gerais
var R4 = {

	init: function() {
		R4.listeners();
		if(typeof R4Init === 'function') R4Init();
	},


	listeners: function() {
		//mobile debuger
		window.onerror = function (msg, url, lineNo, columnNo, error) {
			Warning.show(msg, url +': '+ lineNo +':'+ columnNo +':'+ error);
		};

		document.addEventListener('keydown', function(event) {
			if(event.keyCode == 27) {
				if(typeof Dialog === 'object') {
					Dialog.closeLastOpen();
				}
			}
		});

		document.addEventListener('click', function(ev) {
			if(ev.target.tagName.toLowerCase() != 'button') {
				Pop.destroyAllExcept(ev.target.getAttribute('R4PopTarget'));
				Warning.hideAll();
			}
		});
	},


	uniqid: function() {
		return (
			Math.random()
				.toString()
				.substr(-5) +
			Math.random()
				.toString()
				.substr(-5)
		);
	},


	typeEffect: function(el, txt, speed) {

		let newTxt = '';
		let typeEffectInterval = setInterval(() => {
			if(newTxt.length < txt.length) {
				newTxt = txt.substr(0, (newTxt.length+1));
				el.innerHTML = newTxt + '_';
			} else {
				clearInterval(typeEffectInterval);
				el.innerHTML = txt;
			}
		}, (speed ?? 15));
	},


	currentDate: function() {
		let now = new Date().toISOString();
		return now.substr(0, 10);
	},


	currentDateTime: function() {
		let now = new Date().toISOString();
		return now.substr(0, 19).replace('T', ' ');
	},


	dateMask: function(dt) {
		if(!dt) return '';
		if(dt == '0000-00-00' || dt == '0000-00-00 00:00:00') return '';

		return dt.substr(8, 2) +'/'
		     + dt.substr(5, 2) +'/'
		     + dt.substr(0, 4);
	},


	dateUnmask: function(dt, ifempty) {
		if(!dt) return ifempty ?? '';

		return dt.substr(6, 4) +'-'
		     + dt.substr(3, 2) +'-'
		     + dt.substr(0, 2);
	},


	round: function(num, dec) {
		if(!num) return 0;
		if(!dec) dec = 0;
		num = Number(num).toFixed(10);
		return parseFloat(Number(Math.round(num+'e'+dec)+'e-'+dec));
	},


	numberMask: function(number, mindec, maxdec) {
		if(!mindec) mindec = 0;
		if(!maxdec) maxdec = mindec;

		var sep = '.';
		var dec = ',';
		var num = R4.round(number, maxdec)+'';
		var s   = num.split('.');

		if(sep) {
			if(s[0].length > 3) {
				s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
			}
		}

		if(mindec > 0) {
			if(!s[1]) s[1] = '0';
			while(s[1].length < mindec) s[1] += '0';
		}

		return (s[1]) ? s.join(dec) : s[0];
	},


	numberUnmask: function(num) {
		return R4.toUSNumber(num);
	},


	toUSNumber: function(num) {
		if(!isNaN(num)) return num;
		while(num.indexOf('.') > -1) num = num.replace('.','');
		num = parseFloat(num.replace(',', '.'));
		if(!isNaN(num)) return num;
		else return 0.00;
	},


	toEUNumber: function(num) {
		if(isNaN(num)) {
			console.warn('Not a number:', num);
			return num;
		}
		let str = num.toString();
		while(str.indexOf(',') > -1) str = str.replace(',','');
		str = str.replace('.', ',');
		return str;
	},


	stripAccents: function(str) {

		let out = [
			'À','Á','Â','Ã','Ä','Å','à','á','â','ã','ä','å','Ò','Ó','Ô','Õ','Õ','Ö','Ø',
			'ò','ó','ô','õ','ö','ø','È','É','Ê','Ë','è','é','ê','ë','ð','Ç','ç','Ð',
			'Ì','Í','Î','Ï','ì','í','î','ï','Ù','Ú','Û','Ü','ù','ú','û','ü','Ñ','ñ',
			'Š','š','Ÿ','ÿ','ý','Ž','ž'];

		let inx = [
			'A','A','A','A','A','A','a','a','a','a','a','a','O','O','O','O','O','O','O',
			'o','o','o','o','o','o','E','E','E','E','e','e','e','e','e','C','c','D',
			'I','I','I','I','i','i','i','i','U','U','U','U','u','u','u','u','N','n',
			'S','s','Y','y','y','Z','z'];

		for(var i = 0; i < out.length; i++) {
			str = str.replaceAll(out[i], inx[i]);
		}

		return str;
	},


	friendlyName: function(v) {
		v = R4.stripAccents(v);

		let allowedchars = 'abcdefghijklmnopqrstuvwxyz.0123456789-_@'

		let ret = '';
		for(var i = 0; i < v.length; i++)
			if(allowedchars.indexOf(v[i].toLowerCase()) > -1)
				ret += v[i];

		return ret;
	},


	onlyNumbers: function(v) {
		return v.replace(/\D/g, '');
	},


	integerMask: function(v) {
		return v.replace(/([^0-9-])/g, '');
	},


	decimalMask: function(v) {
		return v.replace(/([^0-9-.,])/g, '');
	},


	cepMask: function(v) {
		return v
			.replace(/\D/g, '')
			.replace(/^(\d{5})(\d)/, '$1-$2');
	},


	phoneMask: function(v) {
		return v
			.replace(/\D/g, '')
			.replace(/^(\d\d)(\d)/g, '($1) $2')
			.replace(/(\d{4})(\d)/, '$1-$2');
	},


	cpfcnpjMask: function(v) {
		v = v.replace(/\D/g, '');
		if(v.length < 12) return R4.cpfMask(v);
		else return R4.cnpjMask(v);
	},


	cpfMask: function(v){
		return v
			.replace(/\D/g, '')
			.replace(/(\d{3})(\d)/, '$1.$2')
			.replace(/(\d{3})(\d)/, '$1.$2')
			.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
	},


	cnpjMask: function(v){
		return v
			.replace(/\D/g, '')
			.replace(/(\d{2})(\d)/, '$1.$2')
			.replace(/(\d{3})(\d)/, '$1.$2')
			.replace(/(\d{3})(\d)/, '$1/$2')
			.replace(/(\d{4})(\d)/, '$1-$2');

	},


/*
function soNumeros(v){
    return v.replace(/\D/g,"")
}
function telefone(v){
    v=v.replace(/\D/g,"")                 //Remove tudo o que não é dígito
    v=v.replace(/^(\d\d)(\d)/g,"($1) $2") //Coloca parênteses em volta dos dois primeiros dígitos
    v=v.replace(/(\d{4})(\d)/,"$1-$2")    //Coloca hífen entre o quarto e o quinto dígitos
    return v
}
function cpf(v){
    v=v.replace(/\D/g,"")                    //Remove tudo o que não é dígito
    v=v.replace(/(\d{3})(\d)/,"$1.$2")       //Coloca um ponto entre o terceiro e o quarto dígitos
    v=v.replace(/(\d{3})(\d)/,"$1.$2")       //Coloca um ponto entre o terceiro e o quarto dígitos
                                             //de novo (para o segundo bloco de números)
    v=v.replace(/(\d{3})(\d{1,2})$/,"$1-$2") //Coloca um hífen entre o terceiro e o quarto dígitos
    return v
}
function cep(v){
    v=v.replace(/D/g,"")                //Remove tudo o que não é dígito
    v=v.replace(/^(\d{5})(\d)/,"$1-$2") //Esse é tão fácil que não merece explicações
    return v
}

function telefone(v){
    v=v.replace(/\D/g,"")                 //Remove tudo o que não é dígito
    v=v.replace(/^(\d\d)(\d)/g,"($1) $2") //Coloca parênteses em volta dos dois primeiros dígitos
    v=v.replace(/(\d{4})(\d)/,"$1-$2")    //Coloca hífen entre o quarto e o quinto dígitos
    return v
}
function cpf(v){
    v=v.replace(/\D/g,"")                    //Remove tudo o que não é dígito
    v=v.replace(/(\d{3})(\d)/,"$1.$2")       //Coloca um ponto entre o terceiro e o quarto dígitos
    v=v.replace(/(\d{3})(\d)/,"$1.$2")       //Coloca um ponto entre o terceiro e o quarto dígitos
                                             //de novo (para o segundo bloco de números)
    v=v.replace(/(\d{3})(\d{1,2})$/,"$1-$2") //Coloca um hífen entre o terceiro e o quarto dígitos
    return v
}
function mdata(v){
    v=v.replace(/\D/g,"");
    v=v.replace(/(\d{2})(\d)/,"$1/$2");
    v=v.replace(/(\d{2})(\d)/,"$1/$2");

    v=v.replace(/(\d{2})(\d{2})$/,"$1$2");
    return v;
}
function mcc(v){
    v=v.replace(/\D/g,"");
    v=v.replace(/^(\d{4})(\d)/g,"$1 $2");
    v=v.replace(/^(\d{4})\s(\d{4})(\d)/g,"$1 $2 $3");
    v=v.replace(/^(\d{4})\s(\d{4})\s(\d{4})(\d)/g,"$1 $2 $3 $4");
    return v;
}
*/


	getJSON: function(url, params, opts) {
		if (!opts)   opts   = {};
		if (!params) params = {};

		return new Promise(function(resolve, reject) {

			let arr = [],
			    strParams = '',
			    xhr = new XMLHttpRequest(),
			    method = opts.method || 'POST';

			if(typeof params !== 'object') strParams = params;
			else {
				for(var key in params) {
					if(typeof params[key] === 'object') {
						for(let key2 in params[key]) {
							arr.push(key +'['+ key2 +']='+ encodeURIComponent(params[key][key2]));
						}
					} else arr.push(key +'='+ encodeURIComponent(params[key]));
				}
				strParams = arr.join('&').replace( /%20/g, '+' );
			}

			xhr.open(method, url, true);
			xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4) {
					if (xhr.status === 200) {
						var resp = xhr.responseText;
						try {
							var jResp = JSON.parse(resp);

							if(jResp.error === 1) {
								Warning.show(jResp.errMsg, jResp.errObs);
								if(jResp.status == 401) {
									window.location = _CONFIG.rootURL +'login/';
								}
								reject(jResp);
							} else {
								resolve(jResp);
							}
						} catch(err) {
							Warning.show(xhr.status);
							reject(xhr.status);
						}
					} else {
						Warning.show(xhr.status);
						reject(xhr.status);
					}
				}
			};

			xhr.send(strParams);
		});
	},


	blockScreen: function(bool) {
		if(bool) {
			$each('button:enabled', function(item){
				item.disabled = true;
				item.classList.add('R4Disabled');
			});
			$('.loadOverlay').classList.remove('hidden');
		} else {
			$each('button.R4Disabled', function(item){
				item.disabled = false;
				item.classList.remove('R4Disabled');
			});
			$('.loadOverlay').classList.add('hidden');
		}
	},


	getScript: function(files) {
		return new Promise((resolve, reject) => {
			let counter  = 0;
			let arrFiles = [];

			if(typeof files === 'string') arrFiles = [files];
			else arrFiles = files;

			arrFiles.map(file => {
				counter++;

				let script    = document.createElement('script');
				script.src    = file;
				script.onload = () => {
					counter--;
					if(counter === 0) resolve();
				};

				document.head.append(script);
			});
		});
	},


	getHTML: function(source){
		return new Promise((resolve, reject) => {

			fetch(source)

			.then(resp => {

				if(resp.ok) resolve( resp.text() );

				else {
					if(typeof Warning === 'object') {
						Warning.show(
							'Erro ao buscar dados',
							resp.status +' - '+ resp.statusText
						);
					}
					reject(resp.status +' - '+ resp.statusText);
				}
			})
			.catch(err => {
				if(typeof Warning === 'object') {
					Warning.show(
						'Erro de conexão',
						'Problema com a internet?'
					);
				}
				reject(err);
			});

		});
	},


	setRemoteHTML: function(destiny, source) {
		return new Promise((resolve, reject) => {

			R4.getHTML(source)

			.then(html => {
				destiny.innerHTML = html;
				resolve();
			});
		});
	},


	importCSS: function(source){
		let script  = document.createElement('link');
		script.href = source;
		script.setAttribute('type', 'text/css');
		script.setAttribute('rel', 'stylesheet');
		document.head.append(script);
	},


	getHashParams: function(hash) {
		let ret = {};
		let arr = [];
		let tmp = [];

		if(hash.substr(0, 1) == '#') hash = hash.substr(1);

		if(hash.indexOf('=') < 1) return hash;

		if(hash.indexOf('&') > -1) {
			arr = hash.split('&');
		} else {
			arr.push(hash);
		}

		arr.forEach(item => {
			tmp = item.split('=');
			ret[encodeURIComponent(tmp[0])] = encodeURIComponent(tmp[1]);
		});

		return ret;
	},


	getURLParams: filter => {
		let ret = {};
		let arr = [];
		let tmp = [];

		let strparam = window.location.search;

		if(strparam[0] != '?') return null;

		strparam = strparam.substr(1);
		arr = strparam.split('&');

		arr.forEach(item => {
			tmp = item.split('=');
			ret[decodeURIComponent(tmp[0])] = decodeURIComponent(tmp[1]);
		});

		if(filter) return ret[filter];
		return ret;
	},


	render: (templateElem, payload) => {

		let content;
		let processed = '';
		let elem = templateElem.content.cloneNode(true);

		if((typeof payload == 'object') && (payload.length) && (elem.querySelector('[loop]'))) {
			let htmlElem = elem.querySelector('[loop]');
			htmlElem.removeAttribute('loop');
			let crude = htmlElem.outerHTML;

			payload.forEach(row => {
				content = crude;

				for(var key in row) {
					content = content.split('{{'+ key +'}}').join(row[key]);
				}

				processed += content;
			});

			if(htmlElem.parentNode.nodeType == 11) { //11: Fragment-node
				let retElem = document.createElement('div');
				retElem.innerHTML = processed;
				return retElem.childNodes;
			} else {
				htmlElem.parentNode.innerHTML = processed;
				return elem;
			}

		} else {

			content = elem.firstElementChild.outerHTML;

			for(var key in payload) {
				content = content.split('{{'+ key +'}}').join(payload[key]);
			}

			let retElem = document.createElement('div');
			retElem.innerHTML = content;

			return retElem.firstChild;
		}
	},


	render2: (templateElem, payload) => {

		let html = templateElem.content.cloneNode(true);

		if((typeof payload == 'object') && (payload.length) && (html.querySelector('[loop]'))) {

			htmlElem = html.querySelector('[loop]');
			htmlElem.removeAttribute('loop');

		}

		let rendrow = '';
		let final = '';

		payload.forEach(row => {
			rendrow = htmlElem;

			for(var key in row) {
				let val = row[key];

				rendrow = rendrow.split('{{'+ key +'}}').join(val);
			}

			final += rendrow;
		});

		html = final;


		return html;
	}
};
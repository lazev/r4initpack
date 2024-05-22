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

	val: function(val, label) {
		if(arguments.length === 0) return Fields.getVal(this);
		else return Fields.setVal(this, val, label);
	},

	attr: function(name, value) {
		if(arguments.length === 1) {
			return this.getAttribute(name);
		} else {
			this.setAttribute(name, value);
		}
	},

	find: function(selector) {
		return this.querySelectorAll(selector);
	},

	visible: function() {
		return (this.offsetParent !== null);
	}
};


//Seletor de elementos (dom)
var $ = function(el) {

	let elem = (typeof el === 'object') ? el : document.querySelector(el);

	let k;
	if(elem)
		for(k in methods)
			elem.__proto__[k] = methods[k];

	return elem;
};


//Executa uma função em uma lista de elementos
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
var $new = function(html) {
	let parent = document.createElement('div');
	parent.innerHTML = html;
	let el = $(parent.firstChild);
	return el;
};


//Conjunto de funções gerais
var R4 = {

	moneySymbol: 'R$',


	init: function() {
		R4.listeners();
		if(typeof R4Init === 'function') R4Init();
	},


	listeners: function() {
		//mobile debuger
		//window.onerror = function (msg, url, lineNo, columnNo, error) {
		//	Warning.show(msg, url +': '+ lineNo +':'+ columnNo +':'+ error);
		//};

		document.addEventListener('keydown', function(event) {
			if(event.keyCode == 27) {
				let ultAberto;
				let arrOvers = document.querySelectorAll('.R4Overlay');
				for (let i = 0; i < arrOvers.length; i++) {
					if(!arrOvers[i].classList.contains('hidden')) {
						ultAberto = arrOvers[i];
					}
				}

				if(ultAberto && ultAberto.classList.contains('R4PopOverlay')) {
					let elemId = ultAberto.id.replace('R4PopOverlay-', '');
					Pop.destroyElem($('#'+ elemId), true);
				} else {
					if(typeof Dialog === 'object') {
						Dialog.closeLastOpen();
					}
				}
			}
		});

		document.addEventListener('click', function(ev) {
			if(ev.target.tagName.toLowerCase() != 'button' && ev.target.getAttribute('type') != 'button') {
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
		}, (speed || 15));
	},


	plural: function(txt, num, pluralTxt, singularTxt) {

		if(typeof pluralTxt   != 'string') pluralTxt   = 's';
		if(typeof singularTxt != 'string') singularTxt = '';

		return (num == 1) ? txt.replaceAll('(#)', singularTxt) : txt.replaceAll('(#)', pluralTxt);
	},


	checkDate: function(dateStr) {
		let regex = /^\d{4}-\d{2}-\d{2}$/;

		if(dateStr.match(regex) === null) return false;

		let date = new Date(dateStr);
		let timestamp = date.getTime();

		if(typeof timestamp !== 'number' || Number.isNaN(timestamp)) return false;

		return date.toISOString().startsWith(dateStr);
	},


	checkMail: function(x) {
		return /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(x);
	},


	checkCPF: function(CPF) {
		var invalid = false;
		if(CPF=='') {
			invalid = true;
		} else {
			if(CPF == '00000000000' || CPF == '11111111111' ||
				CPF == '22222222222' ||	CPF == '33333333333' || CPF == '44444444444' ||
				CPF == '55555555555' || CPF == '66666666666' || CPF == '77777777777' ||
				CPF == '88888888888' || CPF == '99999999999' || CPF == '00000000000') {
				invalid = true;
			}
			let sum = 0;
			for(let i=0; i<9; i++) sum += parseInt(CPF.charAt(i)) * (10-i);
			let rest = 11 - (sum % 11);
			if (rest == 10 || rest == 11) rest = 0;
			if (rest != parseInt(CPF.charAt(9))) invalid = true;
			sum = 0;
			for(let i=0; i<10; i++) sum += parseInt(CPF.charAt(i)) * (11-i);
			rest = 11-(sum % 11);
			if (rest == 10 || rest == 11) rest = 0;
			if (rest != parseInt(CPF.charAt(10))) invalid = true;
		}
		if(invalid) return false;
		else return 'CPF';
	},


	checkCNPJ: function(CNPJ) {
		var invalid = false;
		if(CNPJ.length == 15) {
			CNPJ = CNPJ.substr(1,14);
		}
		if(CNPJ != '00000000000000') {
			var c = CNPJ.substr(0,12);
			var dv = CNPJ.substr(12,2);
			var d1 = 0;
			for (let i = 0; i < 12; i++) d1 += c.charAt(11-i)*(2+(i % 8));
			if (d1 == 0) invalid = true;
			d1 = 11 - (d1 % 11);
			if (d1 > 9) d1 = 0;
			if(dv.charAt(0) != d1) invalid = true;
			d1 *= 2;
			for (let i = 0; i < 12; i++) d1 += c.charAt(11-i)*(2+((i+1) % 8));
			d1 = 11 - (d1 % 11);
			if (d1 > 9) d1 = 0;
			if (dv.charAt(1) != d1) invalid = true;
		}
		if(invalid) return false;
		else return 'CNPJ';
	},


	checkCPFCNPJ: function(cpfcnpj) {
		if(cpfcnpj.length < 13) {
			return R4.checkCPF(cpfcnpj);
		} else {
			return R4.checkCNPJ(cpfcnpj);
		}
	},


	completeDate: function(str) {
		let today = new Date();
		let ret   = '';
		let day, mon, yea;

		str = str.replaceAll('_', '');

		if(str.indexOf('/') > -1) {
			while(str.indexOf('/') > -1) {
				str = str.replace('/', '');
			}

			ret = this.completeDate(str);

		} else {

			str = str.substr(0, 8);

			if((str.length == 1) || (str.length == 2)) {

				if(str.length == 1) {
					str = '0' + str;
					if(str === '00') str = today.getDate();
				}

				mon = (today.getMonth()+1);
				if(mon < 10) mon = '0' + mon;
				ret =  str + '/' + mon + '/' + today.getFullYear();

			} else if((str.length == 3)) {

				day = str.substr(0, 2);
				mon = '0' + str.substr(2, 1);

				if(mon === '00') mon = today.getMonth()+1;
				ret =  day + '/' + mon + '/' + today.getFullYear();

			} else if((str.length == 4) || (str.length == 5)) {

				day = str.substr(0, 2);
				mon = str.substr(2, 2);
				ret =  day + '/' + mon + '/' + today.getFullYear();

			} else if((str.length >= 6)) {

				day = str.substr(0, 2);
				mon = str.substr(2, 2);
				yea = str.substr(4, str.length);
				if(yea.length == 2)      yea = '20' + yea;
				else if(yea.length == 3) yea = '2' + yea;
				else if(yea.length > 4)  yea = today.getFullYear();

				ret =  day + '/' + mon + '/' + yea;
			}
		}
		return ret;
	},


	completeTime: function(str) {
		var now  = new Date();
		var ret  = '';
		var hour = (now.getHours()  <10 ? '0' : '') + now.getHours();
		var min  = (now.getMinutes()<10 ? '0' : '') + now.getMinutes();
		var sec  = (now.getSeconds()<10 ? '0' : '') + now.getSeconds();

		while(str.indexOf('_') > -1) {
			str = str.replace('_', '');
		}

		while(str.indexOf(':') > -1) {
			str = str.replace(':', '');
		}

		if(str.length == 0) {
			ret = hour + ':' + min + ':' + sec;
		}
		else if(str.length == 1 || str.length == 2) {
			if(str.length == 1) {
				str = (parseInt(str) < 3) ? str + '0' : '0' + str;
			}
			ret =  str + ':' + min + ':' + sec;
		}
		else if(str.length == 3 || str.length == 4) {
			hour = str.substr(0, 2);
			if(str.length == 3) {
				str = str.substr(2, 1);
				str = (parseInt(str) < 6) ? str + '0' : '0' + str;
			}
			ret =  hour + ':' + str + ':' + sec;
		}
		else {
			hour = str.substr(0, 2);
			min  = str.substr(2, 2);
			if(str.length == 5) {
				str = str.substr(4, 1);
				str = (parseInt(str) < 6) ? str + '0' : '0' + str;
			}
			else {
				str = str.substr(4, 2);
			}
			ret =  hour + ':' + min + ':' + str;
		}
		return ret;
	},


	completeDateTime: function(str) {
		var dateTime, date, time, ret;

		if(R4.trim(str) == '') {
			ret = '';
		}
		else {
			dateTime = str.split(' ');
			date     = this.completeDate(dateTime[0]);
			time     = this.completeTime(dateTime[1]);
			ret      = date + ' ' + time;
		}
		return ret;
	},


	changeDate: function(dtStr, year, month, day) {

		let dt = new Date(dtStr +' 00:00:00');

		if(year)  dt.setFullYear( dt.getFullYear() + year );
		if(month) dt.setMonth( dt.getMonth() + month );
		if(day)   dt.setDate( dt.getDate() + day );

		return dt.toISOString().substr(0, 10);
	},


	currentDate: function() {
		let tz = (new Date()).getTimezoneOffset() * 60000;

		return (new Date(Date.now() - tz)).toISOString().substring(0, 10);
	},


	currentDateTime: function() {
		let tz = (new Date()).getTimezoneOffset() * 60000;

		return (new Date(Date.now() - tz)).toISOString().substring(0, 19).replace('T', ' ');
	},


	dateMask: function(date) {
		if(!date) return '';

		if(date == '0000-00-00' || date == '0000-00-00 00:00:00') return '';

		if(typeof date != 'string') {
			console.warn('R4.dateMask() expects date to be string, '+ typeof date +' given:', date);
			return date;
		}

		let dthr = date.trim().split(' ');
		let dt   = dthr[0].split('-');

		return dt[2] +'/'+ dt[1] +'/'+ dt[0] + ((dthr[1]) ? ' '+ dthr[1] : '');
	},


	dateUnmask: function(dt, ifempty) {
		if(!dt) return ifempty || '';

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


	moneyMask: function(number, mindec, maxdec) {
		if(mindec === undefined) mindec = 2;

		return R4.moneySymbol +' '+ R4.numberMask(number, mindec, maxdec);
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

		let allowedchars = 'abcdefghijklmnopqrstuvwxyz.0123456789-_@';

		let ret = '';
		for(var i = 0; i < v.length; i++)
			if(allowedchars.indexOf(v[i].toLowerCase()) > -1)
				ret += v[i];

		return ret;
	},


	onlyNumbers: function(v) {
		if(typeof v == 'undefined') return '';
		return v.toString().replace(/\D/g, '');
	},


	integerMask: function(v) {
		if(typeof v == 'undefined') return '';
		return v.toString().replace(/([^0-9-])/g, '');
	},


	cepMask: function(v) {
		if(typeof v == 'undefined') return '';
		return v.toString()
			.replace(/\D/g, '')
			.replace(/^(\d{5})(\d)/, '$1-$2');
	},


	phoneMask: function(v) {
		if(typeof v == 'undefined') return '';
		v = v.toString();

		if(R4.onlyNumbers(v).length <= 10) {
			return v
				.replace(/\D/g, '')
				.replace(/^(\d\d)(\d)/g, '($1) $2')
				.replace(/(\d{4})(\d)/, '$1-$2');
		}
		else {
			return v
			.replace(/\D/g, '')
			.replace(/^(\d\d)(\d)/g, '($1) $2')
			.replace(/(\d)(\d{4})(\d)/, '$1 $2-$3');
		}
	},


	cpfcnpjMask: function(v) {
		if(typeof v == 'undefined') return '';
		v = v.toString().replace(/\D/g, '');
		if(v.length < 12) return R4.cpfMask(v);
		else return R4.cnpjMask(v);
	},


	cpfMask: function(v){
		if(typeof v == 'undefined') return '';
		return v.toString()
			.replace(/\D/g, '')
			.replace(/(\d{3})(\d)/, '$1.$2')
			.replace(/(\d{3})(\d)/, '$1.$2')
			.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
	},


	cnpjMask: function(v){
		if(typeof v == 'undefined') return '';
		return v.toString()
			.replace(/\D/g, '')
			.replace(/(\d{2})(\d)/, '$1.$2')
			.replace(/(\d{3})(\d)/, '$1.$2')
			.replace(/(\d{3})(\d)/, '$1/$2')
			.replace(/(\d{4})(\d)/, '$1-$2');
	},


	decimalInputMask: function(v) {
		if(typeof v == 'undefined') return '';
		return v.toString().replace(/([^0-9-.,=+*\/\(\)])/g, '');
	},


	arrayVal: function(arr, key) {
		if(!arr.length) return undefined;

		let ret = null;

		arr.forEach(item => {
			if(item.key == key) ret = item.value;
		});

		return ret;
	},


	sendBlob: function(url, params) {
		//Use: $('#arquivo').files[0];
		return new Promise(function(resolve, reject) {
			let fd = new FormData();
			for(let k in params) fd.append(k, params[k]);

			let xhr = new XMLHttpRequest();
			xhr.open('POST', url, true);
			xhr.onreadystatechange = function() {
				if(xhr.readyState === 4) {
					if(xhr.status === 200) {
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
						Warning.show('Conexão com internet?');
						reject(xhr.status);
					}
				}
			};
			xhr.send(fd);
		});
	},


	getJSON: function(url, params, opts) {
		if(!opts)   opts   = {};
		if(!params) params = {};

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
				if(xhr.readyState === 4) {
					if(xhr.status === 200) {
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
						Warning.show('Conexão com internet?');
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
		return new Promise(resolve => {
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


	getTemplate: function(elem) {
		return elem.content.cloneNode(true);
	},


	setRemoteHTML: function(destiny, source, callback) {
		return new Promise(resolve => {

			R4.getHTML(source)

			.then(html => {
				destiny.innerHTML = html;
				if(typeof callback == 'function') callback();
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


	enableShiftCheck: function(idDestiny) {
		let shiftCheckFirstSel;
		let destiny = document.getElementById(idDestiny);
		let completeList = destiny.querySelectorAll('input[type=checkbox]');
		completeList.forEach(function(elem){
			elem.addEventListener('click', function(ev) {
				completeList.forEach(function(item, posSel) {
					if(item == ev.target) {
						if(ev.shiftKey) {
							if(shiftCheckFirstSel == posSel) return;
							let iniElem = shiftCheckFirstSel;
							let endElem = posSel;
							if(posSel <= shiftCheckFirstSel) {
								iniElem = posSel;
								endElem = shiftCheckFirstSel+1;
							}
							for(let ii=iniElem; ii<endElem; ii++) {
								let loopItem = completeList[ii];
								if(loopItem.visible()) {
									completeList[ii].checked = ev.target.checked;
									completeList[ii].dispatchEvent(new Event('change'));
								}
							}
						}
						shiftCheckFirstSel = posSel;
					}
				});
			});
		});
	},


	render: (templateElem, payload, outputFormat) => {

		if(!outputFormat) outputFormat = 'elem'; //elem|html

		let elem = templateElem.content.cloneNode(true);

		if(!payload) return elem;

		if(elem.querySelector('[loop]')) {
			for(let key in payload) {
				if((typeof payload[key] == 'object') && (payload[key].length)) {
					let loopElem = elem.querySelector('[loop]');
					let loopResult = R4.renderLoop(loopElem, payload[key]);
					loopElem.parentNode.innerHTML = loopResult;
					//loopElem.remove();
					delete payload[key];
				}
			}
		}

		let strCont = '';

		let arrContent = elem.childNodes;
		let numRetElems = 0;
		if(arrContent.length > 1) {
			arrContent.forEach(item => {
				if(item.nodeName != '#text') {
					numRetElems++;
					strCont += item.outerHTML.trim();
				}
			});
		} else {
			numRetElems = 1;
			strCont = arrContent[0].outerHTML;
		}

		for(let key in payload) {
			if(payload[key] !== null && payload[key] !== undefined) {
				if((typeof payload[key] != 'object') || (!payload[key].length)) {
					strCont = strCont.split('{{'+ key +'}}').join(payload[key]);
				}
			}
		}

		if(outputFormat == 'html') return strCont;

		let retElem = document.createElement('div');
		retElem.innerHTML = strCont;

		if(numRetElems > 1) return retElem;
		else return retElem.firstChild;
	},


	renderLoop: (loopElem, payload) => {

		loopElem.removeAttribute('loop');

		let crude = loopElem.outerHTML,
			processed = '',
			content = '';

		payload.forEach(row => {
			content = crude;

			for(var key in row) {
				content = content.split('{{'+ key +'}}').join(row[key]);
			}

			processed += content;
		});

		return processed;
	},


	newBrowserTab: url => {
		let formelem = document.createElement('form');
		formelem.setAttribute('action', url);
		formelem.setAttribute('target', '_blank');
		document.body.append(formelem);
		formelem.submit();
		formelem.remove();
	},


	iframeAjax: (url, params) => {
		let elem = document.createElement('iframe');
		elem.style.display = 'none';

		let arr = [], strParams = '';

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

		elem.src = url +'?'+ strParams;

		document.body.append(elem);
	},


	sWorker: swFilePath => {

		window.isUpdateAvailable = new Promise((resolve, reject) => {
			console.log('Worker init');

			if('serviceWorker' in navigator) {
				navigator.serviceWorker.register(swFilePath)

				.then(function(reg) {

					reg.onupdatefound = function() {

						console.log('Update found');

						newWorker = reg.installing;

						newWorker.onstatechange = function(){
							if(newWorker.state == 'installed') {
								resolve(navigator.serviceWorker.controller);
							}
						};
					};
				})

				.catch(err => {
					console.error('[SW ERROR]', err);
					reject(err);
				});
			}
		});

		window.isUpdateAvailable

		.then(isAvailable => {
			if(isAvailable) {
				if(confirm('Nova versão encontrada. Atualizar?')) {
					window.location.reload();
				}
			}
		});
	}
};
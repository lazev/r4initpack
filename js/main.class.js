document.addEventListener('DOMContentLoaded', function() {
	$().init((typeof R4Init === 'function') ? R4Init : null);
});

$.methods = {

	//PURE FUNCTIONS

	init: function() {

		$().listeners();

		if(typeof R4Init === 'function') R4Init();
	},


	listeners: function() {
		//mobile debuger
		window.onerror = function (msg, url, lineNo, columnNo, error) {
			Warning.on(msg, url +': '+ lineNo +':'+columnNo+':'+error);
		};

		document.addEventListener('keydown', function(event) {
			if (event.keyCode == 27) {
				if (typeof Dialog === 'object') {
					Dialog.closeLastOpen();
				}
			}
		});

		document.addEventListener('mousedown', function(event) {
			Pop.destroyAll();
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


	currentDate: function() {
		let now = new Date().toISOString();
		return now.substr(0, 10);
	},


	currentDateTime: function() {
		let now = new Date().toISOString();
		return now.substr(0, 19).replace('T', ' ');
	},


	getJSON: function(url, params, opts) {
		if (!opts) opts = {};
		if (!params) params = {};

		return new Promise(function(resolve, reject) {
			let method = opts.method || 'POST';

			let xhr = new XMLHttpRequest();

			let strParams;

			xhr.open(method, url, true);

			if(typeof params === 'object') {
				strParams = new FormData();
				for(var key in params) {
					if(typeof params[key] === 'object') {
						for(let key2 in params[key]) {
							strParams.append(key +'['+ key2 +']', params[key][key2]);
						}
					} else strParams.append(key, params[key]);
				}
			} else {
				strParams = params;
				xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
			}

			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4) {
					if (xhr.status === 200) {
						var resp = xhr.responseText;
						try {
							var jResp = JSON.parse(resp);

							if(jResp.error === 1) {
								Warning.on(jResp.errMsg, jResp.errObs);
								reject(jResp);
							} else {
								resolve(jResp);
							}
						} catch(err) {
							Warning.on(xhr.status);
							reject(xhr.status);
						}
					} else {
						Warning.on(xhr.status);
						reject(xhr.status);
					}
				}
			};

			xhr.send(strParams);
		});
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
						Warning.on(
							'Erro ao buscar dados',
							resp.status +' - '+ resp.statusText
						);
					}
					reject(resp.status +' - '+ resp.statusText);
				}
			})
			.catch(err => {
				if(typeof Warning === 'object') {
					Warning.on(
						'Erro de conexão',
						'Problema com a internet?'
					);
				}
				reject(err);
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


	//JQUERY FUNCTIONS
	each: function(func) {
		Array.prototype.forEach.call(this, func);
	},

	find: function(selector) {
		var seen = new Set();
		var results = [];

		this.each(el => {
			Array.prototype.forEach.call(el.querySelectorAll(selector), child => {
				if (!seen.has(child)) {
					seen.add(child);
					results.push(child);
				}
			});
		});

		return $(results);
	},

	closest: function(selector) {
		var closest = [];

		this.each(el => {
			let curEl = el;

			while (curEl.parentElement && !curEl.parentElement.matches(selector)) {
				curEl = curEl.parentElement;
			}
			if (curEl.parentElement) {
				closest.push(curEl.parentElement);
			}
		});

		return $(closest);
	},

	toggleClass: function(className) {
		this.each(el => {
			el.classList.toggle(className);
		});
	},

	addClass: function(className) {
		this.each(el => {
			el.classList.add(className);
		});
	},

	removeClass: function(className) {
		this.each(el => {
			el.classList.remove(className);
		});
	},

	text: function(t) {
		if (arguments.length === 0) {
			return this[0].innerText;
		} else {
			this.each(el => (el.innerText = t));
		}
	},

	val: function(val) {
		//Get
		if(arguments.length === 0) {
			return Fields.getVal(this[0]);
		}

		//Set
		else {
			this.each(el => {
				return Fields.setVal(el, val);
			});
		}
	},

	typeEffect: function(txt) {
		this.each(el => {
			let newTxt = '';
			var typeEffectInterval = setInterval(() => {
				if(newTxt.length < txt.length) {
					newTxt = txt.substr(0, (newTxt.length+1));
					el.innerHTML = newTxt + '_';
				} else {
					clearInterval(typeEffectInterval);
					el.innerHTML = txt;
				}
			}, 15);

		});
	},

	reset: function() {
		this.each(el => {
			Fields.reset(el);
		});
	},

	html: function(t) {
		if (arguments.length === 0) {
			return this[0].innerHTML;
		} else {
			this.each(el => (el.innerHTML = t));
		}
	},

	setRemoteHTML: function(source) {
		return new Promise((resolve, reject) => {

			$().getHTML(source)

			.then(html => {
				this[0].innerHTML = html;
				resolve();
			});
		});
	},

	dateMask: function(dt) {
		if(!dt) return '';

		return dt.substr(8, 2) +'/'
		     + dt.substr(5, 2) +'/'
		     + dt.substr(0, 4);
	},

	attr: function(name, value) {
		if (typeof value === 'undefined') {
			return this[0].getAttribute(name);
		} else {
			this.each(el => el.setAttribute(name, value));
		}
	},

	removeAttr: function(name) {
		this.each(el => el.removeAttribute(name));
	},

	css: function(style, value) {
		if (typeof style === 'string') {
			if (typeof value === 'undefined') {
				return getComputedStyle(this[0])[style];
			} else {
				this.each(el => (el.style[style] = value));
			}
		} else {
			this.each(el => Object.assign(el.style, style));
		}
	},

	on: function(event, cb) {
		this.each(el => {
			el.addEventListener(event, cb);
		});
	},

	off: function(event, cb) {
		this.each(el => {
			el.removeEventListener(event, cb);
		});
	},

	click: function(cb) {
		this.each(el => {
			if(arguments.length === 0) {
				let event = new Event('click');
				el.dispatchEvent(event);
			} else {
				el.addEventListener('click', cb);
			}
		});
	},

	submit: function(cb) {
		this.each(el => {
			if(arguments.length === 0) {
				let event = new Event('submit');
				el.dispatchEvent(event);
			} else {
				el.addEventListener('submit', cb);
			}
		});
	},

	trigger: function(ev) {
		let event = new Event(ev);
		this.each(el => {
			el.dispatchEvent(event);
		});
	},

	append: function(content) {
		if (typeof content === 'string') {
			this.each(el => (el.insertAdjacentHTML('beforeend', content)));
		} else if (content instanceof Element) {
			this.each(el => el.appendChild(content.cloneNode(true)));
		} else if (content instanceof Array) {
			content.forEach(each => this.append(each));
		}
	},

	prepend: function(content) {
		if (typeof content === 'string') {
			this.each(el => (el.insertAdjacentHTML('afterbegin', content)));
		} else if (content instanceof Element) {
			this.each(el => el.parentNode.insertBefore(content.cloneNode(true), el));
		} else if (content instanceof Array) {
			content.forEach(each => this.prepend(each));
		}
	},

	clone: function() {
		return $(Array.prototype.map.call(this, el => el.cloneNode(true)));
	},

	focus: function() {
		this.each(el => {
			el.focus();
			return;
		});
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
	},

	//EFFECTS FUNCTION
	slideUp: function(callback) {
		this.each(el => {
			Effects.slideUp(el, callback);
		});
	},


	slideDown: function(callback) {
		this.each(el => {
			Effects.slideDown(el, callback);
		});
	},


	fadeIn: function(callback, duration, display) {
		this.each(el => {
			Effects.fadeIn(el, callback, duration, display);
		});
	},


	fadeOut: function (callback, duration) {
		this.each(el => {
			Effects.fadeOut(el, callback, duration);
		});
	},


	highlight: function () {
		this.each(el => {
			Effects.highlight(el);
		});
	},


	//R4 FUNCTIONS
	dialog: async function(opts) {

		if(opts === 'close') {

			Dialog.close(this[0].getAttribute('id'));

		} else {

			let open = false;

			if(opts === 'open') {
				open = true;
			}
			else if(typeof opts != 'object') {
				opts = {};
			}

			this.each(el => {
				opts.elem = el;

				let title = el.getAttribute('title');

				if((title) && (!opts.title)) opts.title = title;

				if(open) {
					Dialog.open(el.id);
				} else {
					Dialog.create(opts);
				}
			});
		}
	},

	pop: function(opts) {
		this.each(el => {
			el.addEventListener('click', function(event){
				if(opts.preventDefault) event.preventDefault();
				opts.destiny = el;
				Pop.create(opts);
			});
		});
	},

	hint: function(txt) {
		Pop.hint(this, txt);
	},


	//OTHERS
	round: function(num, dec) {
		if(!num) return 0;
		if(!dec) dec = 0;
		num = Number(num).toFixed(10);
		return parseFloat(Number(Math.round(num+'e'+dec)+'e-'+dec));
	},

	toUSNumber: function(num) {
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

	numberMask: function(num, mindec, maxdec) {
		if(!mindec) mindec = 0;
		if(!maxdec) maxdec = mindec;

		var sep    = '.';
		var dec    = ',';

		var number = $().round(num, maxdec)+'';
		var s      = number.split('.');

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
	}
};


//https://www.caktusgroup.com/blog/2017/02/08/how-make-jquery/

function $0(arg) {
	return document.querySelector(arg);
}

function $(arg) {
	let results;

	if (typeof arg === 'undefined') {
		results = [];
	} else if (arg instanceof Element) {
		results = [arg];
	} else if (typeof arg === 'string') {
		// If the argument looks like HTML, parse it into a DOM fragment
		if (arg.startsWith('<')) {
			let fragment = document.createRange().createContextualFragment(arg);
			results = [fragment];
		} else {
			// Convert the NodeList from querySelectorAll into a proper Array
			results = Array.prototype.slice.call(document.querySelectorAll(arg));
		}
	} else {
		// Assume an array-like argument and convert to an actual array
		results = Array.prototype.slice.call(arg);
	}

	results.__proto__ = $.methods;

	return results;
}
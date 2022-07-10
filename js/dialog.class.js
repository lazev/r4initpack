var Dialog = {

	onOpenFuncs: {},
	beforeCloseFuncs: {},
	onCloseFuncs: {},

	create: function(opts) {
		return new Promise((resolve, reject) => {

			if(!opts) opts = {};

			let elem          = opts.elem;
			    id            = opts.id            || '',
			    title         = opts.title         || '',
			    html          = opts.html          || '',
			    style         = opts.style         || {},
			    open          = opts.open          || false,
			    ephemeral     = opts.ephemeral     || false,
			    changeMonitor = opts.changeMonitor || false,
			    buttons       = opts.buttons       || [],
			    classes       = [];

			let onOpen    = opts.onOpen      || function(){},
			    onCreate  = opts.onCreate    || function(){},
			    onClose   = opts.onClose     || function(){},
			    befClose  = opts.beforeClose || function(){};

			let over = document.createElement('div'),
			    modl = document.createElement('div'),
			    head = document.createElement('header'),
			    body = document.createElement('section'),
			    foot = document.createElement('footer');

			let cont,
			    idElem;

			if(elem) {
				cont = elem;
				idElem = cont.id;
			} else {
				cont = document.createElement('div');
				cont.innerHTML = html;
				idElem = opts.id || Math.random().toString().substr(-9);
				cont.id = idElem;
			}

			if(document.getElementById('R4Overlay-'+ idElem)) {
				resolve(idElem);
				return;
			}

			classes.push((opts.classes) || ['default']);
			classes.push('R4Dialog');

			modl.setAttribute('class', classes.join(' '));

			over.classList.add('hidden');
			over.classList.add('R4Overlay');

			modl.append(head);
			modl.append(body);
			modl.append(foot);
			body.append(cont);
			over.append(modl);

			cont.classList.remove('hidden');

			modl.id = 'R4Dialog-' + idElem;
			over.id = 'R4Overlay-'+ idElem;

			if(ephemeral) over.setAttribute('ephemeral', 'true');

			let closer = document.createElement('div');
			closer.innerHTML = '<img src="data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAQAAAAngNWGAAAAWklEQVR4Ac3RAQbAMAxG4Qd6pUJAy+xWu9qOsxlgQgq2AxT5AX0B+IgIa7XREWoED4UkI3AsZ06orJFUcYbCXj5uzmkOGSar02NUGgSm/sWpGh1cFIR2Oiv1A9VmLUcOOFMwAAAAAElFTkSuQmCC" alt="Back arrow">';
			closer.style.float = 'left';
			closer.setAttribute('target', idElem);
			closer.classList.add('R4DialogCloser');
			closer.addEventListener('click', function(event) {
				Dialog.close(this.getAttribute('target'));
			});

			head.appendChild(closer);

			if(title) {
				let hTitle = document.createElement('span');
				hTitle.classList.add('R4DialogTitle');
				hTitle.innerHTML = title;
				head.appendChild(hTitle);
			}

			over.addEventListener('mousedown', function(event) {
				if(event.target !== this) return;
				Dialog.closeOverlay(this.id);
			});

			if(buttons.length) {
				let btn, item, strClasses;

				for(let k=buttons.length-1; k>=0; k--) {
					item = buttons[k];

					btn = document.createElement('button');

					classes = [];
					classes.push((item.classes) || ['default']);
					classes.push('R4');
					classes.push('onRight');

					strClasses = classes.join(' ');

					if(strClasses.indexOf('R4DialogCloser') > -1) {
						btn.setAttribute('target', idElem);
						btn.addEventListener('click', function(event) {
							Dialog.close(this.getAttribute('target'));
						});
					}

					if(strClasses.indexOf('R4DialogSaver') > -1) {
						modl.addEventListener('keydown', function(ev) {
							if(ev.keyCode == 13 && ev.ctrlKey) {
								if(!btn.disabled && btn.offsetParent !== null) {
									btn.trigger('click');
								}
							}
						});
					}

					btn.setAttribute('class', strClasses);
					btn.innerHTML = item.label;

					if(item.id) btn.setAttribute('id', item.id);

					if(item.disabled) btn.disabled = true;

					if(typeof item.onClick === 'function') {
						btn.addEventListener('click', item.onClick);
					}
					foot.appendChild(btn);
				}
			}

			document.body.appendChild(over);

			if(typeof onCreate === 'function') {
				onCreate();
			}

			if(typeof onOpen === 'function') {
				Dialog.onOpenFuncs[idElem] = onOpen;
			}

			if(typeof onClose === 'function') {
				Dialog.onCloseFuncs[idElem] = onClose;
			}

			if(typeof befClose === 'function') {
				Dialog.beforeCloseFuncs[idElem] = befClose;
			}

			if(open) {
				Dialog.open(idElem);
			}

			for(let k in style) modl.style[k] = style[k];

			if(changeMonitor) {
				elem.setAttribute('changeMonitor', 'pendent');
			}

			resolve(idElem);
		});
	},


	open: async function(idElemOrOpts, opts) {
		let idElem;

		if(typeof idElemOrOpts === 'object') { //idElemOrOpts instanceof HTMLElement;
			idElem = await Dialog.create(idElemOrOpts);
		} else {
			idElem = idElemOrOpts;
		}

		let over = document.getElementById('R4Overlay-'+ idElem);
		document.body.append(over);

		over.classList.remove('hidden');

		document.body.classList.add('noscroll');

		if(typeof Dialog.onOpenFuncs[idElem] === 'function') {
			Dialog.onOpenFuncs[idElem]();
		}

		let elem = document.getElementById(idElem);

		if(elem.getAttribute('changeMonitor')) {
			setTimeout(() => Dialog.setChangeMonitor(elem), 500);
		}

		return idElem;

		/*
		let modl = document.getElementById('R4Dialog-'+ idElem);
		if(modl.offsetHeight+100 < window.innerHeight) {
			modl.style.marginTop = '50px';
		}
		*/
	},


	setChangeMonitor: elem => {

		let check = elem.getAttribute('changeMonitor');

		if(check == 'pendent') {
			elem.setAttribute('changeMonitor', 1);
			elem.querySelectorAll('input, select, textarea').forEach(item => {
				item.addEventListener('change', function(ev){
					elem.classList.add('contentChanged');
				});
			});
		}

		elem.classList.remove('contentChanged');
	},


	title: function(elem, title) {
		let id = elem.id;

		let el = document.getElementById('R4Dialog-'+ id);

		el.querySelector('.R4DialogTitle').innerHTML = title;
	},


	appendOnFooter: function(elem, html) {
		let id = elem.id;

		let el = document.getElementById('R4Dialog-'+ id);

		el.querySelector('footer').append(html);
	},


	close: function(idElem) {
		if(typeof idElem === 'object') {
			Dialog.closeOverlay('R4Overlay-'+ idElem.id);
		} else {
			Dialog.closeOverlay('R4Overlay-'+ idElem);
		}
	},


	closeAnyway: function(idElem) {
		if(typeof idElem === 'object') {
			idElem.classList.remove('contentChanged');
		} else {
			document.getElementById(idElem).classList.remove('contentChanged');
		}

		Dialog.close(idElem);
	},


	closeOverlay: function(idOver) {
		let over = document.getElementById(idOver);
		let idElem = idOver.replace('R4Overlay-', '');
		let retBefClose = true;

		if(typeof Dialog.beforeCloseFuncs[idElem] === 'function') {
			retBefClose = Dialog.beforeCloseFuncs[idElem]();
		}

		if(retBefClose === false) return;

		if(over.getAttribute('ephemeral') == 'true') {
			over.remove();
		} else {
			over.classList.add('hidden');
			let elem = document.getElementById(idElem);
			if(elem.getAttribute('changeMonitor') == 1 && elem.classList.contains('contentChanged')) {
				let btn = document.createElement('button');
				btn.setAttribute('class', 'R4');
				btn.innerHTML = 'Recuperar';
				btn.addEventListener('click', () => over.classList.remove('hidden'));
				setTimeout(() => {
					Warning.show('Fechou sem salvar as alterações', btn)
				}, 200);
			}
		}

		if(Dialog.getIdOpenOverlays().length === 0) {
			document.body.classList.remove('noscroll');
		}

		if(typeof Dialog.onCloseFuncs[idElem] === 'function') {
			Dialog.onCloseFuncs[idElem]();
		}
	},


	getIdOpenOverlays: function() {
		var ret = [];
		var arr = document.querySelectorAll('.R4Overlay');
		for (let i = 0; i < arr.length; i++) {
			if(!arr[i].classList.contains('hidden')) ret.push(arr[i].id);
		}
		return ret;
	},


	closeLastOpen: function() {
		let arr = Dialog.getIdOpenOverlays();
		if(arr.length > 0) Dialog.closeOverlay(arr.pop());
	}
};
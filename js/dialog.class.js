var Dialog = {

	onOpenFuncs: {},
	beforeCloseFuncs: {},
	onCloseFuncs: {},

	create: function(opts) {
		return new Promise((resolve, reject) => {

			if(!opts) opts = {};

			let elem         = opts.elem;
			    id           = opts.id           || '',
			    title        = opts.title        || '',
			    html         = opts.html         || '',
			    style        = opts.style        || {},
			    open         = opts.open         || false,
			    ephemeral    = opts.ephemeral    || false,
			    closeMonitor = opts.closeMonitor || false,
			    buttons      = opts.buttons      || [],
			    classes      = [];

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
				idElem = id || Math.random().toString().substr(-9);
				cont.id = idElem;
			}

			if($('#R4Overlay-'+ idElem)) {
				resolve(idElem);
				return;
			}

			classes.push((opts.classes) || ['default']);
			classes.push('R4Dialog');

			modl.setAttribute('class', classes.join(' '));

			over.classList.add('hidden');
			over.classList.add('R4Overlay');

			modl.appendChild(head);
			modl.appendChild(body);
			modl.appendChild(foot);
			body.appendChild(cont);
			over.appendChild(modl);

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

					btn.setAttribute('class', strClasses);
					btn.innerHTML = item.label;

					if(item.id) btn.setAttribute('id', item.id);

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

			for(let k in style) modl.style[k] = style[k];

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

			resolve(idElem);
		});
	},


	open: async function(idElemOrOpts, opts) {
		let idElem;

		if(typeof idElemOrOpts === 'object') {
			idElem = await Dialog.create(idElemOrOpts, opts);
		} else {
			idElem = idElemOrOpts;
		}

		let over = document.getElementById('R4Overlay-'+ idElem);
		document.body.appendChild(over);

		over.classList.remove('hidden');

		document.getElementsByTagName('body')[0].classList.add('dialogOpen');

		if(typeof Dialog.onOpenFuncs[idElem] === 'function') {
			Dialog.onOpenFuncs[idElem]();
		}

		/*
		let modl = document.getElementById('R4Dialog-'+ idElem);
		if(modl.offsetHeight+100 < window.innerHeight) {
			modl.style.marginTop = '50px';
		}
		*/
	},


	close: function(idElem) {
		if(typeof idElem === 'object') {
			Dialog.closeOverlay('R4Overlay-'+ idElem.id);
		} else {
			Dialog.closeOverlay('R4Overlay-'+ idElem);
		}
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
		}

		if(Dialog.getIdOpenOverlays().length === 0) {
			document.getElementsByTagName('body')[0].classList.remove('dialogOpen');
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
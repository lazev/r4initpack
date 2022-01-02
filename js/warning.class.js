var Warning = {

	show: function(msg, obs, opts) {
		if(!opts) opts = {};

		let fixed = opts.fixed || false;
		let id    = opts.id    || R4.uniqid();

		let container = document.getElementById('R4WarningContainer');

		if(container == null) {
			container = document.createElement('div');
			container.setAttribute('id', 'R4WarningContainer');
			document.body.prepend(container);
		}

		let elem = document.createElement('div');
		elem.classList.add('R4Warning');
		elem.setAttribute('id', id);

		if(fixed) {
			let closer = document.createElement('div');
			closer.classList.add('R4WarningCloser');
			closer.innerHTML = '&#x2716;';
			closer.style.float = 'right';
			closer.addEventListener('click', function(event) {
				Warning.hide(elem);
			});
			elem.appendChild(closer);
		} else {
			elem.addEventListener('click', function(event) {
				Warning.hide(this);
			});
		}

		let msgElem = document.createElement('div');
		msgElem.classList.add('R4WarningMsg');
		msgElem.append(msg);
		elem.append(msgElem);

		if(obs) {
			let obsElem = document.createElement('div');
			obsElem.classList.add('R4WarningObs');
			obsElem.append(obs);
			elem.append(obsElem);
		}

		container.append(elem);

		return id;
	},


	hide: function(elem) {
		elem.remove();
	}

};
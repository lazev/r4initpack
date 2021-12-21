var Tabs = {

	dom: {},

	create: opts => {

		if(!opts) opts = {};

		let elem         = opts.elem         ?? null;
		let idElem       = opts.idElem       ?? '';
		let itemSelector = opts.itemSelector ?? 'button';
		let targetOn     = opts.targetOn     ?? '';
		let onClick      = opts.click        ?? function(){};

		if(!elem && idElem) {
			elem = document.getElementById(idElem);
		}

		if(!elem) {
			console.warn('To use Tabs you need to set the elem or idElem');
			return false;
		}

		let classes = ['R4Tabs'];
		if(opts.classes) classes.push(opts.classes);

		elem.setAttribute('class', classes.join(' '));

		elem.querySelectorAll(itemSelector).forEach(item => {

			let targetId = item.getAttribute('target');
			document.getElementById(targetId).classList.add('hidden');

			item.classList.add('R4TabItem');

			item.addEventListener('click', event => {
				event.preventDefault();

				let targetOn = document.querySelectorAll('.R4TabTargetOn');
				if(targetOn.length) targetOn.forEach(trgt => {
					trgt.classList.remove('R4TabTargetOn');
					trgt.classList.add('hidden');
				});

				let newTarget;
				let newTargetId = item.getAttribute('target');
				let itemColor = item.getAttribute('color');

				item.style.backgroundColor = itemColor;
				elem.style.borderColor = itemColor;

				if(newTargetId) {
					if(typeof onClick === 'function') onClick(newTargetId);
					newTarget = document.getElementById(newTargetId);
				}

				if(newTarget) {
					newTarget.classList.remove('hidden');
					newTarget.classList.add('R4TabTargetOn');
				}

				let tabOn = elem.querySelectorAll('.R4TabOn');
				if(tabOn.length) tabOn.forEach(tbon => {
					tbon.classList.remove('R4TabOn');
					tbon.style.backgroundColor = '';
				});

				item.classList.add('R4TabOn');

			});
		});


		if(targetOn) Tabs.click(targetOn);
	},


	click: targetId => {

		document.querySelector('[target='+ targetId +']').click();

	}

};
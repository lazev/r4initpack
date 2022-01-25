var FieldsDtPicker = {

	create: elem => {

		let today        = new Date();
		let currentYear  = today.getFullYear();

		let box = document.createElement('div');
		let tbl = document.createElement('table');

		let cell;

		let months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

		let elMonth = document.createElement('select');
		elMonth.addEventListener('change', function(ev){
			FieldsDtPicker.createCalendar(
				tbl,
				elem,
				elMonth.value,
				elYear.value
			);
		});

		months.forEach((item, key) => {
			cell = document.createElement('option');
			cell.setAttribute('value', key);
			cell.innerHTML = item;
			elMonth.append(cell);
		});

		let elYear = document.createElement('select');
		elYear.addEventListener('change', function(ev){
			FieldsDtPicker.createCalendar(
				tbl,
				elem,
				elMonth.value,
				elYear.value
			);
		});

		for(var ii=currentYear-100; ii<currentYear+100; ii++) {
			cell = document.createElement('option');
			cell.setAttribute('value', ii);
			cell.innerHTML = ii;
			elYear.append(cell);
		};

		box.append(elMonth);
		box.append(elYear);

		FieldsDtPicker.createCalendar(
			tbl,
			elem,
			elMonth.value,
			elYear.value
		);

		box.append(tbl);

		return box;
	},


	createCalendar: function(elem, destiny, month, year) {

		let cell;
		let tbl = document.createElement('table');
		let firstDay = new Date(year, month).getDay();
		let today    = new Date();
		let weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

		//Creating week labels
		let row = document.createElement('tr');
		weekDays.forEach(item => {
			cell = document.createElement('td');
			cell.innerHTML = item;
			row.append(cell);
			tbl.append(row);
		});

		let date = 1;

		for (let i = 0; i < 6; i++) {

			let row = document.createElement('tr');

			for(let j = 0; j < 7; j++) {
				if(i === 0 && j < firstDay) {
					cell = document.createElement('td');
					cell.innerHTML = '';
					row.append(cell);
				}

				else if (date > FieldsDtPicker.daysInMonth(month, year)) {
					break;
				}

				else {
					cell = document.createElement('td');
					cell.innerHTML = date;
					cell.setAttribute('value', year +'-'+ (month+1) +'-'+ date);
					cell.addEventListener('click', function(ev) {
						console.log(this.getAttribute('value'));
						destiny.val(this.getAttribute('value'));
					});
					//If today
					if (
						date === today.getDate()
						&& year === today.getFullYear()
						&& month === today.getMonth()
					) {
						cell.classList.add('bgInfo');
					}
					row.append(cell);
					date++;
				}
			}

			tbl.append(row); // appending each row into calendar body.
		}

		elem.innerHTML = '';

		elem.append(tbl);
	},


	daysInMonth: function(iMonth, iYear) {
		 return 32 - new Date(iYear, iMonth, 32).getDate();
	}
};
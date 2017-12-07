Vue.component('cell', {
  template: '#conn-cell',
  name: 'row-value',
  props: ['value']
});

Assoc = {
	"pay": "/card-payment",
	"reqpayment": "/request-payment",
	"true": "red",
	"false": "white"
};

var getXsrfToken = function() {
    var cookies = document.cookie.split(';');
	var token = '';
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].split('=');
		console.log(cookie);
        if(cookie[0] == ' ') {
            token = cookie[1];
        }
    }
    return token;
}

Vue.http.headers.common['X-XSRFToken'] = getXsrfToken();

var vm = new Vue ({
	el: "#app",
	data: 	{
		table: {text: 'Платежи', value: 'pay'},
		alias_1: {text: '', value: ''},
		alias_2: {text: '', value: ''},
		sort_value: {text: 'По возрастанию', value: 'asc'},
		regexp: '',
		fields: [],
		records: [
			{id: 1}
		]
	},
	methods: {
		exit_command: function (event) {
			this.$http.post('/admin', {body: '{"command": "exit"}'}).then(
				function (response) {
					window.location = '/login';
				},
				function (response) {}
			)	
		},
		req_table: function (event) {
			this.$http.get(Assoc[event.target.id]).then(
			function (response) {
				var a = document.getElementById('info_table');
				this.fields = [];
				this.records = [{id: 1}];
				var r = 0;
				var field_r = {text: 'row', alias: 'Row'};
				this.fields.push(field_r);
				var k = response.body[0]['id'];
				for(var i = 1; i < k + 1; i++)
					this.fields.push(response.body[i]);
				for(var i = k + 1; i < response.body.length; i++) {
					var elem = {};
					elem.row = r;
					for(var property in response.body[i]) {
						elem[property] = response.body[i][property];
					}
					r = r + 1;
					this.records.push(elem);
				}
				this.records = this.records.slice(1);
				this.alias_1 = {text: this.fields[1]['alias'], value: this.fields[1]['text']};
				this.alias_2 = {text: this.fields[1]['alias'], value: this.fields[1]['text']};
				this.sort_value = {text: 'По возрастанию', value: 'asc'};
				this.regexp = '';
				this.table = {text: event.target.textContent , value: event.target.id};
			},
			function (response) {});
		},
		choice: function (event, num) {
			var f = new Object();
			for(var i = 0; i < this.fields.length; i++) {
				if(this.fields[i]['alias'] == event.target.textContent) {
					f = this.fields[i];
					break;
				}
			}
			if(num == 1) this.alias_1 = {text: f['alias'], value: f['text']};
			if(num == 2) this.alias_2 = {text: f['alias'], value: f['text']};
		},
		sortC: function (event) {
			this.sort_value = {text: event.target.textContent , value: event.target.id};
		},
		req_rem: function (event) {
			this.regexp = event.target.value;
		},
		toggle: function (event) {
			if(this.table.value!="pay") return;
			var m = event.currentTarget;
			var r = event.currentTarget.getElementsByTagName("td")[0].textContent;
			var id = event.currentTarget.getElementsByTagName("td")[1].textContent;
			var el = event.currentTarget.getElementsByTagName("td")[event.currentTarget.getElementsByTagName("td").length-1];
			if(event.target != el) return;
			var safe = el.textContent;
			id = id.replace(' ', '');
			safe = safe.replace(' ', '');
			if(safe=="false") safe="true";
			else safe="false";
			json_string = '{"id_record":"' + id + '","is_safe":"' + safe + '"}';
			this.$http.patch(Assoc['pay'], {body: json_string, responseType: 'json'}).then(
				function (responce) {
					this.records[Number(r)]['is_safe'] = safe;
					m.style['background']=Assoc[safe];
				},
				function (responce) {}
			);
		},
		request: function(event) {
			this.$http.get(Assoc[this.table.value] + '{?field_s}{&sort}{&field_f}{&filter}', {params: {'field_s': this.alias_1.value, 'sort': this.sort_value.value,
															  'field_f': this.alias_2.value, 'filter': this.regexp}}
															  ).then(
			function (response) {
				this.records = [{id: 1}];
				this.fields = [];
				var r = 0;
				var field_r = {text: 'row', alias: 'Row'};
				this.fields.push(field_r);
				var k = response.body[0]['id'];
				for(var i = 1; i < k + 1; i++)
					this.fields.push(response.body[i]);
				for(var i = k + 1; i < response.body.length; i++) {
					var elem = {};
					elem.row = r;
					for(var property in response.body[i]) {
						elem[property] = response.body[i][property];
					}
					r = r + 1;
					this.records.push(elem);
				}
				this.records = this.records.slice(1);
			},
			function (response) {});
		}
	},
	created: function () {
		this.$http.get(Assoc["pay"]).then(
			function (response) {
				var r = 0;
				var field_r = {text: 'row', alias: 'Row'};
				this.fields.push(field_r);
				var k = response.body[0]['id'];
				for(var i = 1; i < k + 1; i++)
					this.fields.push(response.body[i]);
				for(var i = k + 1; i < response.body.length; i++) {
					var elem = {};
					elem.row = r;
					for(var property in response.body[i]) {
						elem[property] = response.body[i][property];
					}
					r = r + 1;
					this.records.push(elem);
				}
				this.records = this.records.slice(1);
				this.alias_1 = {text: this.fields[1]['alias'], value: this.fields[1]['text']};
				this.alias_2 = {text: this.fields[1]['alias'], value: this.fields[1]['text']};
			},
			function (response) {});
	},
	updated: function () {
			var t = document.getElementsByTagName('tbody')[0];
			var coll = t.getElementsByTagName("tr");
			for(var i = 0; i < coll.length; i++) {
				coll[i].style['background']="white";
			}
			if(this.table.value!="pay") return;
			var coll = t.getElementsByTagName("tr");
			for(var i = 0; i < coll.length; i++) {
				var elems = coll[i].getElementsByTagName("td");
				if(elems[elems.length - 1].textContent.indexOf("true") > -1) {
					coll[i].style['background']="red";
				}
				else coll[i].style['background']="white";
			}
		}
});
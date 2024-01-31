//#1 Global Declaration
let stateObj = {
	make_tx : {
		data : [] ,
		tx_owner : "" ,
		tx_no : "" ,
		tx_date : "" ,
		tx_total : "0.00"
	} , 
	load_tx : {
		data : [] ,
		tx_owner : "" ,
		tx_no : "" ,
		tx_date : "" ,
		tx_total : "0.00"
	} ,
	collect_tx : {
		data : [] ,
		tx_date : "" ,
		tx_owner : "" ,
		tx_total : "0.00"
	} ,
	archives : {
		data : [] ,
		tx_owner : "" ,
		tx_item : "" ,
		tx_datefrom : "" ,
		tx_dateto : "" 
	}
}

if (history.state) {
	stateObj.make_tx = history.state.make_tx
	stateObj.load_tx = history.state.load_tx
	stateObj.collect_tx = history.state.collect_tx
	stateObj.archives = history.state.archives
}
//#1 Global Declaration

//#2 Templates
function header( args ) {
	let ret = ""

	if ( args.route == "make_tx" || args.route == "load_tx" ) {
		ret = `
		<div id="header">
			<div id="title">Transaction No : <span id="tx_no">${stateObj[ args.route ].tx_no}</span></div>
			<div class="horizontal_container">`

		if ( args.route == "make_tx" ) {
			let date = new Date()
			ret += `
				<div>
					<label for="tx_owner">Customer Name : </label>
					<input list="customers" name="Customer" id="tx_owner"
					hx-post="/get_tx_number" hx-target="#tx_no" hx-swap="none"
					value="${stateObj[ args.route ].tx_owner}">
				</div>
				<div>
					Date : <span id="tx_date">${date.toLocaleDateString( "PH" )}</span>
				</div>`
		} else {
			ret += `
				<div>Customer Name : <span id="tx_owner">${stateObj[ args.route ].tx_owner}</span></div>
				<div>Date : <span id="tx_date">${stateObj[ args.route ].tx_date}</span></div>
			`
		}

			ret += `</div>
		</div>`
	} else if ( args.route == "collect_tx" ) {
		ret = `
		<div id="header">
          <div id="title">Counter Receipt</div>
          <div class="horizontal_container">
            <div>Customer Name : <span id="tx_owner">${stateObj[ args.route ].tx_owner}</span></div>
            <div>Date : <span id="tx_date">${stateObj[ args.route ].tx_date}</span></div>
          </div>
        </div>
		`
	} else if ( args.route == "archives" ) {
		ret = `
		<div id="header">
        <div id="title">
          <span id="tx_owner">${stateObj[ args.route ].tx_owner}</span> 
          bought ${stateObj[ args.route ].tx_item} from ${stateObj[ args.route ].tx_datefrom} to ${stateObj[ args.route ].tx_dateto}
        </div>
        <div class="horizontal_container">
          <div>Showing ${stateObj[ args.route ].data.length} results</div>
        </div>
      </div>
		`
	}

	if (args.debug) { console.log( ret ) }

	args.target.insertAdjacentHTML( "beforeend" , ret )
}

function table( args ) {
	let ret = ""
	let datalists = ""

	ret = `
		<table>
			<thead id="tx_table_header">
	`

	if ( args.route == "make_tx" || args.route == "load_tx" ) {
		ret += `
				<tr>
					<th class="hidden_print">Action</th>
					<th>Qty</th>
					<th>Unit</th>
					<th>Item</th>
					<th>Rate</th>
					<th>Price</th>
					<th>Total</th>
				</tr>
			</thead>
		`
	} else if ( args.route == "collect_tx" ) {
		ret += `
				<tr>
					<th>Transaction No</th>
					<th>Date</th>
					<th>Total</th>
				</tr>
			</thead>
		`
	} else if ( args.route == "archives" ) {
		ret += `
				<tr>
					<th>Tx No</th>
					<th>Date</th>
					<th>Qty</th>
					<th>Item</th>
					<th>Rate</th>
					<th>Base</th>
				</tr>
			</thead>
		`
	}

	if ( args.route == "make_tx" || args.route == "load_tx" ) {
		ret += `
			<tbody id="tx_table_body">
				<tr id="add_row">
					<td><button onclick=add_entry()>➕</button></td>
					<td><input type="number" onchange=change_price() value=""></td>
					<td><input type="text" onchange=add_unit() value=""></td>
					<td><input list="items" onchange=add_item() value=""></td>
					<td><input type="number" onchange=change_price() value="" disabled></td>
					<td><input list="prices" onchange=change_price() value="" disabled></td>
					<td id="add_total">0.00</td>
				</tr>`

				for( entry of stateObj[ args.route ].data ) {
					ret +=`<tr>${entry[ 0 ]}${entry[ 1 ]}${entry[ 2 ]}${entry[ 3 ]}${entry[ 4 ]}${entry[ 5 ]}${entry[ 6 ]}</tr>`
					if ( entry.hasOwnProperty( "list" ) ) { datalists += `${entry.list}` }
				}

		ret += `</tbody>
		</table>

		${datalists}
		`
	} else if ( args.route == "collect_tx" ) {
		ret += `<tbody id="tx_table_body">`

		for ( entry of stateObj[ args.route ].data ) {
			ret += `<tr>${entry[ 0] }${entry[ 1 ]}${entry[ 2 ]}</tr>`
		}

		ret += `</tbody>
		</table>
		`
	} else if ( args.route == "archives" ) {
		ret += `<tbody id="tx_table_body">`

			for ( entry of stateObj[ args.route ].data ) { 
				ret += `<tr>${entry[0]}${entry[1]}${entry[2]}${entry[3]}${entry[4]}${entry[5]}</tr>` 
			}

		ret += `</tbody>
			</table>`
	}

	if (args.debug) { console.log( ret ) }

	args.target.insertAdjacentHTML( "beforeend" , ret )
}

function footer( args ) {
	let ret = ""

	ret = `<div id="footer">`

	if ( args.route == "make_tx" || args.route == "load_tx" ) {
		ret += `<div><span id="item_cnt">${stateObj[ args.route ].data.length}</span> Items</div>`
	}

	ret += `
				<div>Received : ____________________</div>
				<div>Grand Total : <span id="tx_total">${stateObj[ args.route ].tx_total}</span></div>
			</div>
	`

	if (args.debug) { console.log( ret ) }

	args.target.insertAdjacentHTML( "beforeend" , ret )
}

function controls( args ) {
	let ret = ""

	ret = `
	<div id="controls" class="hidden_print">
	`

	if ( args.route == "make_tx" || args.route == "load_tx" ) {
		ret += `
			<button onclick=save_tx()>Save</button>
			<div>
				<div>
		 			<input type="checkbox" id="double_print">
		 			<label for="double_print">Double Print</label>
		 		</div>
				<button onclick=send_print()>Print</button>
			</div>
		`
	}

	if ( args.route == "collect_tx" ) {
		ret += `
			<div>
				<div style="display:none;">
					<input type="checkbox" id="double_print">
		 			<label for="double_print">Double Print</label>
				</div>
				<button onclick=send_print()>Print</button>
			</div>
		`
	}
	
	ret += `
		<button onclick=reset_tx()>Reset</button
	</div>
	`

	if (args.debug) { console.log( ret ) }

	args.target.insertAdjacentHTML( "beforeend" , ret )
}

function forms( args ) {
	let ret = ""

	if ( args.route == "load_tx" ) {
		ret = `
		<form id="query_form" hx-post="/fetch_tx" hx-target="#query_results" hx-swap="innerHTML">
			<div>
				<label for="input_no">Transaction Number</label>
				<input type="text" name="number" id="input_no" value="${stateObj[ args.route ].tx_no}">
			</div>
			<div>
				<label for="tx_owner">Transaction Owner</label>
				<input list="customers" name="owner" id="tx_owner" value="${stateObj[ args.route ].tx_owner}">
			</div>
			<input type="submit" value="Search Transaction">
		</form>

		<div id="query_results"></div>
		`
	} else if ( args.route == "collect_tx" ) {
		ret = `
		<form id="query_form" hx-post="/retrieve_records" hx-target="#query_results" hx-swap="innerHTML">
			<div>
				<label for="tx_owner">Customer Name</label>
				<input list="customers" name="owner" id="tx_owner" value="${stateObj[ args.route ].tx_owner}">
			</div>
			<input type="submit" value="Collect Transactions">
		</form>

		<div id="query_results"></div>
		`
	} else if ( args.route == "archives" ) {
		let date = new Date()
		ret = `
		<form id="query_form" hx-post="/retrieve_archives" hx-target="#query_results" hx-swap="innerHTML">
			<div>
				<label for="tx_owner">Customer Name</label>
				<input list="customers" name="owner" id="tx_owner" value="${stateObj[ args.route ].tx_owner}">
			</div>
			<div>
				<label for="tx_item">Item Search</label>
				<input list="items" name="item" id="tx_item" value="${stateObj[ args.route ].tx_item}">
			</div>
			<div style="width : 37%">
				<div>
					<label for="tx_datefrom">From</label>
					<input type="date" name="from_date" id="tx_datefrom" min="2023-10-28" max="${date.toLocaleDateString( "PH" )}" 
					value="${stateObj[ args.route ].tx_datefrom}" onchange="change_to_date_min()" required>
				</div>
				<div>
					<label for="tx_dateto">To</label>
					<input type="date" name="to_date" id="tx_dateto" min="2023-10-28" max="${date.toLocaleDateString( "PH" )}" 
					value="${stateObj[ args.route ].tx_dateto}" required>
				</div>
			</div>
			<input type="submit" value="Search Archives">
		</form>

		<div id="query_results"></div>
		`
	}

	if (args.debug) { console.log( ret ) }

	args.target.insertAdjacentHTML( "beforeend" , ret )
}
//#2 Templates

//#3 Handlers
function state_handler( args ) {

	let route = window.location.pathname.split( "/" )[ 1 ]
	let date = new Date()
	let supress_fetch = false
	let params = {
		method : 'POST' ,
		body : stateObj[ route ] ,
		headers : { 'content-type' : 'application/json' }
	}

	if ( args.op == "insert" ) {
		stateObj[ route ][ args.key ].push( args.val )
		document.querySelector( "#item_cnt" ).innerHTML = stateObj[ route ][ args.key ].length
	} else if ( args.op == "update" ) {

		if ( args.hasOwnProperty( "change_idxs" ) && args.hasOwnProperty( "change_vals" ) ) {
			let i = 0
			for( idx of args.change_idxs ) {
				stateObj[ route ][ args.key ][ args.key_idx ][ idx ] = args.change_vals[ i ]
				i++
			}
		} else { stateObj[ route ][ args.key ] = args.change_vals }

	} else if ( args.op == "delete" ) {

		stateObj[ route ][ args.key ].splice( args.idx , 1 )
		document.querySelector( "#item_cnt" ).innerHTML = stateObj[ route ][ args.key ].length

	} else if ( args.op == "update_ui" ) {
		let i = 0
		for( id of args.target_ids ) {

			stateObj[ route ][ id ] = args.target_vals[ i ]

			if ( document.querySelector( `#${id}` ).tagName == "INPUT" ) {				
				document.querySelector( `#${id}` ).setAttribute( "value" , args.target_vals[ i ] )
			} else {
				document.querySelector( `#${id}` ).innerHTML = args.target_vals[ i ]
			}

			i++
		}
		supress_fetch = true
	} else if ( args.op == "reset_tx" ) {
		document.title = `${window.location.host}${window.location.pathname}`

		let default_key_vals = {
			"data" : [] ,
			"tx_owner" : "" ,
			"tx_no" : "" ,
			"tx_total" : "0.00" ,
			"tx_datefrom" : "" ,
			"tx_dateto" : "" ,
			"tx_item" : ""
		}

		for ( key in default_key_vals ) {
			if ( stateObj[ route ].hasOwnProperty( key ) ) {
				stateObj[ route ][ key ] = default_key_vals[ key ]

				if ( key == "data" ) { continue }

				let input_key = `#input_${key.split( "_" )[ 1 ]}`

				if ( document.querySelector( input_key ) ) { document.querySelector( input_key ).value = "" }

				if ( document.querySelector( `#${key}` ).tagName == "INPUT" ) { 
					document.querySelector( `#${key}` ).value = stateObj[ route ][ key ] 
				} else {
					document.querySelector( `#${key}` ).innerHTML = stateObj[ route ][ key ]	
				}
			}
		}

		if ( route == "make_tx" ) {
			let tbody = document.querySelector( "#tx_table_body" )
			let add_row = document.querySelector( "#add_row" ).getElementsByTagName( "td" )
			document.querySelector( "#item_cnt" ).innerHTML = stateObj[ route ].data.length
			document.querySelector( "#double_print" ).checked = false

			for (elem of add_row) {
				let td = elem.getElementsByTagName( "input" )
				if ( td.length != 0 ) { td[ 0 ].setAttribute( "value" , "" ) }
			}

			tbody.innerHTML = document.querySelector( "#add_row" ).outerHTML

		} else if ( route == "load_tx" || route == "collect_tx" || route == "archives" ) {
			document.querySelector( "#content_container" ).innerHTML = `
			${document.querySelector( "#routes" ).outerHTML}
			${document.querySelector( "#query_form" ).outerHTML}
			<div id="query_results"></div>
			`
			htmx.process( document.querySelector( "#query_form" ) )
		}
		supress_fetch = true
	} else if ( args.op == "read" ) {

		for( key of Object.keys( stateObj[ route ] ) ) {

			if ( key == "data" ) { continue }

			if ( document.querySelector( `#${key}` ).tagName != "INPUT" ) {
				stateObj[ route ][ key ] = document.querySelector( `#${key}` ).innerHTML
			} else {
				stateObj[ route ][ key ] = document.querySelector( `#${key}` ).value
			}
		}
		supress_fetch = true
	}

	if ( args.op == "insert" || args.op == "update" || args.op == "delete" || args.op == "read" ) {
		stateObj[ route ].data = []

		let table = document.querySelector( "#tx_table_body" )
		let gt = 0

		for (var i = 0; i < table.rows.length; i++) {

			if ( table.rows[ i ].id == "add_row" ) continue

			let tds = table.rows[ i ].getElementsByTagName( "td" )
			let push_obj = {}
			for (var j = 0; j < tds.length; j++) { push_obj[ j ] = tds[ j ].outerHTML }

			if ( args.op == "read" ) {

				stateObj[ route ].data.push( push_obj )

				if ( route == "collect_tx" ) { gt += parseFloat( tds[ 2 ].innerHTML ) }

				if ( route == "load_tx" ) { gt += parseFloat( tds[ 6 ].innerHTML ) }

			} else {

				let list = tds[ 5 ].getElementsByTagName( "input" )[ 0 ].getAttribute( "list" )

				if ( list != "" ) {
					if ( document.querySelector( `datalist[ id=${list} ]` ) != null ) {
						document.querySelector( `datalist[ id=${list} ]` ).removeAttribute( "class" )
						push_obj.list = document.querySelector( `datalist[ id=${list} ]` ).outerHTML
					}
				}

				gt += parseFloat( tds[ 6 ].innerHTML )

				stateObj[ route ].data.push( push_obj )
			}
		}

		if ( stateObj[ route ].hasOwnProperty( "tx_total" ) ) {
			stateObj[ route ].tx_total = gt.toFixed( 2 )
			document.querySelector( "#tx_total" ).innerHTML = gt.toFixed( 2 )
		}

		if ( route == "make_tx" || route == "load_tx" ) {
			document.querySelector( "#item_cnt" ).innerHTML = stateObj[ route ].data.length	 
		}
	}

	if ( args.debug ) { console.log( stateObj ) }

	if (supress_fetch) {
		history.pushState( stateObj , "" )
		return
	} else {
		if ( stateObj[ route ].hasOwnProperty( "tx_no" ) ) { 
			if ( document.querySelector( "#tx_no" ).innerHTML == "" ) {
				return alert( "Transaction Number missing NOT SAVED" )
			}
		}
	}

	params.body.tx_date = document.querySelector( "#tx_date" ).innerHTML
	params.body = JSON.stringify( params.body )

	fetch( '/save_tx' , params ).then( res => {
		return ( res.status == 200 ) ? history.pushState( stateObj , "" ) : res.json().then( json => { alert( json.message ) } )
	})
}

function remove_entry() {
	let tr = event.target.parentNode.parentNode
	let tbody = tr.parentNode
	tbody.deleteRow( tr.rowIndex - 1 )
	state_handler( { op : "delete" , key : "data" , idx : tr.rowIndex } )
}

function add_entry() {
	let tr = event.target.parentNode.parentNode
	let tbody = tr.parentNode
	let children = tr.getElementsByTagName( "td" )
	let add_obj = {}
	let code = children[ 3 ].getElementsByTagName( "input" )[ 0 ].getAttribute( 'data-code' )
	let tags = [ 
		`<button onclick="remove_entry()">🗑</button>` ,
		`<input type="number" onchange=change_price() value=${children[ 1 ].getElementsByTagName( "input" )[ 0 ].value}>` ,
		`<input type="text" onchange=add_unit() value=${children[ 2 ].getElementsByTagName( "input" )[ 0 ].value}>` ,
		`<input list="items" onchange=add_item() value="${children[ 3 ].getElementsByTagName( "input" )[ 0 ].value}">` ,
		`<input type="number" onchange=change_price() value=${children[ 4 ].getElementsByTagName( "input" )[ 0 ].value}>` ,
		`<input list="${code}" onchange=change_price() value=${children[ 5 ].getElementsByTagName( "input" )[ 0 ].value}>` ,
		`${document.querySelector( "#add_total" ).innerHTML}`
	]
	let new_row = tbody.insertRow( -1 )

	for (var i = 0; i < 7; i++) {

		add_obj[ i ] = ( i == 0 ) ? `<td class="hidden_print">${tags[ i ]}</td>` : `<td>${tags[ i ]}</td>`

		if ( i == 0 ) continue
		if ( i == 4 || i == 5 ) { children[ i ].getElementsByTagName( "input" )[ 0 ].disabled = true }
		if ( i == 6 ) { children[ i ].innerHTML = "0.00" ; continue }

		children[ i ].getElementsByTagName( "input" )[ 0 ].value = ""
		children[ i ].getElementsByTagName( "input" )[ 0 ].setAttribute( "value" , "" )
	}

	add_obj.list = `<datalist id=${code}>${document.querySelector( "#prices" ).innerHTML}</datalist>`

	for ( key in add_obj ) { if ( key != "list" ) new_row.insertAdjacentHTML( "beforeend" , add_obj[ key ] ) }

	state_handler( { op : "insert" , key : "data" , val : add_obj } )
	document.querySelector( "#prices" ).innerHTML = ""
}

function change_price() {

	event.target.setAttribute( "value" , event.target.value )

	let tr = event.target.parentNode.parentNode
	let tds = tr.getElementsByTagName( "td" )
	let qty = tds[ 1 ].getElementsByTagName( "input" )[ 0 ].value
	let rate = tds[ 4 ].getElementsByTagName( "input" )[ 0 ].value
	let base = tds[ 5 ].getElementsByTagName( "input" )[ 0 ].value
	let tot = tds[ 6 ]

	if ( rate == "" ) rate = 0

	tot.innerHTML = ( isNaN( Number.parseFloat( ( ( base * ( 100 + parseFloat( rate ) ) ) / 100 ) * qty ).toFixed( 2 ) ) ) 
		? "0.00" 
		: Number.parseFloat( ( ( base * ( 100 + parseFloat( rate ) ) ) / 100 ) * qty ).toFixed( 2 )

	if ( tr.id != "add_row" ) {
		state_handler(
			{ 
				op : "update" , key : "data" , key_idx : tr.rowIndex - 2 ,
				change_idxs : [ 1 , 4 , 5 , 6 ] , 
				change_vals : [ 
					`<td>${tds[1].innerHTML}</td>` , `<td>${tds[4].innerHTML}</td>` , 
					`<td>${tds[5].innerHTML}</td>` , `<td>${tot.innerHTML}</td>` ]
			}
		)
	}
}

function change_to_date_min() { document.querySelector( "#tx_dateto" ).setAttribute( "min" , event.target.value ) }

function add_unit() {
	event.target.setAttribute( "value" , event.target.value )

	let tr = event.target.parentNode.parentNode
	let tds = tr.getElementsByTagName( "td" )

	if ( tr.id != "add_row" ) {
		state_handler(
			{ 
				op : "update" , key : "data" , key_idx : tr.rowIndex - 2 ,
				change_idxs : [ 2 ] , change_vals : [ `<td>${tds[2].innerHTML}</td>` ]
			}
		)
	}
}

function add_item() {
	let tr = event.target.parentNode.parentNode
	let tds = tr.getElementsByTagName( "td" )
	let rate = tds[ 4 ].getElementsByTagName( "input" )[ 0 ]
	let base = tds[ 5 ].getElementsByTagName( "input" )[ 0 ]
	let params = {
		method : 'POST' ,
		headers : { 
			'content-type' : 'application/json'
		}
	}
	let supress_fetch = false

	event.target.setAttribute( 'value' , event.target.value )

	if ( items.hasOwnProperty( event.target.value ) ) {
		event.target.setAttribute( 'data-code' , items[ event.target.value ].Code )
		params.body = JSON.stringify( items[ event.target.value ] )
	} else {
		event.target.setAttribute( 'data-code' , "" )
		supress_fetch = true
	}

	if ( supress_fetch ) {
		rate.disabled = false
		base.disabled = false
		return
	}

	fetch( '/price' , params ).then( res => {

		if ( res.status != 200 ) {
			rate.disabled = false
			base.disabled = false
			return
		}

		res.json().then( json => {
			let dlist_opts = ``
			for ( key in json ) {
				if ( key != "Name" && key != "Code" ) { dlist_opts += `<option value="${json[ key ]}">${key} | ${json[ key ]}</option>` }
			}

			if ( tr.id == "add_row" ) { document.querySelector( "#prices" ).innerHTML = dlist_opts }

			if ( document.querySelector( `datalist#${json.Code}` ) == null ) {
				document.querySelector( "#content_container" ).insertAdjacentHTML( "beforeend" , 
					`<datalist id="${json.Code}">${dlist_opts}</datalist>` )
			}

			rate.disabled = false
			base.disabled = false

			if ( tr.id != "add_row" ) {
				base.setAttribute( "list" , json.Code )
				state_handler(
					{ 
						op : "update" , key : "data" , key_idx : tr.rowIndex - 2 ,
						change_idxs : [ 3 , 'list' ] , 
						change_vals : [ `<td>${tds[3].innerHTML}</td>` , `<datalist id="${json.Code}">${dlist_opts}</datalist>` ]
					}
				)
			}
		})
	})
}

function save_tx() {
	let route = window.location.pathname.split( "/" )[ 1 ]
	let params = {
		method : 'POST' ,
		headers : { 'content-type' : 'application/json' }
	}

	if (stateObj[ route ].data.length == 0) return alert( "Nothing to Save" )

	stateObj[ route ].tx_no = document.querySelector( "#tx_no" ).innerHTML

	params.body = JSON.stringify( stateObj[ route ] )
	fetch( '/save_tx' , params ).then( res => {
		return ( res.status == 200 ) ? alert( "Transaction Saved" ) : res.json().then( json => { alert( json.message ) } )
	})
}

function send_print() { window.print() }

function reset_tx() { state_handler( { op : "reset_tx" } ) }
//#3 Handlers
//#1 Global Declaration
let stateObj = {
	make_tx : {
		data : [] ,
		tx_no : "" ,
		tx_owner : "" ,
		tx_date : "" ,
		tx_total : "0.00"
	} , 
	load_tx : {
		data : [] ,
		tx_no : "" ,
		tx_owner : "" ,
		tx_date : "" ,
		tx_total : "0.00"
	} ,
	collect_tx : {
		data : [] ,
		tx_owner : "" ,
		tx_total : "0.00"
	} ,
	archives : {
		data : [] ,
		tx_item : "" ,
		tx_owner : "" ,
		tx_total : "0.00"
	}
}

if (history.state) {
	stateObj.make_tx = history.state.make_tx
	stateObj.load_tx = history.state.load_tx
	stateObj.collect_tx = history.state.collect_tx
}
//#1 Global Declaration

//#2 Templates
function header( args ) {
	let ret = ""
	let date = new Date()

	if ( args.route == "make_tx" || args.route == "load_tx" ) {
		ret = `
		<div id="header">
			<div id="title">Transaction No : <span id="tx_no">${stateObj[ args.route ].tx_no}</span></div>
			<div class="horizontal_container">`

		if ( args.route == "make_tx" ) {
			ret += `
				<div>
					<label for="customer_name">Customer Name : </label>
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
          <div id="title">Counter Receipt</span></div>
          <div class="horizontal_container">
            <div>Customer Name : <span id="tx_owner">${stateObj[ args.route ].tx_owner}</span></div>
            <div>Date : <span id="tx_date">${stateObj[ args.route ].tx_date}</span></div>
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

	if ( args.route == "collect_tx" ) {
		ret += `
			<div>
				<div style="display:none;">
					<input type="checkbox" id="double_print">
		 			<label for="double_print">Double Print</label>
		`
	} else {
		ret += `
			<button onclick=save_tx()>Save</button>
			<div>
				<div>
		 			<input type="checkbox" id="double_print">
		 			<label for="double_print">Double Print</label>
		`
	}

	ret += `
				</div>
				<button onclick=send_print()>Print</button>
			</div>
		<button onclick=reset_tx()>Reset</button>
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
				<label for="search_number">Transaction Number</label>
				<input type="number" name="number" id="search_number" value="${stateObj[ args.route ].tx_no}">
			</div>
			<div>
				<label for="search_owner">Transaction Owner</label>
				<input list="customers" name="owner" id="search_owner" value="${stateObj[ args.route ].tx_owner}">
			</div>
			<input type="submit" value="Search Transaction">
		</form>

		<div id="query_results"></div>
		`
	} else if ( args.route == "collect_tx" ) {
		ret = `
		<form id="query_form" hx-post="/retrieve_records" hx-target="#query_results" hx-swap="innerHTML">
			<div>
				<label for="collect_owner">Customer Name</label>
				<input list="customers" name="owner" id="collect_owner" value="${stateObj[ args.route ].tx_owner}">
			</div>
			<input type="submit" value="Collect Transactions">
		</form>

		<div id="query_results"></div>
		`
	} else if ( args.route == "search_archives" ) {
		ret = `
		<form id="query_form" hx-post="/retrieve_records">
			<div>
				<label for="archive_owner">Customer Name</label>
				<input list="customers" name="owner" id="archive_owner" value=${stateObj[ args.route ].tx_owner}>
			</div>
			<div>
				<label for="archive_item">Item Search</label>
				<input list="items" name="item" id="archve_item" value=${stateObj[ args.route ].tx_item}>
			</div>
			<div>
				<div>
					<label for="archive_from">From</label>
					<input type="date" name="from_date" id="archive_from">
				</div>
				<div>
					<label for="archive_to">To</label>
					<input type="date" name="to_date" id="archive_to">
				</div>
			</div>
			<input type="submit" value="Search Archives">
		</form>
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

			if ( document.querySelector( `#${id}` ).tagName == "INPUT" ) {
				stateObj[ route ][ id ] = args.target_vals[ i ]
				document.querySelector( `#${id}` ).setAttribute( "value" , args.target_vals[ i ] )
			} else {
				stateObj[ route ][ id ] = args.target_vals[ i ]
				document.querySelector( `#${id}` ).innerHTML = args.target_vals[ i ]
			}
			i++
		}
		supress_fetch = true
	} else if ( args.op == "reset_tx" ) {
		stateObj[ route ] = {
			data : [] ,
			tx_owner : "" ,
			tx_total : "0.00"
		}

		document.title = `${window.location.host}${window.location.pathname}`
		document.querySelector( "#tx_owner" ).value = stateObj[ route ].tx_owner
		document.querySelector( "#tx_total" ).innerHTML = stateObj[ route ].tx_total

		if ( route == "make_tx" || route == "load_tx" ) {
			stateObj[ route ].tx_no = ""
			stateObj[ route ].tx_date = document.querySelector( "#tx_date" ).innerHTML
			document.querySelector( "#tx_no" ).innerHTML = stateObj[ route ].tx_no
			document.querySelector( "#item_cnt" ).innerHTML = stateObj[ route ].data.length
			document.querySelector( "#tx_date" ).innerHTML = stateObj[ route ].tx_date
		}

		if ( route == "make_tx" ) {
			let tbody = document.querySelector( "#tx_table_body" )
			let add_row = document.querySelector( "#add_row" ).getElementsByTagName( "td" )

			for (elem of add_row) {
				let td = elem.getElementsByTagName( "input" )
				if ( td.length != 0 ) {
					td[ 0 ].setAttribute( "value" , "" )
				}
			}

			tbody.innerHTML = document.querySelector( "#add_row" ).outerHTML
		} else if ( route == "load_tx" || route == "collect_tx" ) {
			document.querySelector( "#content_container" ).innerHTML = `
			${document.querySelector( "#routes" ).outerHTML}
			${document.querySelector( "#query_form" ).outerHTML}
			<div id="query_results"></div>
			`
			htmx.process( document.querySelector( "#query_form" ) )
		}
		supress_fetch = true
	} else if ( args.op == "read" ) {

		if ( args.route == "make_tx" || args.route == "load_tx" ) { 
			stateObj[ route ].tx_no = document.querySelector( "#tx_no" ).innerHTML 
		}

		stateObj[ route ].tx_owner = document.querySelector( "#tx_owner" ).innerHTML
		stateObj[ route ].tx_date = document.querySelector( "#tx_date" ).innerHTML
		stateObj[ route ].tx_total = document.querySelector( "#tx_total" ).innerHTML

		supress_fetch = true
	}

	if ( args.op == "insert" || args.op == "update" || args.op == "delete" || args.op == "read" ) {
		stateObj[ route ].data = []
		document.querySelector( "#tx_total" ).innerHTML = "0.00"

		let table = document.querySelector( "#tx_table_body" )
		let gt = 0

		for (var i = 0; i < table.rows.length; i++) {

			let tds = table.rows[ i ].getElementsByTagName( "td" )

			if ( args.op == "read" && args.route == "collect_tx" ) {

				gt += parseFloat( tds[ 2 ].innerHTML )

				stateObj[ route ].data.push( 
					{
						0 : tds[ 0 ].outerHTML ,
						1 : tds[ 1 ].outerHTML ,
						2 : tds[ 2 ].outerHTML
					}
				)
			} else {
				if ( table.rows[ i ].id == "add_row" ) { continue }

				let list = tds[ 5 ].getElementsByTagName( "input" )[ 0 ].getAttribute( "list" )
				let push_obj = {
						0 : tds[ 0 ].outerHTML ,
						1 : tds[ 1 ].outerHTML ,
						2 : tds[ 2 ].outerHTML ,
						3 : tds[ 3 ].outerHTML ,
						4 : tds[ 4 ].outerHTML ,
						5 : tds[ 5 ].outerHTML ,
						6 : tds[ 6 ].outerHTML
					}

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

		stateObj[ route ].tx_total = gt.toFixed( 2 )
		document.querySelector( "#tx_total" ).innerHTML = gt.toFixed( 2 )

		if ( args.route == "make_tx" || args.route == "load_tx" ) {
			document.querySelector( "#item_cnt" ).innerHTML = stateObj[ route ].data.length	 
		}
	}

	if ( args.debug ) { console.log( stateObj ) }

	if ( document.querySelector( "#tx_no" ).innerHTML == "" ) {
		alert( "Transaction Number missing NOT SAVED" )
		return
	}

	if (supress_fetch) { 
		history.pushState( stateObj , "" )
		return
	}

	params.body.tx_date = document.querySelector( "#tx_date" ).innerHTML
	params.body = JSON.stringify( params.body )

	fetch( '/save_tx' , params ).then( res => {
		if ( res.status == 200 ) {
			history.pushState( stateObj , "" )
		} else {
			res.json().then( json => {
				alert( json.message )
			})
		}
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

		add_obj[ i ] = ( i == 0 )
			? `<td class="hidden_print">${tags[ i ]}</td>`
			: `<td>${tags[ i ]}</td>`

		if ( i > 0 && i != 6 ) {
			if ( i == 4 || i == 5 ) { children[ i ].getElementsByTagName( "input" )[ 0 ].disabled = true }
			children[ i ].getElementsByTagName( "input" )[ 0 ].value = ""
			children[ i ].getElementsByTagName( "input" )[ 0 ].setAttribute( "value" , "" )
		} else if ( i == 6 ) {
			children[ i ].innerHTML = "0.00"
		}
	}

	add_obj.list = `<datalist id=${code}>${document.querySelector( "#prices" ).innerHTML}</datalist>`

	for ( key in add_obj ) { if ( key != "list" ) { new_row.insertAdjacentHTML( "beforeend" , add_obj[ key ] ) } }

	state_handler( { op : "insert" , key : "data" , val : add_obj , debug : 1 } )
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

	if ( rate == "" ) { rate = 0 }

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
		headers : { 'content-type' : 'application/json' }
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
	}10

	if (stateObj[ route ].data.length == 0) {
		alert( "Nothing to Save" )
		return
	}

	console.log( stateObj[ route ].tx_no )

	stateObj[ route ].tx_no = document.querySelector( "#tx_no" ).innerHTML

	params.body = JSON.stringify( stateObj[ route ] )

	fetch( '/save_tx' , params ).then( res => {
		if ( res.status == 200 ) {
			if ( route == "make_tx" ) { alert( "Trasnaction Saved" ) }
		} else {
			res.json().then( json => {
				alert( json.message )
			})
		}
	})
}

function send_print() { window.print() }

function reset_tx() {
	let route = window.location.pathname.split( "/" )[ 1 ]

	if ( route == "make_tx" || route == "load_tx" || route == "collect_tx" ) { state_handler( { op : "reset_tx" } ) }
}
//#3 Handlers
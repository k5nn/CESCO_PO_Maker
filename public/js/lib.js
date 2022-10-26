//	sections
//		#1 Global Declaration
//		#2 Templating Function
//		#3 Handlers
//			#3.1 State Handler
//			#3.2 Table Manip
//			#3.3 Fetch Handlers
//			#3.4 UI Handlers
//		#4 Components
//			#4.1 Section Components
//			#4.2 Field Components
//			#4.3 Button Components
//			#4.4 Generic Components

//#1 Global Declaration
let stateObj = {
	make_tx : {
		data : [] ,
		tx_no : null ,
		tx_owner : null ,
	} , 
	load_tx : {
		data : [] ,
		tx_no : null ,
		tx_owner : null ,
		tx_date : null ,
	} ,
	collect_tx : {
		data : [] ,
		tx_owner : null ,
		tx_date : null
	}
}

if (history.state) {
	stateObj.make_tx = history.state.make_tx
	stateObj.load_tx = history.state.load_tx
	stateObj.collect_tx = history.state.collect_tx
}
//#1 Global Declaration

//#2 Templating Function
function node_creator( params ) {
	const supported_nodes = [ "div" , "th" , "tr" , "td" , "input" , "button" , "thead" , "table" , "tbody" ]

	if ( supported_nodes.includes( params.node_type ) ) {
			
		let node = document.createElement( params.node_type )

		if ( params.hasOwnProperty( "id" ) ) { node.id = params.id }

		if ( params.hasOwnProperty( "class" ) ) { 
			let classes = ""
			for ( class_name of params.class ) {
				if (classes == "") {
					classes += class_name
				} else {
					classes += ` ${class_name}`
				}
			}
			node.setAttribute( "class" , classes  )
		}

		if ( params.hasOwnProperty( "innerHTML" ) ) { node.innerHTML = params.innerHTML }

		if ( params.hasOwnProperty( "attribs" ) ) { 

			if ( typeof( params.attribs ) != "object" ) {
				console.log( "node_creator : Invalid Attributes" )
				return
			}

			for ( key in params.attribs ) { 

				node.setAttribute( key , params.attribs[ key ] ) 

				if ( key == "list" ) {
					if ( document.querySelector( params.src_name ) == null && params.src_name ) {
						let list = document.createElement( "datalist" )
						list.id = params.src_name
						list.innerHTML = params.src_opts
						document.querySelector( "body" ).appendChild( list )
					}
				}
			}
		}

		if ( params.hasOwnProperty( "parent" ) ) {
			params.parent.appendChild( node )
		} else {
			document.body.appendChild( node )
		}

	} else {
		console.log( `node_creator : ${params}` )
		return
	}

}
//#2 Templating Function

//#3 Handlers

//#3.1 State Handler
function state_handler( params ) {

	let route = window.location.pathname.split( "/" )[ 1 ]

	if (params.key == "data") {

		if ( params.operation == "create" ) {
			stateObj[ route ][ params.key ].push( params.value )
		} else if ( params.operation == "update" ) {

			if ( route == "collect_tx" ) {
				stateObj[ route ][ params.key ] = params.value
				return
			}

			// console.log( stateObj[ route ][ params.key ] )

			if ( params.hasOwnProperty( "tx_item" ) ) {

				params.tx_item -= 2

				// console.log( stateObj[ route ][ params.key ][ params.tx_item ] )

				if ( JSON.parse( stateObj[ route ][ params.key ][ params.tx_item ][ params.column ] ).hasOwnProperty( "attribs" ) ) {
					let to_change = JSON.parse( stateObj[ route ][ params.key ][ params.tx_item ][ params.column ] )
					to_change.attribs.value = params.value
					stateObj[ route ][ params.key ][ params.tx_item ][ params.column ] = JSON.stringify( to_change )
				} else {
					stateObj[ route ][ params.key ][ params.tx_item ][ params.column ] = params.value
				}
			} else {
				// console.log( `state_handler : ${params.value}` )
				stateObj[ route ][ params.key ] = params.value
			}

			// console.log( stateObj[ route ][ params.key ] )

		} else if ( params.operation == "delete" ) {
			params.tx_item -= 2
			stateObj[ route ][ params.key ].splice( params.tx_item , 1 )
		}

	} else {
		stateObj[ route ][ params.key ] = params.value
	}

	if ( params.key == "reset" ) {

		if ( route == "make_tx" ) {
			stateObj[ route ] = {
				data : [] ,
				tx_no : null ,
				tx_owner : null ,
				tx_total : null
			}
		} else if ( route == "load_tx" ) {
			stateObj[ route ] = {
				data : [] ,
				tx_no : null ,
				tx_owner : null ,
				tx_date : null ,
				tx_total : null
			}
		} else if ( route == "collect_tx" ) {
			stateObj[ route ] = {
				data : [] ,
				tx_owner : null ,
				tx_date : null
			}
		}

	}

	history.pushState( stateObj , "" )

	// console.log( stateObj[ route ] )

}
//#3.1 State Handler

//#3.2 Table Manip Handlers
function add_qty() {
	let route = window.location.pathname.split( "/" )[ 1 ]
	let tr = event.target.parentNode.parentNode
	let children = tr.childNodes
	let rate = children[ 4 ].childNodes[ 0 ].value
	let base_price = children[ 5 ].childNodes[ 0 ].value
	let total = children[ 6 ]
	let qty = event.target.value
	let gt = 0

	if (base_price > 0) {

		if ( rate != 0 ) {
			children[ 4 ].childNodes[ 0 ].value = rate
			total.innerHTML = ( ( base_price * ( ( 100 + parseFloat( rate ) ) / 100 ) ) * qty ).toFixed( 2 )
		} else {
			children[ 4 ].childNodes[ 0 ].value = ""
			total.innerHTML = ( ( base_price * ( ( 100 + 0 ) / 100 ) ) * qty ).toFixed( 2 )
		}

	}

	if ( stateObj[ route ].data.length > 0 && tr.id != "add_row" ) {
		state_handler( { key : "data" , operation : "update" , tx_item : tr.rowIndex , column : 1 , value : event.target.value } )
		state_handler( { key : "data" , operation : "update" , tx_item : tr.rowIndex , column : 6 , value : total.innerHTML } )

		for (item of stateObj[ route ].data) { gt += parseFloat( JSON.parse( item[ 6 ] ) ) }
		state_handler( { key : "tx_total" , operation : "update" , value : parseFloat( gt ).toFixed( 2 ) } )
		document.querySelector( "#total_field" ).innerHTML = ""
		document.querySelector( "#total_field" ).innerHTML = parseFloat( gt ).toFixed( 2 )

		if ( route == "make_tx" ) {
			save_tx( true )
		} else if ( route == "load_tx" ) {
			overwrite_tx( true )
		}
	}

}

function add_item() {

	try {
		const params = {
			method : 'POST' ,
			body : JSON.stringify( items[ JSON.parse( event.target.value ).name ] ) ,
			headers : { 'content-type' : 'application/json' }
		}
		const exp = /^[+-]/
		event.target.setAttribute( "data-code" , JSON.parse( event.target.value ).code )
		event.target.value = JSON.parse( event.target.value ).name

		fetch( '/price' , params ).then( res => {
			res.json().then( json => {

				let pricelist = document.querySelector( '#prices' )

				if (pricelist.innerHTML != "") {
					pricelist.innerHTML = ""
				}

				document.querySelector( '#add_price' ).disabled = false
				document.querySelector( '#add_rate' ).disabled = false

				for (key in json) {

					if (key != "Code" && key != "Name" && json[ key ] != "") {
						let option = document.createElement( 'option' )

						if ( exp.test( json[ key ] ) ) {
							option.value = `{ "rate" : "${json[key]}" , "base" : "${json.BASE}" }`
							option.innerHTML = `${key} | ${ json[ key ] } | ${json.BASE}`
						} else {
							option.value = `{ "rate" : "0" , "base" : "${json[ key ]}" }`
							option.innerHTML = `${key} | ${ json[ key ] }`
						}

						pricelist.appendChild( option )
					}
				}

			}).catch( err => {
				document.querySelector( '#add_price' ).disabled = false
				document.querySelector( '#add_rate' ).disabled = false		
			})
		})
	} catch( err ) {
		document.querySelector( '#add_price' ).disabled = false
		document.querySelector( '#add_rate' ).disabled = false
	}


}

function add_rate() {
	let route = window.location.pathname.split( "/" )[ 1 ]
	let tr = event.target.parentNode.parentNode
	let children = tr.childNodes
	let qty = children[ 1 ].childNodes[ 0 ].value
	let base_price = children[ 5 ].childNodes[ 0 ].value
	let total = children[ 6 ]
	let rate = event.target.value
	let gt = 0

	if ( rate != 0 ) {
		children[ 4 ].childNodes[ 0 ].value = rate
		total.innerHTML = ( ( base_price * ( ( 100 + parseFloat( rate ) ) / 100 ) ) * qty ).toFixed( 2 )
	} else {
		children[ 4 ].childNodes[ 0 ].value = ""
		total.innerHTML = ( ( base_price * ( ( 100 + 0 ) / 100 ) ) * qty ).toFixed( 2 )
	}

	if ( stateObj[ route ].data.length > 0 && tr.id != "add_row" ) {
		state_handler( { key : "data" , operation : "update" , tx_item : tr.rowIndex , column : 4 , value : event.target.value } )
		state_handler( { key : "data" , operation : "update" , tx_item : tr.rowIndex , column : 6 , value : total.innerHTML } )

		for (item of stateObj[ route ].data) { gt += parseFloat( JSON.parse( item[ 6 ] ) ) }
		state_handler( { key : "tx_total" , operation : "update" , value : parseFloat( gt ).toFixed( 2 ) } )
		document.querySelector( "#total_field" ).innerHTML = ""
		document.querySelector( "#total_field" ).innerHTML = parseFloat( gt ).toFixed( 2 )

		if ( route == "make_tx" ) {
			save_tx( true )
		} else if ( route == "load_tx" ) {
			overwrite_tx( true )
		}
	}
}

function add_price() {
	let route = window.location.pathname.split( "/" )[ 1 ]
	let tr = event.target.parentNode.parentNode
	let children = tr.childNodes
	let qty = children[ 1 ].childNodes[ 0 ].value
	let rate = children[ 4 ].childNodes[ 0 ].value
	let base_price = JSON.parse( event.target.value ).base
	let total = children[ 6 ]
	let gt = 0

	if (base_price === undefined ) {
		base_price = event.target.value

		if ( base_price <= -1 ) {
			base_price = 1
			alert( "Base Price cannot be Negative Value" )
		}

	} else {
		event.target.value = base_price
	}

	if ( rate === undefined ) { rate = 0 }

	if (rate != 0) {
		children[ 4 ].childNodes[ 0 ].value = rate
		total.innerHTML = ( ( base_price * ( ( 100 + parseFloat( rate ) ) / 100 ) ) * qty ).toFixed( 2 ) 
	} else {
		children[ 4 ].childNodes[ 0 ].value = ""
		total.innerHTML = ( ( base_price * ( ( 100 + 0 ) / 100 ) ) * qty ).toFixed( 2 )
	}

	if ( stateObj[ route ].data.length > 0 && tr.id != "add_row" ) {
		state_handler( { key : "data" , operation : "update" , tx_item : tr.rowIndex , column : 5 , value : event.target.value } )
		state_handler( { key : "data" , operation : "update" , tx_item : tr.rowIndex , column : 6 , value : total.innerHTML } )

		for (item of stateObj[ route ].data) { gt += parseFloat( JSON.parse( item[ 6 ] ) ) }
		state_handler( { key : "tx_total" , operation : "update" , value : parseFloat( gt ).toFixed( 2 ) } )
		document.querySelector( "#total_field" ).innerHTML = ""
		document.querySelector( "#total_field" ).innerHTML = parseFloat( gt ).toFixed( 2 )

		if ( route == "make_tx" ) {
			save_tx( true )
		} else if ( route == "load_tx" ) {
			overwrite_tx( true )
		}
	}

}

function add_entry( item_arr , id ) {
	let route = window.location.pathname.split( "/" )[ 1 ]
	let tbody = document.querySelector( "#tx_table_body" )

	if (item_arr) {
		let add_row_params = item_arr
		let new_row = tbody.insertRow( 0 )

		if ( id ) { new_row.id = id }

		for ( item in add_row_params ) {

			let new_td = document.createElement( "td" )
			try {
				if ( typeof( JSON.parse( add_row_params[ item ] ) ) === "number" ) {

					if ( id ) {
						if (new_row.id == "add_row" ) {
							new_td.id = "add_total"
						}
					}

					new_td.innerHTML = add_row_params[ item ]
				} else {

					// console.log( 'there' )

					let add_elem = JSON.parse( add_row_params[ item ] )
					add_elem.parent = new_td

					if ( add_elem.node_type == "button" ) { new_td.setAttribute( "class" , "hidden_print" )  }

					node_creator( add_elem )
				}
			} catch {

				// console.log( 'where' )

				new_td.innerHTML = add_row_params[ item ]
			}

			new_row.appendChild( new_td )

			add_row_params[ item ] = ( typeof( add_row_params[ item ] ) === "object" ) 
				? JSON.stringify( add_row_params[ item ] )
				: add_row_params[ item ]

		}

	} else {
		let tr = event.target.parentNode.parentNode
		let children = tr.childNodes
		let current_tot = parseFloat( document.querySelector( "#total_field" ).innerHTML )
		let add_row_params = [
			{ 
				node_type : "button" , innerHTML : "🗑" , 
				attribs : { onclick : "remove_entry()" } 
			} ,
			{ 
				node_type : "input" , 
				attribs : { value : children[ 1 ].childNodes[ 0 ].value , type : "number" , onchange : "add_qty()" } 
			} ,
			children[ 2 ].childNodes[ 0 ].value ,
			children[ 3 ].childNodes[ 0 ].value ,
			{ 
				node_type : "input" , 
				attribs : { value : children[ 4 ].childNodes[ 0 ].value , type : "number" , onchange : "add_rate()" } 
			} ,
			{ 
				node_type : "input" , 
				attribs : { 
					value : children[ 5 ].childNodes[ 0 ].value , type : "input" , 
					list : children[ 3 ].childNodes[ 0 ].getAttribute( "data-code" ) ,
					onchange : "add_price()"
				} ,
				src_name : children[ 3 ].childNodes[ 0 ].getAttribute( "data-code" ) ,
				src_opts : document.querySelector( "#prices" ).innerHTML , 
			} ,
			parseFloat(children[ 6 ].innerHTML).toFixed( 2 )
		]

		let new_row = tbody.insertRow( -1 )

		for ( item in add_row_params ) {

			let new_td = document.createElement( "td" )

			if ( typeof add_row_params[ item ] === "object" ) {
				add_row_params[ item ].parent = new_td

				if ( add_row_params[ item ].node_type == "button" ) { new_td.setAttribute( "class" , "hidden_print" )  }

				node_creator( add_row_params[ item ] )
			} else {
				new_td.innerHTML = add_row_params[ item ]
			}

			new_row.appendChild( new_td )

			if ( Number.isInteger( parseInt( item ) ) ) {
				if ( item >= 1 && item <= 5 ) {
					children[ item ].querySelector( "input" ).value = ""
				} else if ( item == 6 ) {
					children[ item ].innerHTML = parseFloat( 0 ).toFixed( 2 )
				}
			}

			try {
				if ( typeof( JSON.parse( add_row_params[ item ] ) === "number" ) ) {
					add_row_params[ item ] = add_row_params[ item ]
				}
			} catch {
				add_row_params[ item ] = ( typeof( add_row_params[ item ] ) === "object" ) 
					? JSON.stringify( add_row_params[ item ] )
					: add_row_params[ item ]
			}
		}

		document.querySelector( "#total_field" ).innerHTML = ( document.querySelector( "#total_field" ).innerHTML == "" )
			? document.querySelector( "#total_field" ).innerHTML = add_row_params[ 6 ]
			: document.querySelector( "#total_field" ).innerHTML = (current_tot + parseFloat( add_row_params[ "6" ] )).toFixed( 2 )
		state_handler( { key : "tx_total" , operation : "update" , value : parseFloat( document.querySelector( "#total_field" ).innerHTML ).toFixed( 2 ) } )

		document.querySelector( '#add_price' ).disabled = true
		document.querySelector( '#add_rate' ).disabled = true

		state_handler( { key : "data" , operation : "create" , value : add_row_params } )

		if ( route == "make_tx" ) {
			save_tx( true )
		} else if ( route == "load_tx" ) {
			overwrite_tx( true )
		}

		if ( document.querySelector( "#count_label" ) ) {
			document.querySelector( "#count_label" ).innerHTML = `${stateObj[route].data.length} items`
		}
	}

}

function remove_entry() {
	let route = window.location.pathname.split( "/" )[ 1 ]
	let tbody = document.querySelector( "#tx_table_body" )
	let tr = event.target.parentNode.parentNode
	let minus_val = tr.children[ 6 ].innerHTML
	let current_tot = parseFloat( document.querySelector( "#total_field" ).innerHTML )

	state_handler( { key : "data" , operation : "delete" , tx_item : tr.rowIndex } )
	tbody.deleteRow( tr.rowIndex - 1 )

	document.querySelector( "#total_field" ).innerHTML = ( tbody.rows.length == 1 )
		? document.querySelector( "#total_field" ).innerHTML = ""
		: document.querySelector( "#total_field" ).innerHTML = (current_tot - parseFloat( minus_val )).toFixed( 2 )
	state_handler( { key : "tx_total" , operation : "update" , value : parseFloat( document.querySelector( "#total_field" ).innerHTML ).toFixed( 2 ) } )

	if ( route == "make_tx" ) {
		save_tx( true )
	} else if ( route == "load_tx" ) {
		overwrite_tx( true )
	}

	if ( document.querySelector( "#count_label" ) ) {
		document.querySelector( "#count_label" ).innerHTML = `${stateObj[route].data.length} items`
	}

}
//#3.2 Table Manip Handlers

//#3.3 Fetch Handlers
function customer_name() {
	if (event.target.value != "") {
		const params = {
			method : 'POST' ,
			body : JSON.stringify( { Customer : event.target.value } ) ,
			headers : { 'content-type' : 'application/json' }
		}
		state_handler( { key : "tx_owner" , value : event.target.value } )

		fetch( '/get_tx_number' , params ).then( res => {
			res.json().then( json => {
				document.querySelector( '#title' ).innerHTML = "Transaction No:&nbsp;"
				document.querySelector( '#title' ).innerHTML += json.tx_id
				state_handler( { key : "tx_no" , value : json.tx_id } )
			})
		})
	}
}

function save_tx( suppress ) {
	let route = window.location.pathname.split( "/" )[ 1 ]
	let save_obj = stateObj[ route ]
	save_obj.tx_date = document.querySelector( "#date_field" ).innerHTML

	const params = {
		method : 'POST' ,
		body : JSON.stringify( save_obj ) ,
		headers : { 'content-type' : 'application/json' }
	}

	fetch( '/save_tx' , params ).then( res => {
		res.json().then( json => {

			if (suppress) { return }

			alert( json.message )
		})
	})
}

function search_tx() {
	let route = window.location.pathname.split( "/" )[ 1 ]

	if ( document.querySelector( "#tx_table" ) != null ) {
		return
	}
	
	const search_params = {
		number : document.querySelector( "#tx_no_field" ).value ,
		owner : document.querySelector( "#tx_owner_field" ).value ,
	}
	const params = {
		method : 'POST' ,
		body : JSON.stringify( search_params ) ,
		headers : { 'content-type' : 'application/json' }
	}

	fetch( "/fetch_tx" , params ).then( res => {
		if ( res.ok ) {
			res.json().then( json => {

				document.querySelector( "#tx_no_field" ).disabled = true
				document.querySelector( "#tx_owner_field" ).disabled = true

				state_handler( { key : "data" , operation : "update" , value : json.data } )
				state_handler( { key : "tx_no" , value : json.tx_no } )
				state_handler( { key : "tx_owner" , value : json.tx_owner } )
				state_handler( { key : "tx_date" , value : json.tx_date } )

				result_header()
					title()
					generic_container( 
						{ id : "header_details_container" , horizontal : true , parent : document.querySelector( "#result_header" ) } 
					)
						generic_container( 
							{ id : "name_input_container" , horizontal : true , parent : document.querySelector( "#header_details_container" ) } 
						)
							generic_label(
								{ 
									id : "name_label" , innerHTML : `Customer Name : ${document.querySelector( "#tx_owner_field" ).value}` , 
									parent : document.querySelector( "#name_input_container" ) 
								}
							)
						generic_container(
							{ id : "date_container" , horizontal : true , parent : document.querySelector( "#header_details_container" ) } 
						)
							generic_label(
								{ id : "date_label" , innerHTML : "Date :&nbsp" , parent : document.querySelector( "#date_container" ) }
							)
							date_field()
				tx_table()
					tx_table_header()
					thead_row()
				tx_table_body()
					tbody_row()
				footer()
					generic_container( 
						{ id : "footer_details_container" , horizontal : true , parent : document.querySelector( "#footer" ) } 
					)
						generic_container(
							{ id : "count_container" , horizontal : true , parent : document.querySelector( "#footer_details_container" ) }
						)
							generic_label(
								{ id : "count_label" , 
								  innerHTML : `${stateObj[route].data.length} items` ,
								  parent : document.querySelector( "#count_container" )
								}
							)
						generic_container(
							{ id : "signature_container" , horizontal : true , parent : document.querySelector( "#footer_details_container" ) } 
						)
							generic_label(
								{ id : "signature_label" , 
								  innerHTML : "Recieved By :&nbsp;____________________" , 
								  parent : document.querySelector( "#signature_container" ) 
								}
							)
						generic_container( 
							{ id : "total_container" , horizontal : true , parent : document.querySelector( "#footer_details_container" ) } 
						)
							generic_label( 
								{ id : "total_label" , innerHTML : "Total :&nbsp;" , parent : document.querySelector( "#total_container" ) }
							)
							total_field()
					generic_container( 
						{ id : "controls_container" , horizontal : true , parent : document.querySelector( "#content_container" ) } 
					)
						save_button()
						print_button()
						reset_button()

			})
		} else {
			res.json().then( json => {
				alert( json.message )
			})
		}
	})
}

function overwrite_tx( suppress ) {
	const overwrite_params = {
		number : document.querySelector( "#tx_no_field" ).value ,
		owner : document.querySelector( "#tx_owner_field" ).value ,
		data : stateObj.load_tx
	}
	const params = {
		method : 'POST' ,
		body : JSON.stringify( overwrite_params ) ,
		headers : { 'content-type' : 'application/json' }
	}

	fetch( "/overwrite_tx" , params ).then( res => {
		res.json().then( json => {

			if ( suppress ) { return }

			alert( json.message )
		})
	})
}

function query_txs() {

	if ( document.querySelector( "#tx_table" ) != null ) {
		return
	}

	document.querySelector( "#search_button" ).disabled = true

	const query_params = {
		owner : document.querySelector( "#tx_owner_field" ).value ,
	}
	const params = {
		method : 'POST' ,
		body : JSON.stringify( query_params ) ,
		headers : { 'content-type' : 'application/json' }
	}

	fetch( "/retrieve_records" , params ).then( res => {
		res.json().then( json => {

			document.querySelector( "#search_button" ).disabled = false

			if ( json.hasOwnProperty( "message" ) ) {
				alert( json.message )
				return
			}

			state_handler( { key : "data" , operation : "update" , value : json.data } )

			result_header()
				title()
				generic_container(
					{ id : "header_details_container" , horizontal : true , parent : document.querySelector( "#result_header" ) } 
				)
					generic_container( 
						{ id : "name_input_container" , horizontal : true , parent : document.querySelector( "#header_details_container" ) } 
					)
						generic_label(
							{ 
								id : "name_label" , innerHTML : `Customer Name : ${document.querySelector( "#tx_owner_field" ).value}` , 
								parent : document.querySelector( "#name_input_container" ) 
							}
						)
					generic_container(
						{ id : "date_container" , horizontal : true , parent : document.querySelector( "#header_details_container" ) } 
					)
						generic_label( 
							{ id : "date_label" , innerHTML : "Date :&nbsp" , parent : document.querySelector( "#date_container" ) }
						)
						date_field()
			tx_table()
				tx_table_header()
					thead_row()
				tx_table_body()
					tbody_row()
			footer()
				generic_container( 
					{ id : "footer_details_container" , horizontal : true , parent : document.querySelector( "#footer" ) } 
				)
					generic_container( 
						{ id : "signature_container" , horizontal : true , parent : document.querySelector( "#footer_details_container" ) } 
					)
						generic_label(
							{ id : "signature_label" , 
							  innerHTML : "Recieved By :&nbsp;____________________" , 
							  parent : document.querySelector( "#signature_container" )
							}
						)
					generic_container( 
						{ id : "total_container" , horizontal : true , parent : document.querySelector( "#footer_details_container" ) } 
					)
						generic_label( 
							{ id : "total_label" , innerHTML : `Total : ${json.gt}` , parent : document.querySelector( "#total_container" ) }
						)
				generic_container( 
					{ id : "controls_container" , horizontal : true , parent : document.querySelector( "#content_container" ) } 
				)
					print_button()
					collect_button()
					reset_button()
		})
	})
}
//#3.3 Fetch Handlers

//#3.4 UI Handlers
function reset_tx() {
	let route = window.location.pathname.split( "/" )[ 1 ]
	let tbody = document.querySelector( "#tx_table_body" )

	state_handler( { key : "reset" } )

	if ( route == "make_tx" ) {
		for (row_cnt in tbody.rows) {
			if ( parseInt( tbody.rows.length ) != 1 ) {
				tbody.deleteRow( 1 )
			}
		}

		document.querySelector( "#title" ).innerHTML = "Transaction No:&nbsp;"
		document.querySelector( "#add_total" ).innerHTML = Number.parseFloat( 0 ).toFixed( 2 )

		document.querySelector( "#total_field" ).innerHTML = ""
		document.querySelector( "#name_field" ).value = ""
		for( node of document.querySelectorAll( ".add_field" ) ) { node.value = "" }


		document.querySelector( "#add_rate" ).disabled = true
		document.querySelector( "#add_price" ).disabled = true

	} else if ( route == "load_tx" ) {

		document.querySelector( "#add_total" ).innerHTML = Number.parseFloat( 0 ).toFixed( 2 )

		for( node of document.querySelectorAll( ".add_field" ) ) { node.value = "" }
		document.querySelector( "#tx_no_field" ).value = ""
		document.querySelector( "#tx_owner_field" ).value = ""

		if ( document.querySelector( "#result_header" ) != null ) {
			document.querySelector( "#content_container" ).removeChild( document.querySelector( "#result_header" ) )	
		}

		if ( document.querySelector( "#tx_table" ) != null ) {
			document.querySelector( "#content_container" ).removeChild( document.querySelector( "#tx_table" ) )
		}

		if ( document.querySelector( "#footer" ) != null ) {
			document.querySelector( "#content_container" ).removeChild( document.querySelector( "#footer" ) )
		}

		if ( document.querySelector( "#controls_container" ) != null ) {
			document.querySelector( "#content_container" ).removeChild( document.querySelector( "#controls_container" ) )
		}

		document.querySelector( "#tx_no_field" ).disabled = false
		document.querySelector( "#tx_owner_field" ).disabled = false

	} else if ( route == "collect_tx" ) {

		document.querySelector( "#tx_owner_field" ).value = ""

		if ( document.querySelector( "#result_header" ) != null ) {
			document.querySelector( "#content_container" ).removeChild( document.querySelector( "#result_header" ) )	
		}

		if ( document.querySelector( "#tx_table" ) != null ) {
			document.querySelector( "#content_container" ).removeChild( document.querySelector( "#tx_table" ) )
		}

		if ( document.querySelector( "#footer" ) != null ) {
			document.querySelector( "#content_container" ).removeChild( document.querySelector( "#footer" ) )
		}

		if ( document.querySelector( "#controls_container" ) != null ) {
			document.querySelector( "#content_container" ).removeChild( document.querySelector( "#controls_container" ) )
		}

		document.querySelector( "#search_button" ).disabled = false
		document.querySelector( "#tx_owner_field" ).disabled = false

	}

	if ( document.querySelector( "#count_label" ) ) {
		document.querySelector( "#count_label" ).innerHTML = `0 items`
	}
}
//#3.4 UI Handlers

//#3 Handlers

//#4 Components

//#4.1 Section Components
function header() {
	let route = window.location.pathname.split( "/" )[ 1 ]
	let header = { node_type : "div" , parent : document.querySelector( "#content_container" ) }

	if ( route == "make_tx" ) {
		header.id = "header"
	} else if ( route == "load_tx" ) {
		header.id = "search_header"
	} else if ( route == "collect_tx" ) {
		header.id = "search_header"
	}

	node_creator( header )
}

function result_header() {
	let result_header = { id : "result_header" , node_type : "div" , parent : document.querySelector( "#content_container" ) }
	node_creator( result_header )
}

function footer() {
	let footer = { id : "footer" , node_type : "div" , parent : document.querySelector( "#content_container" ) } 
	node_creator( footer )
}

function title() {
	let route = window.location.pathname.split( "/" )[ 1 ]
	let title = {
		id : "title" , node_type : "div" , innerHTML : "Transaction No:&nbsp;" , 
	}

	if ( route == "make_tx" ) {
		title.parent = document.querySelector( "#header" )
		if ( stateObj[ route ].tx_no ) { title.innerHTML += stateObj[ route ].tx_no }
	} else if ( route == "load_tx" ) {
		title.parent = document.querySelector( "#result_header" )
		title.innerHTML += stateObj[ route ].tx_no
	} else if ( route == "collect_tx" ) {
		title.parent = document.querySelector( "#result_header" )
		title.innerHTML = "Counter Recipt"
	}
	node_creator( title )
}
//#4.1 Section Components


//#4.2 Field Components
function name_field() {
	let route = window.location.pathname.split( "/" )[ 1 ]
	let name_field = {
		id : "name_field" ,
		node_type : "input" , parent : document.querySelector( "#name_input_container" ) ,
		attribs : { onchange : "customer_name()" , list : "customers" }
	}
	if ( stateObj[ route ].hasOwnProperty( "tx_owner" ) ) { 
		if ( stateObj[ route ].tx_owner ) { name_field.attribs.value = stateObj[ route ].tx_owner }
	}
	node_creator( name_field )

}

function date_field() {
	let route = window.location.pathname.split( "/" )[ 1 ]
	let date = new Date()
	let date_field = {
		id : "date_field" ,
		node_type : "div" , innerHTML : `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}` ,
		parent : document.querySelector( "#date_container" )
	}

	if ( route == "collect_tx" ) {
		date_field.innerHTML = `${date.getMonth() + 1}/${date.getDate() + 1}/${date.getFullYear()}`
	}

	node_creator( date_field )
}

function tx_no_field() {
	let tx_no_field = {
		id : "tx_no_field" , node_type : "input" , attribs : { type : "number" } , 
		class : [ "form_field" ] , parent : document.querySelector( "#tx_no_container" )
	}
	node_creator( tx_no_field )
}

function tx_owner_field() {
	let tx_owner_field = {
		id : "tx_owner_field" , node_type : "input" , attribs : { list : "customers" } , 
		class : [ "form_field" ] , parent : document.querySelector( "#tx_owner_container" )
	}
	node_creator( tx_owner_field )
}

function tx_no_field() {
	let tx_no_field = {
		id : "tx_no_field" , node_type : "input" , attribs : { type : "number" } , 
		class : [ "form_field" ] , parent : document.querySelector( "#tx_no_container" )
	}
	node_creator( tx_no_field )
}

function total_field() {
	let route = window.location.pathname.split( "/" )[ 1 ]
	let total_field = {
		id : "total_field" ,
		node_type : "div" , parent : document.querySelector( "#total_container" )
	}
	if ( stateObj[ route ].hasOwnProperty( "data" ) ) {
		if ( stateObj[ route ].data.length > 0 ) {
			let total = 0
			total_field.innerHTML = ""
			for ( item of stateObj[ route ].data ) {
				total += parseFloat( JSON.parse( item[ 6 ] ) )
			}
			total_field.innerHTML = total.toFixed( 2 )
		}
	}
	node_creator( total_field )
}
//#4.2 Feild Components

//#4.3 Table Components
function tx_table() {
	let tx_table = {
		id : "tx_table" ,
		node_type : "table" , parent : document.querySelector( "#content_container" )
	}
	node_creator( tx_table )
}

function tx_table_header() {
	let tx_table_header = {
		id : "tx_table_header" ,
		node_type : "thead" , parent : document.querySelector( "#tx_table" )
	}
	node_creator( tx_table_header )
}

function thead_row() {
	let th_inner = ""
	let route = window.location.pathname.split( "/" )[ 1 ]

	const table_headers = ( route == "collect_tx" ) 
		? [ "Transaction No" , "Date" , "Total" ]
		: [ "Actions" , "Qty" , "Unit" , "Item" , "Rate" , "Price" , "Total" ]

	for ( header of table_headers ) {

		if ( header == "Actions" ) {
			th_inner += `<th class="hidden_print">${header}</th>`
		} else {
			th_inner += `<th>${header}</th>`
		}

	}

	let thead_row = {
		id : "table_header" ,
		node_type : "tr" , innerHTML : th_inner , parent : document.querySelector( "#tx_table_header" )
	}
	node_creator( thead_row )
}

function tx_table_body() {
	let tx_table_body = {
		id : "tx_table_body" ,
		node_type : "tbody" , parent : document.querySelector( "#tx_table" )
	}
	node_creator( tx_table_body )
}

function tbody_row() {
	let route = window.location.pathname.split( "/" )[ 1 ]
	let td_inner = ""
	
	const table_add_row = [ 
		`<button onclick=add_entry()>➕</button>` ,
		`<input type="number" onchange=add_qty() class="add_field">` ,
		`<input type="text" class="add_field">` ,
		`<input list="items" onchange=add_item() class="add_field">` ,
		`<input type="number" onchange=add_rate() disabled=true id="add_rate" class="add_field">` ,
		`<input list="prices" onchange=add_price() id="add_price" disabled=true id="add_price" class="add_field">` ,
		Number.parseFloat( 0 ).toFixed( 2 )
	]

	if ( stateObj[ route ].hasOwnProperty( "data" ) ) { 
		if ( stateObj[ route ].data.length > 0 ) {
			for (var i = stateObj[ route ].data.length - 1; i >= 0; i--) {
				add_entry( stateObj[ route ].data[ i ] , null )
			}
		}
	}

	if ( route != "collect_tx" ) { add_entry( table_add_row , "add_row" ) }



}
//#4.3 Table Components

//#4.4 Button Components
function search_button() {
	let route = window.location.pathname.split( "/" )[ 1 ]
	let search_button = { id : "search_button" , node_type : "button" }

	if ( route == "load_tx" ) {
		search_button.parent = document.querySelector( "#search_container" )
		search_button.class = [ "search_form_label" ]
		search_button.innerHTML = "Search Transaction"
		search_button.attribs = { onclick : "search_tx()" }
	}

	if ( route == "collect_tx" ) {
		search_button.parent = document.querySelector( "#collect_params_container" )
		search_button.class = [ "search_form_label" , "form_container" ]
		search_button.innerHTML = "Compile Transactions"
		search_button.attribs = { onclick : "query_txs()" }
	}

	node_creator( search_button )
}

function save_button() {
	let route = window.location.pathname.split( "/" )[ 1 ]
	let save_button = {
		id : "save_button" , 
		attribs : { onclick : "save_tx()" } ,
		node_type : "button" , innerHTML : "Save" , parent : document.querySelector( "#controls_container" )
	}
	if ( route == "load_tx" ) {
		save_button.attribs.onclick = "overwrite_tx()"
		save_button.innerHTML = "Overwrite"
	}

	node_creator( save_button )
}

function print_button() {
	let print_button = {
		id : "print_button" ,
		attribs : { onclick : "window.print()" } ,
		node_type : "button" , innerHTML : "Print" , parent : document.querySelector( "#controls_container" ) 
	}
	node_creator( print_button )
}

function reset_button() {
	let route = window.location.pathname.split( "/" )[ 1 ]
	let reset_button = {
		id : "reset_button" ,
		attribs : { onclick : "reset_tx()" } ,
		node_type : "button" , innerHTML : "Reset" , parent : document.querySelector( "#controls_container" ) 
	}

	if ( route == "load_tx" || route == "collect_tx" ) {
		reset_button.innerHTML = "Close"
	}

	node_creator( reset_button )
}

function collect_button() {
	let collect_button = {
		id : "collect_button" ,
		attribs : { onclick : "move_txs()" } ,
		node_type : "button" , innerHTML : "Mark Collected" , parent : document.querySelector( "#controls_container" )
	}
}
//#4.4 Button Components

//#4.5 Generic Components
function generic_container( modifier ) {

	let class_array = []
	let to_push = ( modifier.horizontal == true ) ? "horizontal_container" : "vertical_container"

	if ( modifier.hasOwnProperty( "class" ) ) { class_array = modifier.class }

	class_array.push( to_push )

	if ( modifier.centered == true ) { class_array.push( "center_container" ) }

	let generic_container = {
		id : modifier.id ,
		class : class_array , node_type : "div" , parent : modifier.parent
	}
	node_creator( generic_container )
}

function generic_label( modifier ) {
	let generic_label = {
		id : modifier.id ,
		node_type : "div" , innerHTML : modifier.innerHTML , parent : modifier.parent
	}

	if ( modifier.hasOwnProperty( "class" ) ) {
		generic_label.class = modifier.class
	}

	node_creator( generic_label )
}
//#4.4 Generic Components

//#4 Components
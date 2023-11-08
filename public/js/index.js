document.addEventListener( 'htmx:afterRequest' , ( e ) => {

	if ( e.detail.failed ) {
		alert( JSON.parse( e.detail.xhr.response ).message )
		return
	}

	if ( e.detail.target.id == "tx_no" ) {
		let new_res = JSON.parse( e.detail.xhr.response )
		state_handler( { op : "update_ui" , target_ids : [ "tx_no" , "tx_owner" ] , target_vals : [ new_res.tx_id , e.detail.elt.value ] } )
		document.title = e.detail.elt.value
	}
})

document.addEventListener( 'htmx:afterSwap' , ( e ) => {

	let route = window.location.pathname.split( "/" )[ 1 ]

	if ( e.detail.target.id == "query_results" ) {
		state_handler( { op : "read" , route : route } )
		document.title = stateObj[ route ].tx_owner
		if ( route == "collect_tx" ) { document.querySelector( "#double_print" ).parentNode.style.display = "none" }
	}
})

window.addEventListener( 'beforeprint' , ( e ) => {
	let route = window.location.pathname.split( "/" )[ 1 ]

	if ( document.querySelector( "#double_print" ).checked ) {
		let clone = document.querySelector( "#content_container" ).cloneNode( true )
		let margin_bottom = ( 20-stateObj[route].data.length ) * 19

		if ( margin_bottom < 0 ) { margin_bottom = 0 }

		clone.id = "cloned_content_container"
		clone.style.marginTop = "10px"
		clone.querySelector( "#routes" ).outerHTML = ""

		document.querySelector( "table" ).style.marginBottom = `${ margin_bottom }px`
		clone.querySelector( "table" ).style.marginBottom = `${ margin_bottom }px`

		document.querySelector( "#content_container" ).appendChild( clone )
	}
})

window.addEventListener( 'afterprint' , ( e ) => {
	if ( document.querySelector( "#double_print" ).checked ) {
		let clone = document.querySelector( "#cloned_content_container" )
		document.querySelector( "table" ).style.marginBottom = `0px`
		document.querySelector( "#content_container" ).removeChild( clone )
	}
})

document.addEventListener( 'readystatechange' , async ( e ) => {

let test_obj = {
	active : false ,
	route : "make_tx"
}

	if( e.target.readyState === "interactive" ) {

		fetch( '/fetch_customers' ).then( res => {
			res.json().then( json => {
				for ( customer in json.customers ) {
					let option = document.createElement( 'option' )
					option.value = json.customers[ customer ]
					option.innerHTML = json.customers[ customer ]
					document.querySelector( "#customers" ).appendChild( option )
				}
			})
		})

		for (item in items) {
			let option = document.createElement( 'option' )
			option.innerHTML = item
			document.querySelector( "#items" ).appendChild( option )
		}


	} else if ( e.target.readyState === "complete" ) {

		let route = window.location.pathname.split( "/" )[ 1 ]

		if ( (route != "") ) {

			if ( route == "make_tx" || ( test_obj.active && test_obj.route == "make_tx" ) ) {

				if ( stateObj[ route ].tx_owner != "" ) { document.title = stateObj[ route ].tx_owner }

				header( { target : document.querySelector( "#content_container" ) , route : route } )
				htmx.process( document.querySelector( "#tx_owner" ) )

				table( { target : document.querySelector( "#content_container" ) , route : route } )

				footer( { target : document.querySelector( "#content_container" ) , route : route } )

				controls( { target : document.querySelector( "#content_container" ) , route : route } )

			} else if ( 
				route == "load_tx" || ( test_obj.active && test_obj.route == "load_tx" ) ||
				route == "collect_tx" || ( test_obj.active && test_obj.route == "collect_tx" ) ||
				route == "archives" || ( test_obj.active && test_obj.route == "archives" )
			) {

				forms( { target : document.querySelector( "#content_container" ) , route : route } )
				htmx.process( document.querySelector( "#query_form" ) )

				if ( stateObj[ route ].data.length != 0 ) {
					let res_id = "#query_results"

					document.title = stateObj[ route ].tx_owner

					header( { target : document.querySelector( res_id ) , route : route } )

					table( { target : document.querySelector( res_id ) , route : route } )

					footer( { target : document.querySelector( res_id ) , route : route } )

					controls( { target : document.querySelector( res_id ) , route : route } )
				}
			} 
		}
	}
})
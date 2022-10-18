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
			option.value = `{ "name" : "${item}" , "code" : "${items[ item ].Code}" }`
			option.innerHTML = item
			document.querySelector( "#items" ).appendChild( option )
		}


	} else if ( e.target.readyState === "complete" ) {

		let route = window.location.pathname.split( "/" )[ 1 ]

		if ( (route != "") ) {

			if ( route == "make_tx" || ( test_obj.active && test_obj.route == "make_tx" ) ) {

				header()
					title()
					generic_container( { id : "header_details_container" , horizontal : true , parent : document.querySelector( "#header" ) } )
						generic_container( 
							{ id : "name_input_container" , horizontal : true , parent : document.querySelector( "#header_details_container" ) } 
						)
							generic_label(
								{ 
									id : "name_label" , innerHTML : "Customer Name :&nbsp" , 
									parent : document.querySelector( "#name_input_container" ) 
								}
							)
							name_field()
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

			} else if ( route == "load_tx" || ( test_obj.active && test_obj.route == "load_tx" ) ) {

				header()
					generic_container( 
						{ id : "search_container" , horizontal : false , centered : true , parent : document.querySelector( "#search_header" ) } 
					)
						generic_container(
							{ 
								id : "tx_no_container" , horizontal : true , centered : true , 
								class : [ "form_container" ] ,
								parent : document.querySelector( "#search_container" ) 
							}
						)
							generic_label(
								{ 
									id : "tx_no_label" , innerHTML : "Transaction No:&nbsp;" , 
									class : [ "form_label" ] , parent : document.querySelector( "#tx_no_container" ) 
								}
							)
							tx_no_field()
						generic_container( 
							{ 
								id : "tx_owner_container" , horizontal : true , centered : true , 
								class : [ "form_container" ] ,
								parent : document.querySelector( "#search_container" ) 
							} 
						)
							generic_label(
								{ 
									id : "tx_owner_label" , innerHTML : "Owner:&nbsp;" , 
									class : [ "form_label" ] , parent : document.querySelector( "#tx_owner_container" ) 
								}
							)
							tx_owner_field()
						search_button()

			} else if ( route == "collect_tx" || ( test_obj.active && test_obj.route == "collect_tx" ) ) {

				header()
					generic_container(
						{ 
							id : "collect_params_container" , horizontal : false , centered : true , 
							parent : document.querySelector( "#search_header" ) 
						} 
					)
						generic_container( 
							{ 
								id : "tx_owner_container" , horizontal : true , centered : true , 
								class : [ "form_container" ] ,
								parent : document.querySelector( "#collect_params_container" ) 
							}
						)
							generic_label(
								{ 
									id : "tx_owner_label" , innerHTML : "Owner:&nbsp;" , 
									class : [ "form_label" ] , parent : document.querySelector( "#tx_owner_container" ) 
								}
							)
							tx_owner_field()
						search_button()
						

			}

		}

	}

})
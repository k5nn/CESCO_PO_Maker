const express = require('express')
const fs = require('fs');
const readline = require('readline');
const { networkInterfaces } = require('os');
const { google } = require('googleapis');
const HTMLParser = require('node-html-parser');

const nets = networkInterfaces();
const app = express()
const network_info = {}
const port = 5000

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const BASE_DIR = '/home/kennedy/Projects/DEV_po_maker'
const PROD_DIR = '/data/data/com.termux/files/home/CESCO_PO_Maker'
const BACKUP_PATH = ''
const ACTIVE_DIR = `${BASE_DIR}/public/data/Active`
const COLLECT_DIR = `${BASE_DIR}/public/data/Collected`
const RWTOKEN_PATH = `${BASE_DIR}/src/token_rw.json`
const ROTOKEN_PATH = `${BASE_DIR}/src/token_ro.json`
const CREDENTIALS_PATH = `${BASE_DIR}/src/credentials.json`

let refresh_token = ""
let oauth_client = {}
let oauth_url = ""
let cred = {}

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true }))

//system
for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
            if (!network_info[name]) {
                network_info[name] = [];
            }
            network_info[name].push(net.address);
        }
    }
}
//system

//app
app.get( '/fetch_customers' , ( req , res ) => {
  fs.readdir(  `${ACTIVE_DIR}` , ( err , dirdata ) => {
    res.status( 200 ).json( { customers : dirdata } )
  })
})

app.post( '/price' , ( req , res ) => {

  fs.readFile( RWTOKEN_PATH , async ( err , content ) => {

    if ( err ) return res.status( 500 ).json( { message : "auth error" } )

    oauth_client.setCredentials( JSON.parse( content ) )

    const sheets = google.sheets({version: 'v4', oauth_client});
    const config = {
      auth : oauth_client ,
      spreadsheetId : req.body.SheetID ,
      range: req.body.Range
    }

    sheets.spreadsheets.values.get( config , ( err , oauth_res ) => {
      if (err) {
        console.log('The API returned an error: ' + err)
        return res.status( 500 ).json( { message : "API error" } )
      }

      const rows = oauth_res.data.values
      const keys = rows[ 0 ]
      let retobj = new Object()

      for (row in rows) {
        let vals = rows[ row ]
        if ( vals[ 0 ] === req.body.Code) {
          for (val in vals) { retobj[ keys[ val ] ] = vals[ val ] }
          return res.status( 200 ).json( retobj )
        }
      }
    })
  })
})

app.post( '/get_tx_number' , ( req , res ) => {

  let body = req.body
  let dest_dir = `${ACTIVE_DIR}/${body.Customer}`

  fs.exists( dest_dir , ( err ) => {

    if ( err == false ) return res.status( 200 ).json( { tx_id : 1 } )

    fs.readdir( dest_dir , ( err , files ) => {
      return res.status( 200 ).json( ( files.length == 0 ) ? { tx_id : 1 } : { tx_id : files.length + 1 } )
    })
  })
})

app.post( '/fetch_tx' , ( req , res ) => {
  fs.readdir( `${ACTIVE_DIR}/${req.body.owner}` , ( err , dirdata ) => {

    if ( err ) return res.status( 404 ).json( { message : "Error Record Does Not Exist" } )

    let regexp1 = new RegExp( `^${req.body.number}_.*json` )
    let regexp2 = new RegExp( `^${req.body.number}.*json` )
    let file_name = ""
    
    for (file of dirdata) {
      if ( regexp1.test( file ) || regexp2.test( file ) ) {
        file_name = file
        break
      }
    }

    if ( file_name == "" ) return res.status( 404 ).json( { message : "Error Transaction Does Not Exist" } )

    fs.readFile( `${ACTIVE_DIR}/${req.body.owner}/${file_name}` , ( err , content ) => {
      try {
        let json = JSON.parse( content )
        let datalists = ""
        let ret = 
        `
        <div id="header">
          <div id="title">Transaction No : <span id="tx_no">${json.tx_no}</span></div>
          <div class="horizontal_container">
            <div>Customer Name : <span id="tx_owner">${json.tx_owner}</span></div>
            <div>Date : <span id="tx_date">${json.tx_date}</span></div>
          </div>
        </div>

        <table>
          <thead id="tx_table_header">
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
          <tbody id="tx_table_body">
            <tr id="add_row">
              <td><button onclick=add_entry()>➕</button></td>
              <td><input type="number" onchange=change_price() value=""></td>
              <td><input type="text" onchange=add_unit() value=""></td>
              <td><input list="items" onchange=add_item() value=""></td>
              <td><input type="number" onchange=change_price() value="" disabled></td>
              <td><input list="prices" onchange=change_price() value="" disabled></td>
              <td id="add_total">0.00</td>
            </tr>
        `

        for( entry of json.data ) {
          ret +=`<tr>${entry[ 0 ]}${entry[ 1 ]}${entry[ 2 ]}${entry[ 3 ]}${entry[ 4 ]}${entry[ 5 ]}${entry[ 6 ]}</tr>`
          if ( entry.hasOwnProperty( "list" ) ) { datalists += `${entry.list}` }
        }

        ret += `</tbody>
        </table>

        <div id="footer">
          <div><span id="item_cnt">${json.data.length}</span> Items</div>
          <div>Received : ____________________</div>
          <div>Grand Total : <span id="tx_total"></span></div>
        </div>

        <div id="controls" class="hidden_print">
          <button onclick=save_tx()>Save</button>
          <div>
            <div>
              <input type="checkbox" id="double_print">
              <label for="double_print">Double Print</label>
            </div>
            <button onclick=send_print()>Print</button>
          </div>
          <button onclick=reset_tx()>Reset</button>
        </div>

        ${datalists}
        `

        res.setHeader( 'content-type' , 'text/html' )
        return res.status( 200 ).send( ret )
      } catch ( e ) {
        return res.status( 500 ).json( { message : `${file_name} invalid json` } )
      }
    })
  })
})

app.post( '/save_tx' , ( req , res ) => {
  let body = req.body
  let dest_dir = `${ACTIVE_DIR}/${body.tx_owner}/`
  let date_arr = body.tx_date.split( "/" )

  date_arr[ 1 ] = ( date_arr[ 1 ].length == 2 ) ? date_arr[ 1 ] : `0${date_arr[ 1 ]}`
  date_arr[ 0 ] = ( date_arr[ 0 ].length == 2 ) ? date_arr[ 0 ] : `0${date_arr[ 0 ]}`

  let filename_date = `${date_arr[ 2 ]}${date_arr[ 0 ]}${date_arr[ 1 ]}`

  fs.exists( dest_dir , ( err ) => {

    if (err == false) {
      console.log( "here" )
      fs.mkdir( dest_dir , ( err ) => {
        if ( err == false ) return res.status( 500 ).json( { message : `CREATION FAILED : ${dest_dir}` } )
      })
    }

    fs.writeFile( dest_dir + `${body.tx_no}_${filename_date}.json` , JSON.stringify( body , null , "\t" ) , ( err ) => {
      return res.status( 200 ).json( { message : 'Transaction Saved' } )
    })
  })
})

app.post( '/overwrite_tx' , ( req , res ) => {
  fs.readdir( `${ACTIVE_DIR}/${req.body.owner}` , ( err , dirdata ) => {

    let regexp = new RegExp( `^${req.body.number}_*` )
    let file_name = ""
    let dest_dir = `${ACTIVE_DIR}/${req.body.owner}/`
    
    for (file of dirdata) {
      if ( regexp.test( file ) ) {
        file_name = file
        break
      }
    }

    if ( file_name == "" ) return res.status( 404 ).json( { message : "Error Transaction Does Not Exist" } )

    fs.writeFile( dest_dir + `${file_name}` , JSON.stringify( req.body.data , null , "\t" ) , ( err ) => {
      return res.status( 200 ).json( { message : 'Transaction Overwritten' } )
    })
  })
})

app.post( '/retrieve_records' , ( req , res ) => {

  let data_dir = `${ACTIVE_DIR}/${req.body.owner}`
  let unsorted_data = []
  let sorted_data = []
  let today = new Date()
  let tommorrow = new Date( today.setDate( today.getDate() + 1 ) ).toLocaleDateString( "PH" )
  let gt = 0.00

  fs.stat( data_dir , ( err , stats ) => {

    if ( err ) return res.status( 400 ).json( { message : `${req.body.owner} Does not have records` } )

    fs.readdir( data_dir , ( err , files ) => {

      if ( files.length == 0 ) return res.status( 400 ).json( { message : `No Records` } )

      for (file in files) {

        let current_file = files[ file ]
        let invalid_flag = false

        fs.readFile( `${data_dir}/${current_file}` , ( err , data ) => {

          if ( err ) { return res.status( 400 ).json( { message : `${data_dir}/${current_file} Cannot Be Read` } ) }

          try {
            unsorted_data.push( JSON.parse( data.toString() ) )
          } catch {
            return res.status( 500 ).json( { message : `${data_dir}/${current_file} is invalid` } )
          }

          if ( unsorted_data.length == files.length ) {
            let ret = `
            <div id="header">
              <div id="title">Counter Receipt</div>
              <div class="horizontal_container">
                <div>Customer Name : <span id="tx_owner">${req.body.owner}</span></div>
                <div>Date : <span id="tx_date">${tommorrow}</span></div>
              </div>
            </div>

            <table>
              <thead id="tx_table_header">
                <tr>
                  <th>Transaction No</th>
                  <th>Date</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody id="tx_table_body">`
            
            for (var i = 0; i <= unsorted_data.length; i++) {
              for( data of unsorted_data ) {
                if ( data.tx_no == i ) {
                  ret += `<tr><td>${data.tx_no}</td><td>${data.tx_date}</td><td>${data.tx_total}</td></tr>`
                  gt += parseFloat( data.tx_total )
                }
              }
            }

            ret += `</tbody>
            </table>

            <div id="footer">
              <div>Received : ____________________</div>
              <div>Grand Total : <span id="tx_total"></span></div>
            </div>

            <div id="controls" class="hidden_print">
              <div>
                <div>
                  <input type="checkbox" id="double_print" checked>
                  <label for="double_print">Double Print</label>
                </div>
                <button onclick=send_print()>Print</button>
              </div>
              <button onclick=reset_tx()>Reset</button>
            </div>
            `

            res.setHeader( 'content-type' , 'text/html' )
            return res.status( 200 ).send( ret )
          }
        })
      }
    })
  })
})

app.post( '/retrieve_archives' , ( req , res ) => {

  const start_date = new Date( req.body.from_date )
  const to_date = new Date( req.body.to_date )
  let data_dir = `${COLLECT_DIR}/${req.body.owner}`
  let date = new Date( start_date.getTime() )
  let date_arr = []
  let tbody = ""
  let hit_ctr = 0

  if ( req.body.owner == "" ) { res.status( 400 ).send( { message : `Query has no Customer Name` } ) }

  if ( req.body.item == "" ) { res.status( 400 ).send( { message : `Query has no Item Name` } ) }

  while( date <= to_date ) {
    date_arr.push( new Date( date ).toISOString().split( "T" )[ 0 ] )
    date.setDate( date.getDate() + 1 )
  }

    fs.stat( data_dir , ( err , stat ) => {

      if ( err ) return res.status( 400 ).send( { message : `${req.body.owner} has no archive records` } )

      fs.readdir( data_dir , ( err , files ) => {
        
        if ( files.length == 0 ) return res.status( 400 ).send( { message : `${req.body.owner} has no archive records` } )

        for (var i = 0; i < date_arr.length; i++) {
          let ymd_arr = date_arr[ i ].split( "-" )

          ymd_arr[ 1 ] = ( ymd_arr[ 1 ].length == 2 ) ? ymd_arr[ 1 ] : `0${ymd_arr[ 1 ]}`
          ymd_arr[ 2 ] = ( ymd_arr[ 2 ].length == 2 ) ? ymd_arr[ 2 ] : `0${ymd_arr[ 2 ]}`

          let regexp = new RegExp( `\\d+_${ymd_arr[0]}${ymd_arr[1]}${ymd_arr[2]}.*json` )

          for (var j = 0; j < files.length; j++) {

            if ( regexp.test( files[ j ] ) ) {

              let file_str = fs.readFileSync( `${data_dir}/${files[ j ]}` , 'utf-8' )
              let item_regex = new RegExp( `${req.body.item}` , "i" )

              if ( item_regex.test( file_str ) ) {

                let json_data = JSON.parse( file_str )

                for (data of json_data.data) {
                    
                    let qty_td = HTMLParser.parse( data[ 1 ] )
                    let item_td = HTMLParser.parse( data[ 3 ] )
                    let rate_td = HTMLParser.parse( data[ 4 ] )
                    let base_td = HTMLParser.parse( data[ 5 ] )

                    if ( item_regex.test( item_td.firstChild.firstChild.getAttribute( "value" ) ) ) {
                      let qty = `<td>${qty_td.firstChild.firstChild.getAttribute( "value" )}</td>`
                      let item = `<td>${item_td.firstChild.firstChild.getAttribute( "value" )}</td>`
                      let rate = `<td>${rate_td.firstChild.firstChild.getAttribute( "value" )}</td>`
                      let base = `<td>${base_td.firstChild.firstChild.getAttribute( "value" )}</td>`
                      tbody += `<tr><td>${json_data.tx_no}</td><td>${json_data.tx_date}</td>${qty}${item}${rate}${base}</tr>`
                      hit_ctr++
                    }
                }
              }
            }

            if ( i+1 >= date_arr.length && j+1 >= files.length ) {

              if ( hit_ctr <= 0 ) return res.status( 400 ).send( { message : `No ${req.body.item} purchases found` } )

              let ret = `
                <div id="header">
                  <div id="title">
                    <span id="tx_owner">${req.body.owner}</span> bought ${req.body.item} from ${req.body.from_date} to ${req.body.to_date}
                  </div>
                  <div class="horizontal_container">
                    <div>Showing ${hit_ctr} results</div>
                  </div>
                </div>

                <table>
                  <thead id="tx_table_header">
                    <tr>
                      <th>Tx No</th>
                      <th>Date</th>
                      <th>Qty</th>
                      <th>Item</th>
                      <th>Rate</th>
                      <th>Base</th>
                    </tr>
                  </thead>
                  <tbody id="tx_table_body">${tbody}</tbody>
                </table>

                <div id="controls">
                  <button onclick="reset_tx()">Reset</button>
                </div>
                `
              return res.status( 200 ).send( ret )
            }
          }
        }
      })
    })
})

app.get('/', async (req, res) => {

  fs.readFile( RWTOKEN_PATH , ( err , content ) => {

    if ( err ) return res.redirect( oauth_url )

    oauth_client.setCredentials( JSON.parse( content ) )
    res.sendFile( BASE_DIR + '/index.html' )

  })

});

app.get( '/auth' , async ( req , res ) => {
  
  let { tokens } = await oauth_client.getToken( req.query.code )

  if ( ! tokens.hasOwnProperty( "refresh_token" ) ) tokens.refresh_token = refresh_token 

  oauth_client.setCredentials( tokens )

  fs.exists( ROTOKEN_PATH , ( exists ) => {
    if ( exists == false ) {
      fs.writeFile( ROTOKEN_PATH , JSON.stringify( tokens ) , ( err ) => {
        if (err) return console.error( err )
        console.log( `RO Token stored ${ROTOKEN_PATH}` )
      })
    }
  })

  fs.writeFile( RWTOKEN_PATH , JSON.stringify( tokens ) , ( err ) => {
    if (err) return console.error( err );
    console.log( `RW Token stored ${RWTOKEN_PATH}` );
    res.sendFile( BASE_DIR + '/index.html' )
  });

})

app.get( '/public/js/*' , ( req , res ) => {
  res.sendFile( BASE_DIR + req.path )
})

app.get( '/public/css/*' , ( req , res ) => {
  res.sendFile( BASE_DIR + req.path )
})

app.get( '/*' , (req , res) => {
  res.sendFile( BASE_DIR + '/index.html' )
})
//app

fs.exists( ROTOKEN_PATH , ( exists ) => {
  if ( exists ) {
    fs.readFile( ROTOKEN_PATH , ( err , content ) => {
        if ( err ) return
        refresh_token = JSON.parse( content ).refresh_token
      })
  }
})

fs.readFile( CREDENTIALS_PATH , ( err , content ) => {

  if ( err ) process.exit( 1 )

  cred = JSON.parse( content )

  oauth_client = new google.auth.OAuth2(cred.web.client_id , cred.web.client_secret , cred.web.redirect_uris[1])

  oauth_url = oauth_client.generateAuthUrl(
    { 
      access_type: 'offline',
      scope: SCOPES ,
      include_granted_scopes: true 
    }
  )

  app.listen( port, "0.0.0.0" , () => {

    console.log( `Listing on the ff
      ` )
    for( interface in network_info ) {
      console.log( `${network_info[ interface ][ 0 ]}:${port}` )
    }
    console.log( `
    command to state : node index
    command to stop : Ctrl + C` )
  })
  
});

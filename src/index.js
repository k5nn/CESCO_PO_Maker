const express = require('express')
const fs = require('fs');
const readline = require('readline');
const { networkInterfaces } = require('os');
const { google } = require('googleapis');

const nets = networkInterfaces();
const app = express()
const network_info = {}
const port = 5000

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const PROD_BASE_DIR = '/data/data/com.termux/files/home/CESCO_PO_Maker'
const DEV_BASE_DIR = '/data/data/com.termux/files/home/staging/CESCO_PO_Maker'
// const BASE_DIR = '/data/data/com.termux/files/home/CESCO_PO_Maker'
const BASE_DIR = '/home/kennedy/Projects/DEV_po_maker'
const BACKUP_PATH = ''
const ACTIVE_DIR = `${BASE_DIR}/public/data/Active`
const TOKEN_PATH = `${BASE_DIR}/src/token.json`;

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

//oAuth
function authorize(credentials, callback) {
	  const {client_secret, client_id, redirect_uris} = credentials.installed;
	  const oAuth2Client = new google.auth.OAuth2(
	      client_id, client_secret, redirect_uris[0]);

	  // Check if we have previously stored a token.
	  fs.readFile(TOKEN_PATH, (err, token) => {
	    if (err) return getNewToken(oAuth2Client, callback);
	    oAuth2Client.setCredentials(JSON.parse(token));
	    callback(oAuth2Client);
	  });
	}

function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES ,
    include_granted_scopes: true
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}
//oAuth

//app
app.get( '/fetch_customers' , ( req , res ) => {
  fs.readdir(  `${ACTIVE_DIR}` , ( err , dirdata ) => {
    res.status( 200 ).json( { customers : dirdata } )
  })
})

app.post( '/price' , ( req , res ) => {
  fs.readFile(`${BASE_DIR}/src/credentials.json`, (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);

    authorize( JSON.parse( content ) , auth => {

      const sheets = google.sheets({version: 'v4', auth});
      const config = {
        spreadsheetId : req.body.SheetID ,
        range: req.body.Range
      }

      sheets.spreadsheets.values.get( config , ( err , oauth_res ) => {
        if (err) {
          console.log('The API returned an error: ' + err)
          return res.status( 500 ).json( { "Error" : err } )
        }

        const rows = oauth_res.data.values
        const keys = rows[ 0 ]
        let retobj = new Object()

        for (row in rows) {

          let vals = rows[ row ]

          if ( vals[ 0 ] === req.body.Code) {

            for (val in vals) { retobj[ keys[ val ] ] = vals[ val ] }

            res.status( 200 ).json( retobj )

            break
            
          }
        }

      })
    })
  })
})

app.post( '/get_tx_number' , ( req , res ) => {

  let body = req.body
  let dest_dir = `${ACTIVE_DIR}/${body.Customer}`

  fs.exists( dest_dir , ( err ) => {

    if ( err == false ) {
      res.status( 200 ).json( { tx_id : 1 } )
    } else {
      fs.readdir( dest_dir , ( err , files ) => {

        let resp_obj = ( files.length == 0 ) ? { tx_id : 1 } : { tx_id : files.length + 1 }

        res.status( 200 ).json( resp_obj )

      })
    }

  })

})

app.post( '/fetch_tx' , ( req , res ) => {
  fs.readdir( `${ACTIVE_DIR}/${req.body.owner}` , ( err , dirdata ) => {

    if ( err ) {
      res.status( 404 ).json( { message : "Error Record Does Not Exist" } )
      return
    }

    let regexp = new RegExp( `^${req.body.number}_.*json` )
    let file_name = ""
    
    for (file of dirdata) {

      if ( regexp.test( file ) ) {
        file_name = file
        break
      }
    }

    if (file_name == "") {
      res.status( 404 ).json( { message : "Error Transaction Does Not Exist" } )
    } else {
      fs.readFile( `${ACTIVE_DIR}/${req.body.owner}/${file_name}` , ( err , content ) => {
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
          <div>Grand Total : <span id="tx_total">${json.tx_total}</span></div>
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
        res.status( 200 ).send( ret )
      })
    }
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
      fs.mkdir( dest_dir , ( err ) => {

        if ( err == false ) {
          res.status( 500 ).json( { message : `CREATION FAILED : ${dest_dir}` } )
        }

      })
    }

    fs.writeFile( dest_dir + `${body.tx_no}_${filename_date}.json` , JSON.stringify( body , null , "\t" ) , ( err ) => {

      res.status( 200 ).json( { message : 'Transaction Saved' } )

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

    if (file_name == "") {
      res.status( 404 ).json( { message : "Error Transaction Does Not Exist" } )
    } else {
      fs.writeFile( dest_dir + `${file_name}` , JSON.stringify( req.body.data , null , "\t" ) , ( err ) => {
        res.status( 200 ).json( { message : 'Transaction Overwritten' } )
      })
    }
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

    if ( err ) {
      res.status( 400 ).json( { message : `${req.body.owner} Does not have records` } )
    }

    fs.readdir( data_dir , async ( err , files ) => {

      if ( files.length == 0 ) {
        res.status( 400 ).json( { message : `No Records` } )
        return
      }

      for (file in files) {

        let current_file = files[ file ]
        let invalid_flag = false

        fs.readFile( `${data_dir}/${current_file}` , ( err , data ) => {

          if ( err ) { res.status( 400 ).json( { message : `${data_dir}/${current_file} Cannot Be Read` } ) }

          let ret = ""

          try {
            unsorted_data.push( JSON.parse( data.toString() ) )
          } catch {
            res.status( 500 ).json( { message : `${data_dir}/${current_file} is invalid` } )
            return
          }

          if ( unsorted_data.length == files.length ) {
            ret = `
            <div id="header">
              <div id="title">Counter Receipt</span></div>
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
              <div>Grand Total : <span id="tx_total">${gt.toFixed( 2 )}</span></div>
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
            res.status( 200 ).send( ret )
          }
        })
      }
    })
  })
})

app.get( '/public/js/*' , ( req , res ) => {
  res.sendFile( BASE_DIR + req.path )
})

app.get( '/public/css/*' , ( req , res ) => {
  res.sendFile( BASE_DIR + req.path )
})

// app.get( '/public/css/resetter.css' , ( req , res ) => {
//   res.sendFile( BASE_DIR + '/public/css/resetter.css' )
// })

// app.get( '/public/css/index.css' , ( req , res ) => {
//   res.sendFile( BASE_DIR + '/public/css/index.css' )
// })

// app.get( '/public/js/data.js' , ( req , res ) => {
//   res.sendFile( BASE_DIR + '/public/js/data.js' )
// })

// app.get( '/public/js/index.js' , ( req , res ) => {
//   res.sendFile( BASE_DIR + '/public/js/index.js' )
// })

// app.get( '/public/js/router.js' , ( req , res ) => {
//   res.sendFile( BASE_DIR + '/public/js/router.js' )
// })

// app.get( '/public/js/table_dao.js' , ( req , res ) => {
//   res.sendFile( BASE_DIR + '/public/js/table_dao.js')
// })

// app.get( '/public/js/lib.js' , ( req , res ) => {
//   res.sendFile( BASE_DIR + '/public/js/lib.js' )
// })

app.get( '/*' , (req , res) => {
  res.sendFile( BASE_DIR + '/index.html' )
})

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
//app

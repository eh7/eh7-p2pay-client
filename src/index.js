'use strict'

const config = require('./config')
//const longjohn = require('longjohn')

const domReady = require('detect-dom-ready')
const createNode = require('./create-node')
const messageFormat = require('./messageFormat')
const getCookie = require('./getCookie')
const render = require('./renderHtmlLib')

const pull = require('pull-stream')
const PeerInfo = require('peer-info')
const PeerId   = require('peer-id')
//const TextDecoder = require('TextDecoder')
const multiaddr = require('multiaddr')

const store = require('store')
const bip39 = require('bip39')
const hdkey = require('ethereumjs-wallet/hdkey')
//const ethUtil = require('ethereumjs-util')
const ethUnits = require('ethereumjs-units')
const ethUtil  = require('ethereumjs-util')

const topicDisberseRoutes = 'disberseRoutes'

const EE = require('events').EventEmitter

//IE support
if (!Array.prototype.indexOf) { 
    Array.prototype.indexOf = function(obj, start) {
         for (var i = (start || 0), j = this.length; i < j; i++) {
             if (this[i] === obj) { return i; }
         }
         return -1;
    }
}

let peerMap = []

let phrase

if(!store.get('user')){
  phrase = bip39.generateMnemonic()
  store.set('user', {'bip39':phrase})
} else {
  phrase = store.get('user').bip39;
}
//console.log(phrase)

let myHdWallet = hdkey.fromMasterSeed(phrase)
store.set('address', "0x"+myHdWallet.getWallet().getAddress().toString('hex'))

let userDataFlag = false
let userAuthedFlag = false

let tokenBalances = []
//let currencies = ['GBP','USD','EUR','AUS']

if(window.location.href.search(/^file:\/\//) == 0){
  userAuthedFlag = true 
  console.log("served as local file")
}

const processTxReturn = (message) => {
  const authedDataAddr = '8f3710b597ab69bb9b58191f2f73622d184974ac'
  const dataIn = message.split('::')
  const vrs = dataIn[dataIn.length-1].split(',')
  const data = dataIn[dataIn.length-2]
  const messageSigner = dataIn[1]
  const balanceAddr   = dataIn[3]
  const balance       = dataIn[5]

  const recoveredSignerPubkey = ethUtil.ecrecover(
    Buffer.from(data,'hex'),
    Number(vrs[0]),
    Buffer.from(vrs[1],'hex'),
    Buffer.from(vrs[2],'hex')
  )

  const recoveredSignerAddr = ethUtil.publicToAddress(recoveredSignerPubkey).toString('hex')

  if(recoveredSignerAddr === authedDataAddr 
  && recoveredSignerAddr === messageSigner) {
//    alert(balanceAddr + "\nBalance is: " + ethUnits.convert((balance),'wei', 'eth') + " ETH ")
//    alert(messageSigner + " === " + recoveredSignerAddr + " === " + authedDataAddr)
    const balanceOut = ethUnits.convert(balance,'wei', 'eth')
    const id = 'mainContent-' + 'dashboard'
    const element = document.getElementById(id)
    element.innerHTML = "<h4>My Balances</h4>"//"<p>mainContent-Balances</p>"
    element.innerHTML += `Eth Balance for <b>${balanceAddr}</b> is <b>${balanceOut}</b> Eth<hr>`
    return true 
  } else {
    alert("ecrecover output failed to match authedAddr or messageSigner error")
    return false
  }
}

domReady(() => {
  const overlayDiv = document.getElementById('overlay')
  const myAccountDataDiv = document.getElementById('my-account-data')

  const myPeerDiv = document.getElementById('my-peer')
  const swarmDiv = document.getElementById('swarm')
  const peerMapDiv = document.getElementById('peerMap')

  const topNavDiv = document.getElementById('topNav')
  const topOrgDiv = document.getElementById('topOrg')
  const sideNavDiv = document.getElementById('sideNav')

  const messagesDiv = document.getElementById('messages')
  const messagesInDiv = document.getElementById('messagesIn')
//  const messageRepondentSelect = document.getElementById('messageRepondentSelect')
  const messageTextInput = document.getElementById('messageText')

  createNode(myHdWallet.getWallet().getAddress().toString('hex'), (err, node) => {
    if (err) {
      return console.log('Could not create the Node, check if your browser has WebRTC Support', err)
    }

    let connections = {}
    let connected   = {}
    let nodes = []
    let liveConnections = []
    let messageCount = 0

    node.on('error', (peerInfo) => {
    })

    node.on('peer:discovery', (peerInfo) => {

//      node.dial(peerInfo, () => {})

      const idStr = peerInfo.id.toB58String()

      console.log('Discovered a peer')
      console.log('Discovered: ' + idStr)

      if(idStr === 'QmdiF2cLAE3MtcE7Xw3qR6nk9inFiqUS4tbwQWdAuEByVd') {
        console.log("check connection to bootNode")
        node.dialProtocol(peerInfo, '/message', (err, conn) => {
          if(err) {
            console.log('failed to dial ' + idStr + " -- hangUp connection")
            console.log(err)
            node.hangUp(peerInfo, (err) => {
              console.log(err) 
              connections[idStr] = false
            })
//            alert(err)
//            location.reload()
          }
          else console.log("dialProtocol /message " + idStr + " okay")
        })
//        let sendToPeerId = PeerId.createFromB58String('QmdiF2cLAE3MtcE7Xw3qR6nk9inFiqUS4tbwQWdAuEByVd')
//  console.log(sendToPeerId)
//        PeerInfo.create(sendToPeerId, (err, peerInfo) => {
//        })
      }



//      peerMapDiv.innerHTML += idStr + " - " + connected[idStr] + "<br>"

      if(connected[idStr] === false) {
        peerMapDiv.innerHTML += idStr + " - " + connected[idStr] + "<br>"
        location.reload()
        return
      }

//      if(connections[idStr] && connected[idStr] == true) {
      if(connections[idStr]) {
        console.log("connected already")
//        return
      }
//      peerMapDiv.innerHTML += "1<br>"

      connections[idStr] = true
//      nodes.push(peerInfo)
//      peerMapDiv.innerHTML += nodes.length + "<br>"
     
//console.log(connections)
//console.log(nodes)

      console.log("findPeer: " + JSON.stringify(peerInfo.id))
//      const mh1 = multiaddr('/p2p-circuit/ipfs/' + peerInfo.id.toB58String())
//      node.dial(mh1, (err, conn) => {
//      const mh1 = multiaddr('/p2p-circuit/ipfs/' + peerInfo.id.id)
//      const mh1 = '/p2p-circuit/ipfs/' + peerInfo.id
//      console.log("findPeer: " + mh1)
//      node.dial(mh1, (err, conn) => {
//        console.log("findPeer: (err dial) " + err)
//      })
//      console.log("findPeer: " + mh1)
/*
      node.peerRouting.findPeer(peerInfo.id, (err, peer) => {
//        console.log("findPeer: " + peerInfo.id)
        console.log("findPeer: (err route) " + err)
        console.log("findPeer: (peer) " + JSON.stringify(peer))
        peer.multiaddrs.forEach((ma) => {
          console.log("findPeer: (ma)" + ma.toString())
          node.dial(peer, (err, conn) => {
            console.log("findPeer: (err dial) " + err)
          })
        })
//        console.log(peer)
      })
*/

      node.dial(peerInfo, (err, conn) => {

        let timeToNextDial = 0
        if (err) {
          console.log(err)

          // Prevent immediate connection retries from happening
          timeToNextDial = 60 * 1000
          console.log('Failed to dial:', idStr)

//          peerMapDiv.innerHTML += peerInfo + "<br>"
          
//          node.stop(() => {node.start(() => {console.log('started again')})})
//          node.stop(() => {})
        } 

        if(err) peerMapDiv.innerHTML += err + "<br>"

/*
        node.dialProtocol(peerInfo, '/register', (err, conn) => {
          console.log("/register")
          if(err) 
            console.log(err)
          let message =  node.peerInfo.id.toB58String() + "::" + store.get('address') 
          pull(
            pull.values([message]),
            conn
          )
          console.log("sent '" + message + "' to " + peerInfo.id.toB58String())

          node.dialProtocol(peerInfo, '/peerMap', (err, conn) => {
            console.log("Dialing for latest peerMap")
            if(err)
              console.log(err)
            else {
              peerMap = []
              pull(
                conn,
                pull.map((data) => {
                  peerMap.push(data.toString())
//                  console.log(data.toString())
                  console.log("Dialing for latest peerMap Done\n" + peerMap +"\n")
                
                  let peerMapOut = ''
                  for(let i=0; i<peerMap.length; i++) {
                    let peerId = peerMap[i].substr(0,46)
                    let peerAddr = peerMap[i].substr(46 + 2)
                    if(node.peerInfo.id.toB58String() != peerId){ 
                      peerMapOut += peerMap[i] + "<br>" + peerId + "##" + peerAddr + "<br>"
//                      console.log(node.peerBook)
                    }
                  }
                  peerMapDiv.innerHTML = "peerMap: <br><span style=\"font-family: monospace;\">" + peerMapOut + "</span>" 
                }),
                pull.drain(()=>{})
              )
              console.log("Dialing for latest peerMap Done\n" + peerMap +"\n")
            }
          })
        })
*/

        setTimeout(() => delete connections[idStr], timeToNextDial)
//        setTimeout(() => {}, timeToNextDial)
      })
    })

    node.on('stop', () => {
//      alert("node stopped")
      console.log("node stopped, restarting")
      node.start((err) => {
        if (err) {
          return console.log('WebRTC not supported')
        }
      })
    })

    node.on('peer:connect', (peerInfo) => {

      const idStr = peerInfo.id.toB58String()
//console.log("peer:connect:: " + idStr)

      if(!connected[idStr]) {

        connected[idStr] = true

        console.log('Got connection to: ' + idStr)
//        connections[idStr] = true
        const connDiv = document.createElement('div')
        connDiv.innerHTML = 'Connected to: ' + idStr
        connDiv.id = idStr
        swarmDiv.append(connDiv)

        const connItem = document.createElement('option')
        connItem.innerHTML = idStr
        connItem.id = 'connItem-' + idStr
//        messageRepondentSelect.append(connItem)
        console.log("added option")

        node.pubsub.publish('disberse/info',Buffer.from(store.get('myData').email + "::" + store.get('address')),() => {
        })
/*
        node.pubsub.peers('disberse/info', (error, peers) => {
          if(err) alert(err)
          alert(peers)
        })
*/

      }

    })

    node.on('peer:disconnect', (peerInfo) => {
      const idStr = peerInfo.id.toB58String()
      console.log('Lost connection to: ' + idStr)

//      connected[idStr] = false
     
      if(typeof document.getElementById(idStr) !== 'undefined' && document.getElementById(idStr) !== null)
        document.getElementById(idStr).remove()

      const connId = 'connItem-' + idStr
      if(typeof document.getElementById(connId) !== 'undefined' && document.getElementById(connId) !== null)
        document.getElementById(connId).remove()

//      connected[idStr] = false

//      node.dial(peerInfo, (err, conn) => {
//        if(err) console.log(err)
//        else if(conn) console.log(conn)
//      })
/*
      document.getElementById(idStr).remove()

      const connId = 'connItem-' + idStr
      document.getElementById(connId).remove()

      connected[idStr] = false

/*
      node.dial(peerInfo, (err, conn) => {
        if(err) peerMapDiv.innerHTML += err + "<br>"
        if(conn) peerMapDiv.innerHTML += conn + "<br>"
      })
*/
    })

    if(!store.get('myData'))
      userDataFlag=false
    else if(store.get('myData').org) 
      userDataFlag=true
//alert(userDataFlag)

    console.log("authed Cookie: " + getCookie('authed'))
    console.log("pauthed store: " + store.get('pauthed'))

    if(!userDataFlag) {
      overlayDiv.style.display = "block"
//      myAccountDataDiv.innerHTML += "<h1>Your Personal Data</h1>"
      let data = {}
      data.title = "<h1>Register Your Personal Data</h1>"
      data.inputs = []
      data.inputs.push({id: 'Organisation', type: 'text', name: 'org', value:'',label:'Organisation'})
      data.inputs.push({id: 'Email', type: 'text', name: 'email', value:'',label:'Email'})
      data.inputs.push({id: 'Mobile Phone', type: 'text', name: 'tel', value:'',label:'Mobile Phone'})
      data.inputs.push({id: 'Password', type: 'password', name: 'pass', value:'',label:'Password'})
      data.inputs.push({id: 'Password Check', type: 'password', name: 'passCheck', value:'',label:'Password Check'})
//        data.inputs.push({id: 'submit', type: 'submit', name: '', value:'save',label:'',onclick:'alert(\'save\');return false'})

      data.inputs.push({id: 'submit', type: 'button', name: 'submit', value:'save',label:'',onclick:'return false'})
      data.inputs.push({id: 'import', type: 'button', name: 'import', value:'import',label:'',onclick:'return false'})
//      const submitButton = document.getElementById('submit')
//      alert(submitButton)


      render.personalDataForm(data, myAccountDataDiv)//, store)

//        myAccountDataDiv.style.display = "block"
//alert(userDataFlag)
    } else if(!userAuthedFlag && (getCookie('authed') == false || getCookie('authed') == 'false')) {
      overlayDiv.style.display = "block"
      let data = {}
      data.title = "<h1>Login Form</h1>"
      data.inputs = []
      data.inputs.push({id: 'Password', type: 'password', name: 'pass', value:'',label:'Password'})
      data.inputs.push({id: 'submit', type: 'submit', name: 'submit', value:'login',label:'',onclick:'return false'})
      render.personalLoginForm(data, myAccountDataDiv)//, store)
    } //else {

    render.personalDataFormLink()
    render.sideNav()

    render.allPages(node, myHdWallet, tokenBalances)

/*
    render.dashboardPage(true)
    render.transactionsPage(false)
    render.projectsPage(false)
    render.ratesPage(false)
    render.depositPage(false)
    render.sendPage(false)
    render.redeemPage(false)
*/    

      // reset pharse run
      // store.set('user', {'bip39':''})

/*
        let derivedHDWallet = myHdWallet.derivePath("m/44'/0'/0/1")
        alert(
          derivedHDWallet.getWallet().getAddress().toString('hex') + "\n" +
          derivedHDWallet.getWallet().getPublicKey().toString('hex') + "\n" +
          derivedHDWallet.getWallet().getPrivateKey().toString('hex')
        )
        derivedHDWallet = myHdWallet.derivePath("m/44'/0'/0/2")
        alert(derivedHDWallet.getWallet().getAddress().toString('hex'))
        derivedHDWallet = myHdWallet.derivePath("m/44'/0'/0/3")
        alert(derivedHDWallet.getWallet().getAddress().toString('hex'))
*/

//      console.log('running: node.pubsub.subscribe(\'routes\', console.log)')

      node.start((err) => {
        if (err) {
          return console.log('WebRTC not supported')
        }

//        alert("0x" + store.get('user').address)

        const idStr = node.peerInfo.id.toB58String()

//        const welcomMessage = 'Node is ready. ID: ' + idStr + 'Address:' + store.get('address')

        const idDiv = document
          .createTextNode('Node is ready. ID: ' + idStr + '\naddress: ' + store.get('address'))
        myPeerDiv.append(idDiv)
/*
        const addressDiv = document
          .createElement('div')
        addressDiv.innerHTML = '<br>Address:' + store.get('address') + "<br><input type='submit' id='editPersonalData' value='edit personal data'/>"
        myPeerDiv.append(addressDiv)
        const personalDataA = document.getElementById('editPersonalData')
        personalDataA.addEventListener('click', console.log("pdata a clicked"))
*/
        console.log('Node is listening o/')

        topOrgDiv.innerHTML = store.get('myData').org

//        node.pubsub.subscribe('news',(msg) => console.log(msg.from, msg.data.toString()),() => {node.pubsub.publish('news',Buffer.from('Bird bird bird, bird is the word!'),()=>{console.log('pubsub done')}})

        render.setupThisSubNode(node)

//        node.pubsub.publish('disberse/info',Buffer.from({id:idStr,email:store.get('myData').email,address:store.get('address')}),() => {})

/*
        node.pubsub.subscribe('disberse/info',(msg) => console.log("PubSub Message", "\nmessageForm: " ,msg.from, "\nmessage: ", msg.data.toString()),() => {
          render.setThisSubNode(node)
          node.pubsub.publish('disberse/info',Buffer.from('This is the disberse/info room'),() => {})
        })
*/

/*
        const myData = store.get('myData')
        const my_header_info = myData.email + " (" + store.get('address') + ")"
        topNavDiv.innerHTML = my_header_info + " " 

        const editLinkA = document
          .createElement('a')
        editLinkA.innerHTML = "edit my data"
        editLinkA.setAttribute('href', '#')
        editLinkA.addEventListener('click', render.personalDataFormEdit, false)
        topNavDiv.appendChild(editLinkA)
*/
//        render.personalDataForm(data, myAccountDataDiv)//, store)


/*
        const receiveMsg = (msg) => console.log(msg.data.toString())
        node.pubsub.subscribe(topicDisberseRoutes, receiveMsg, (err) => {
          if (err) {
            return console.error(`failed to subscribe to ${topicDisberseRoutes}`, err)
          }
          console.log(`subscribed to ${topicDisberseRoutes}`)
        })


        const msg = Buffer("newDisbersePeer::" + idStr)
        node.pubsub.publish(topicDisberseRoutes, msg, (err) => {
          if (err) {
            return console.error(`failed to publish to ${topicDisberseRoutes}`, err)
          }
          // msg was broadcasted
          console.log(`published to ${topicDisberseRoutes}`)

          node.pubsub.peers(topicDisberseRoutes,  (err, subPeers) => {
            console.log("subscribed Peer:")
            console.log(err)
            console.log(subPeers)
          })
        })
*/
 
        // NOTE: to stop the node
        // node.stop((err) => {})
      })
//    }


    node.handle('/disberse/txBalances', (protocol, conn) => {
//alert("received /disberse/txBalances")
      let i = 0
      tokenBalances = []
      pull(
        conn,
        pull.map((v) => {
          console.log(v)
          console.log(v.toString())
          tokenBalances[i] = v.toString()
          const id = 'mainContent-' + 'dashboard'
          const element = document.getElementById(id)
          element.innerHTML += `type ${i} Balance is <b>${v.toString()}</b> ${config.currencies[i]} <hr>`
          if(i == 3)
             console.log(tokenBalances)
          i++

//          const dataIn = message.split('::')
//          v.toString()
//          alert("txReturn\n" + ethUnits.convert(Number(v.toString()),'wei', 'eth'))
//          alert("txReturn\n" + v.toString())
//          processTxReturn(v.toString())
        }),
/*
        pull.collect(function (err, ary) {
          alert(123)
        }),
*/
        pull.log()
      )
    })

    node.handle('/disberse/txReturn', (protocol, conn) => {

      pull(
        conn,
//        pull.map((v) => v.toString()),
        pull.map((v) => {
//          v.toString()
//          alert("txReturn\n" + ethUnits.convert(Number(v.toString()),'wei', 'eth'))
//          alert("txReturn\n" + v.toString())
          processTxReturn(v.toString())
        }),
//        pull.collect(function (data) { console.log(data) })
        pull.log()
      )
    })

    node.handle('/disberse/peer/0.0.0', (protocol, conn) => {
      pull(
        conn,
        pull.map((v) => v.toString()),
        pull.log()
      )
    })

    node.handle('/peerMap', (protocol, conn) => {
      console.log("/peerMap recieve latest peerMap from caller")
    })

    node.handle('/message', (protocol, conn) => {

      pull(
        conn,
        pull.map((data) => {
          var string = new TextDecoder("utf-8").decode(data)
          conn.getPeerInfo((err, peerInfo) => {

            const idStr = peerInfo.id.toB58String()

            messageFormat(messagesDiv, "in-" + idStr, string)

            messageCount++

            //window.scrollTo(0,document.body.scrollHeight)

            console.log("handle message in")
          })
          console.log(string)
        }),
        pull.drain(()=>{})
      )
    })


/*
    // ("add messageTextInput events handle here")
    function handleMessageInputEvent (type, event) {
//      if(event.keyCode === 13) {
//        console.log('messageTextInput keyup: ' + messageTextInput.value)
//        console.log('messageTextInput event.keyCode: ' + event.keyCode)
//      } else
//        console.log(type + ': ' + messageTextInput.value)

      if(!messageTextInput.value) return
      if(!store.get('myData')) return

      let message = "(" + store.get('myData').email + ") " + messageTextInput.value


      console.log("messageRepondentSelect.value: " + messageRepondentSelect.value)
//      let id = messageRepondentSelect.value
//      console.log(id)
      let sendToPeerId = PeerId.createFromB58String(messageRepondentSelect.value)
      console.log("id: " + sendToPeerId)
      PeerInfo.create(sendToPeerId, (err, sendToPeerInfo) => {
        if(err) console.log(err)
        console.log("info: " + sendToPeerInfo)

        const idStr = node.peerInfo.id.toB58String()

        messageFormat(messagesDiv, "out-" + idStr, message)

        messageCount++

        //window.crollTo(0,document.body.scrollHeight)

        node.dialProtocol(sendToPeerInfo, '/message', (err, conn) => {
          pull(
            pull.values([message]),
            conn
          )
          console.log("sent text to " + sendToPeerInfo.id.toB58String())
        })
      })

      console.log("send message out \"" + messageTextInput.value + "\"")
//      console.log(liveConnections)
//console.log(connections)
//console.log(nodes)

      messageTextInput.value = '';
    }
    messageTextInput.onclick = (event) => { 
      handleMessageInputEvent('messageTextInput clicked', event)
    }
    messageTextInput.onblur = (event) => { 
      handleMessageInputEvent('messageTextInput blured', event)
    }
    messageTextInput.onkeyup = (event) => { 
      if(event.keyCode === 13) {
        handleMessageInputEvent('messageTextInput blured', event)
      }
    }
*/

  })
})

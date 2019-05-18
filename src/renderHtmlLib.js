//let Express = require('express')
//let ejs = require('ejs')
//let fs = require('fs')

const config = require('./config')
const Web3   = require('web3')
const web3 = new Web3(Web3.givenProvider)
const Tx = require('ethereumjs-tx')
const pull = require('pull-stream')
const crypto = require('crypto')
const QRCode = require('qrcode')
const multiaddr = require('multiaddr')
//const ethAbi = require('ethereumjs-abi')

const store = require('store')
require('./baseConverter')
const getCookie = require('./getCookie')
const currencies = ["GBP","USD","EUR","AUD"]
const transferMethods = ["Bank Transfer"]

let depositsCollection = []
if(!store.get('deposits'))
  depositsCollection = []
else
  depositsCollection = store.get('deposits')

let txsCollection = []
if(!store.get('txs'))
  txsCollection = []
else
  txsCollection = store.get('txs')

let sendTxsSync = []
if(!store.get('sendTxsSync'))
  sendTxsSync = []
else
  sendTxsSync = store.get('sendTxsSync')
//setInterval(function(){ console.log(sendTxsSync) }, 5 * 1000)

let multiTxs = []
if(!store.get('multiTxs'))
  multiTxs = []
else
  multiTxs = store.get('multiTxs')

let multiTxsSync = []
if(!store.get('multiTxsSync'))
  multiTxsSync = []
else
  multiTxsSync = store.get('multiTxsSync')

let orgSigners = ''
let orgThreshold = null

let tokenBalances = []

window.addEventListener('popstate', function(event) {
console.log(event)
//  alert("You pressed a Back or forward button!")
/*
  var r = confirm("You pressed a Back button! Are you sure?!")
  if(r == true) {
    history.back()
  } else {
    history.pushState(null, null, window.location.pathname)
  
  history.pushState(null, null, window.location.pathname);
//  history.back()
*/
}, false)
window.addEventListener('hashchange', function(event) {
console.log(event)
  console.log("hashchange " + event.target.id)
}, false)


const overlayDiv = document.getElementById('overlay')
const topNavDiv = document.getElementById('topNav')
const topOrgDiv = document.getElementById('topOrg')
const sideNavDiv = document.getElementById('sideNav')
const mainContentDiv = document.getElementById('mainContent')

const PeerInfo = require('peer-info')
const PeerId   = require('peer-id')
//const EthJSTx  = require('ethereumjs-tx')
const ethUtil = require('ethereumjs-util')
const ethUnits = require('ethereumjs-units')

const TxLib = require('./txLib')
const txLib = new TxLib(config, ethUtil, web3, PeerId, PeerInfo, Tx, pull)


let thisHdWallet

let mainContentStatus = {}
mainContentStatus['dashboard'] = true

let node

let active = true 

const formElement = (id, type) => {
  console.log(id, type)
}

const restartNode = (e) => {
//  console.log('restart') 
//  console.log(e.target.id) 
  if(active === false) {
    active = true
    overlayDiv.style.display = "none"
    overlayDiv.style.backgroundColor = "rgba(255,255,255,0.95)"

    const idStr = 'QmdiF2cLAE3MtcE7Xw3qR6nk9inFiqUS4tbwQWdAuEByVd'
    console.log("check connection to bootNode" + idStr)
    const peerId = PeerId.createFromB58String(idStr)
    PeerInfo.create(peerId, (err, peerInfo) => {
      node.dialProtocol(peerInfo, '/message', (err, conn) => {
        if(err) {
          console.log(err)
          node.hangUp(peerInfo, (err) => {
            if(err) console.log(err)
          })
        } else {
          console.log("connect to boot node")
        }
      })
    })
  }
}

const inactivityTime = () => {
    var t
    window.onload = resetTimer
    // DOM Events
    document.onmousemove = resetTimer
    document.onkeypress = resetTimer

//    document.addEventListener('keypress', alert(1))

    function notActive() {
      console.log(`no activity : ${active}`)
      active = false
      render.inactivePage()
      //location.href = 'logout.php'
    }

    function resetTimer() {
      clearTimeout(t);
      t = setTimeout(notActive, 60 * 1000)
      // 1000 milisec = 1 sec
    }
}

const getProjectData = (project,hash) => {
//  console.log(project + " :: " + hash)

  let txs = store.get("txs")
  let deposits = store.get("deposits")
  for(let i=0; i<deposits.length; i++){
    if(deposits[i].projectName === project){
/*
      for(let j=0; j<deposits.length; j++){
        console.log("tx compare",deposits[j].hash,txs[i].hash)
        if(deposits[j].hash === txs[i].hash){
          console.log(txs[i], deposits[j])
          alert(deposits[j].projectName)
        }
      }
*/
//      console.log(deposits[i])
//      alert(project)
      return deposits[i]
    }
  }

  console.log(store.get("txs"))
  console.log(store.get("deposits"))
  
}

const prepareSignMultiTx = (txCount, signedMultiTx) => {

  const orgHash = web3.utils.keccak256(store.get('myData').org) 
  const contract_address = config.address

  var signers = []
  var s = {}
  var r = {}
  var v = {}
  var h = {}

  var outS = []
  var outR = []
  var outV = []
  var outH = []

  for(var i=0; i<signedMultiTx['signerData'].length; i++) {
//console.log(signedMultiTx['signerData'][i])
    const thisSigner = signedMultiTx['signerData'][i].signer
/*
    signers.push(signedMultiTx['signerData'][i].signer)
    s[signedMultiTx['signerData'][i].signer] = '0x' + Buffer.from(signedMultiTx['signerData'][i].s).toString('hex')
    r[signedMultiTx['signerData'][i].signer] = '0x' + Buffer.from(signedMultiTx['signerData'][i].r).toString('hex')
    v[signedMultiTx['signerData'][i].signer] = signedMultiTx['signerData'][i].v
    h[signedMultiTx['signerData'][i].signer] = Buffer.from(signedMultiTx['signerData'][i].data).toString('hex')
*/
    signers.push(thisSigner)
    s[thisSigner] = '0x' + Buffer.from(signedMultiTx['signerData'][i].s).toString('hex')
    r[thisSigner] = '0x' + Buffer.from(signedMultiTx['signerData'][i].r).toString('hex')
    v[thisSigner] = signedMultiTx['signerData'][i].v
    h[thisSigner] = '0x' + Buffer.from(signedMultiTx['signerData'][i].data).toString('hex')
  }
//  console.log(s,r,v,h,signers)

  // now add sig data from initiator
  const sha3Text = Buffer.from(signedMultiTx.sha3).toString('hex')
  const address_from = store.get('address')
  const myPrivateKey = Buffer.from(thisHdWallet.getWallet().getPrivateKey().toString('hex'),'hex')
  const cmdData = `signer::${address_from}::sha3::${sha3Text}`
  const data = ethUtil.sha3(cmdData)
  const vrs = ethUtil.ecsign(data, myPrivateKey)
  const thisSigner = address_from
  signers.push(thisSigner)
  s[thisSigner] = '0x' + Buffer.from(vrs.s).toString('hex')
  r[thisSigner] = '0x' + Buffer.from(vrs.r).toString('hex')
  v[thisSigner] = vrs.v
  h[thisSigner] = '0x' + Buffer.from(data).toString('hex')
  
//  console.log(vrs.s,vrs.r,vrs.v,data,signers)
  console.log(s,r,v,h,data,signers)
  alert("s,r,v,h")

//  console.log(signers)
  signers.sort(hexSortAsc)
//  console.log(signers)
//  alert("nice one top one sorted")

  for(var i=0; i< signers.length; i++) {
    const signer = signers[i]
//    console.log(signer, s[signer], r[signer], v[signer], h[signer])
    outS.push(s[signer])
    outR.push(r[signer])
    outV.push(v[signer])
    outH.push(h[signer])
//    alert(signer)
  }

//  console.log("signedTXMultiData",signers,outS,outR,outV,outH)
//  alert("signedTXMultiData")


  let sendToPeerId = PeerId.createFromB58String('QmdiF2cLAE3MtcE7Xw3qR6nk9inFiqUS4tbwQWdAuEByVd')
  PeerInfo.create(sendToPeerId, (err, sendToPeerInfo) => {
    node.dialProtocol(sendToPeerInfo, '/disberse/gasnnonce', (err, conn) => {
      pull(
        pull.values([address_from]),
        conn,
        pull.collect((err, data) => {
          if (err) { 
            console.log(err) 
          } else {
            const returnData = data.toString().split("::")

            // these will need to grab data automatically - how ?????
            var nonceHex = web3.utils.toHex(returnData[2])
            var gasPrice = returnData[1]
            var gasPriceHex = web3.utils.toHex(gasPrice)
            var gasLimitHex = web3.utils.toHex(600000)

            var value = signedMultiTx.amount

            let typeId
            for(let i=0; i<config.currencies.length; i++) 
              if(config.currencies[i] === signedMultiTx.type)
                typeId = i
            var type = typeId
            var projectName = web3.utils.fromAscii(signedMultiTx.project)
//            var to = signedMultiTx.receiver
            var to = [signedMultiTx.receiver,signedMultiTx.sender]
            // transfer example
            var txType = 0;

            var transValue = web3.utils.toHex(0)
            var lodash = require('lodash')
            var this_function_abi = lodash.find(config.abi, { name: 'verifyAndSend' })
console.log(this_function_abi)
//  verifyAndSend(bytes32 _orgHash, uint8[] memory sigV, bytes32[] memory sigR, bytes32[] memory sigS, bytes32[] memory _h, address[] memory signers, uint _value, uint _type, bytes8 projectName, address _to, uint _txType)
            var payloadData = [orgHash,outV,outR,outS,outH,signers,value,type,projectName,to,txType]
console.log("payloadData",payloadData)
            var txPayloadData = web3.eth.abi.encodeFunctionCall(this_function_abi, payloadData)

            var thisTx = {
              from: address_from,
              to: contract_address,
              value: transValue,
              data: txPayloadData,
              nonce: nonceHex,
              gasPrice: gasPriceHex,
              gasLimit: gasLimitHex,
            }
//            console.log(thisTx)
//            alert(thisTx)

            var tx = new Tx(thisTx)
            tx.sign(myPrivateKey)

            var serializedTx = tx.serialize()

//console.log(serializedTx)
            alert(thisTx)

            node.dialProtocol(sendToPeerInfo, '/disberse/sendtx', (err, conn) => {
              pull(
                pull.values([serializedTx.toString('hex')]),
                conn,
                pull.collect((err, data) => {
                  if (err) { console.log(err) 
//                    console.log(err)
                  }
                  console.log('received hash:', data.toString())
                  console.log(tx.hash().toString('hex'))
//                  callback(null,'0x'+tx.hash().toString('hex'))
                  //save 
//                  let txsHashObj = {}
//                  store.set("txsHashs",txsHashObj)
                })
              )
              console.log("sent: " + serializedTx.toString('hex'))
            })
          }
        })
      )
    })
  })

  return signedMultiTx
}

const sendMyPeerInfo = () => {
  console.log("send my peer info pubsub")
  node.pubsub.publish('disberse/info',Buffer.from(store.get('myData').email + "::" + store.get('address')),() => {})
}
setInterval(sendMyPeerInfo, 60 * 1000)

const orgJob = () => {
  getSignersAndThreshold((err,signers,threshold) => {

    console.log("multiTxsNotifications: ")
    console.log("multiTxsNotifications: " + signers)
    console.log("multiTxsNotifications: " + threshold)

    orgSigners = signers
    orgThreshold = threshold

//console.log("multiTxsNotifications: " + multiTxs.length)
/*
    for(let i=0; i<multiTxs.length; i++) {
      let multiTx = multiTxs[i]
      console.log("multiTxsNotifications: -> " + multiTx.receiver)
    }
    for(let i=0; i<multiTxsSync.length; i++) {
//console.log("multiTxsSync: " + i)
//alert(i)
      let multiTx = multiTxsSync[i]
      console.log(("multiTxsNotifications: " + multiTx)
    }
*/
  })
//  node.dialProtocol(peerInfo, '/peerMap', (err, conn) => {
}
//setInterval(orgJob, 60 * 1000)

const syncMultiTxs = () => {
  console.log("syncing multiTxs")
  const thisAddress = store.get('address')
  if(active === false) return
  if(orgSigners === 0) return
  getPeerMap((err, allPeerMap) => {
    if(err)
      console.log(err)
    else {
      let peer = {}
      for(let j=0; j<allPeerMap.length; j++) {
//        console.log("pm",allPeerMap[j].toString())
        let p = allPeerMap[j].toString().split("::")
        peer[p[1]] = p[0]
//console.log(p, peer[p[1]])
      }
      getSignersAndThreshold((err,signers,threshold) => {
        for(let i=0; i<multiTxsSync.length; i++) {
          let multiTx = multiTxsSync[i]
          let peersDone = multiTxsSync[i].peersDone || []
          if(multiTx.done){
//          console.log("multiTx", i, "is already synced")
          } else {
//console.log("syncMultiTxs",multiTx,signers,threshold)
            for(let j=0; j<signers.length; j++) {
              let targetPeer = peer[signers[j].toLowerCase()]
              let peersDone = multiTxsSync[i].peersDone || []
              let chk = false
//console.log("pd",multiTx,peersDone,targetPeer,  peer[thisAddress])
              if(typeof targetPeer === 'undefined'){
//console.log("pd+signers","undefined", targetPeer)
              } else if(targetPeer === peer[thisAddress]){
//console.log("pd+signers","local peer already knows about this tx", targetPeer, peer[thisAddress])
              } else {
//console.log("pd+signers","sync to peer", targetPeer, peer[thisAddress], signers[j].toLowerCase())
                for(let k=0; k<peersDone.length; k++) {
//                  if(peersDone[k] === peer[signers[j].toLowerCase()])
                  if(peersDone[k] === signers[j])
                    chk = true
                }
                if(chk === false) {
console.log("pd+signers",signers[j],chk)

                  let sendToPeerId = PeerId.createFromB58String(targetPeer)
                  PeerInfo.create(sendToPeerId, (err, peerInfo) => {
                    node.dialProtocol(peerInfo, '/disberse/multiData', (err, conn) => {
                      const address_from = store.get('address')
                      const myPrivateKey = Buffer.from(thisHdWallet.getWallet().getPrivateKey().toString('hex'),'hex')
                      const cmdData = `signer::${address_from}::hash::${multiTx.sha3.toString()}`
                      const data = ethUtil.sha3(cmdData)
                      const vrs = ethUtil.ecsign(data, myPrivateKey)
//var pubkey = ethUtil.ecrecover(data, vrs.v, vrs.r, vrs.s)
//var addrForPubKey = ethUtil.pubToAddress(pubkey)
//console.log("signer: " + addrForPubKey.toString('hex'))
//console.log(data, vrs.v, vrs.r, vrs.s)
                      multiTx.data = data
                      multiTx.vrs  = vrs
 
                      pull(
                        pull.values([JSON.stringify(multiTx)]),
                        conn,
                        pull.collect((err, data) => {
                          if (err) { console.log(err) 
                            console.log(err)
                          } else {
                            peersDone.push(signers[j])
                            multiTxsSync[i].peersDone = peersDone
                            store.set("multiTxsSync",multiTxsSync)
                          }
                        })
                      )
                    })
                  })
                } else {
console.log("pd+signers done",signers[j],chk)
                }
              }
            }
          }
        }
      })
    }
  })
}
setInterval(syncMultiTxs, 10 * 1000)

const syncSendTxs = () => {
  console.log("syncing sendTxs")
  if(active === false) return
  getPeerMap((err, allPeerMap) => {
    if(err)
      console.log(err)
    else {
//console.log("peerMap")
//console.log(peerMap)
      for(var i=0; i<allPeerMap.length; i++) {
        var peerMap = allPeerMap[i]
        if(peerMap.toString().search(node.peerInfo.id.toB58String()) == -1) {
//          console.log(peerMap.toString())
          let peer = peerMap.toString().split("::")
          for(let i=0; i<sendTxsSync.length; i++) {
            let sendTx = sendTxsSync[i]
            if(sendTx.done){
//              console.log(sendTx.hash + " is already synced")
            } else if(sendTx.receiver === peer[1]){
//              console.log(sendTx)
              let sendToPeerId = PeerId.createFromB58String(peer[0])
              PeerInfo.create(sendToPeerId, (err, peerInfo) => {
//                console.log(peerInfo.id.toB58String())
//                console.log("findPeer: " + JSON.stringify(peerInfo.id))
                const mh1 = multiaddr('/p2p-circuit/ipfs/' + peerInfo.id.toB58String())
//                peerInfo.multiaddrs.forEach((ma) => { console.log("findPeer: (ma)" + ma.toString()) })
//console.log(peerInfo)
//                node.dial(mh1, (err, conn) => {
//                node.dialProtocol(mh1, '/disberse/projectData', (err, conn) => {
                node.dialProtocol(peerInfo, '/disberse/projectData', (err, conn) => {
                  const address_from = store.get('address')
//console.log("pk: " + thisHdWallet.getWallet().getPrivateKey().toString('hex'))

                  const myPrivateKey = Buffer.from(thisHdWallet.getWallet().getPrivateKey().toString('hex'),'hex')
                  const cmdData = `signer::${address_from}::hash::${sendTx.hash}`
                  const data = ethUtil.sha3(cmdData)
                  const vrs = ethUtil.ecsign(data, myPrivateKey)
//var pubkey = ethUtil.ecrecover(data, vrs.v, vrs.r, vrs.s)
//var addrForPubKey = ethUtil.pubToAddress(pubkey)
//console.log("signer: " + addrForPubKey.toString('hex'))
//console.log(data, vrs.v, vrs.r, vrs.s)
                  sendTx.data = data
                  sendTx.vrs  = vrs

//                sendTx.project = depositsCollection
                // get project data and send to reciever

                  pull(
                    pull.values([JSON.stringify(sendTx)]),
                    conn,
                    pull.collect((err, data) => {
                      if (err) { console.log(err) 
                        console.log(err)
                      } else {
//                        console.log(data.toString())
//                        console.log(sendTxsSync[i])
                        sendTxsSync[i].done = true
                        store.set("sendTxsSync",sendTxsSync)
//                        console.log(sendTxsSync[i])
                      }
                    })
                  )
                })
              })
            }
          }
        }
      }
    }
  })
}
setInterval(syncSendTxs, 10 * 1000)

const hexSortAsc = (a, b) => {
  const aHexInt = parseInt(a, 16)
  const bHexInt = parseInt(b, 16)
  return aHexInt - bHexInt
}


const formatTimestamp = (timestamp) => {

  let date = new Date(timestamp)
  let datevalues = {
    'year': pad(date.getFullYear(), 4),
    'month': pad(date.getMonth()+1, 2),
    'day': pad(date.getDate(), 2),
    'hour': pad(date.getHours(), 2),
    'minutes': pad(date.getMinutes(), 2),
    'seconds': pad(date.getSeconds(), 2)
  } 
  return datevalues
}

const pad = (n, width, z) => {
  z = z || '0'
  n = n + ''
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n
}

const txsPage = (div, flag) => {
  while(div.firstChild){
    div.removeChild(div.firstChild)
  }

  const outDiv = document.createElement('div') 
  const h4 = document.createElement('h4') 
  h4.textContent = "Transactions" 
  outDiv.appendChild(h4)

  let out
  out = "<table id=\"txsTable\" class=\"display\">" 
  out += "<thead><tr><th>" + 
    "cmd </th><th>" + 
    "project </th><th>" + 
    "amount </th><th>" + 
    "type </th><th>" + 
    "from </th><th>" + 
    "to </th><th>" + 
    "timestamp </th><th>" +
    "hash </th></tr></thead><tbody>"
  for(let i=0; i<txsCollection.length; i++) {
    const txs = txsCollection[i] 

    let date = formatTimestamp(txs.timestamp)
    let dateOut = date.year + "/" +
      date.month + "/" +
      date.day  + " @  " +
      date.hour  + ":" +
      date.minutes + ":" +
      date.seconds
    
    let txsHashHex = txs.hash
    if(txs.hash.data) txsHashHex = ethUtil.bufferToHex(txs.hash.data)

    let projectName = txs.projectName || txs.project
    let sender      = txs.sender || ""
    let receiver      = txs.receiver || ""
    let senderSub   = "" 
    if(sender !== "") senderSub = txs.sender.substr(0,10) + "..."
    let receiverSub   = "" 
    if(receiver !== "") receiverSub = txs.receiver.substr(0,10) + "..."

    out += "<tr><td>" + 
      txs.cmd  + "</td><td>" + 
      projectName + "</td><td>" +
      txs.amount + "</td><td>" +
      txs.type + "</td><td data-toggle=\"popover\" title=\"" + sender + "\">" +
      senderSub + "...</td><td data-toggle=\"popover\" data-content=\"" + receiver + "\">" +
      receiverSub + "...</td><td>" +
      dateOut + "</td><td data-toggle=\"popover\" data-content=\"" + txsHashHex + "\">" +
      "<span style='font-family: monospace'>" + txsHashHex.substr(0,10) + "...</span></td></tr>"

    console.log(txs)
    console.log(txs.timestamp)
  }
  out += "</tbody></table>" 
  const p = document.createElement('p') 
  p.innerHTML = out
  outDiv.appendChild(p)

  const script = document.createElement('script') 
  script.type = 'text/javascript'
  let code = "$(document).ready( function () {" +
    "  $('[data-toggle=\"popover\"]').popover(); " +
    "  $('#txsTable').DataTable(" +
    "    {" +
    "      'order': [[ 6, 'desc', ]]" +
    "    }" +
    "  )" +
    "} )"
  try {
    script.appendChild(document.createTextNode(code))
    document.body.appendChild(script)
  } catch (e) {
    script.text = code
    document.body.appendChild(script)
  }

  div.appendChild(outDiv)
}

const projectsPage = (div, flag) => {
//  console.log(depositsCollection)

  //clear content from div
  while(div.firstChild){
    div.removeChild(div.firstChild)
  }

  const outDiv = document.createElement('div') 
  const h4 = document.createElement('h4') 
  h4.textContent = "Projects" 
  outDiv.appendChild(h4)

  let out
  out = "<table id=\"projectTable\" class=\"display\">" 
  out += "<thead><tr><th>" + 
    "type  </th><th>" + 
    "amount </th><th>" +
    "projectName </th><th>" +
    "projectCode </th><th>" +
    "method </th><th>" +
    "timestamp </th></tr></thead><tbody>"


  let projects = []

//    if(txs.projectData)
  let chk = {}
  let txs = store.get("txs")
  if(txs && txs.length > 0)
    for(let i=0; i<txs.length; i++) 
      if(txs[i].projectData)
        if(chk[txs[i].projectData.hash] !== 1){
          projects.push(txs[i].projectData)
          chk[txs[i].projectData.hash] = 1
        }

  for(let i=0; i<depositsCollection.length; i++) 
    projects.push(depositsCollection[i])

  for(let i=0; i<projects.length; i++) {
    const deposit = projects[i] 
//  for(let i=0; i<depositsCollection.length; i++) {
//    const deposit = depositsCollection[i] 

//alert(deposit)
//Object { type: "EUR", amount: "45", projectName: "45 euor name", projectCode: "45eur", method: "Bank Transfer" }

//    let date = new Date(deposit.timestamp)
    let date = formatTimestamp(deposit.timestamp)
    let dateOut = date.year + "/" +
      date.month + "/" +
      date.day  + " @  " +
      date.hour  + ":" +
      date.minutes + ":" +
      date.seconds

    out += "<tr><td>" + 
      deposit.type  + "</td><td>" + 
      deposit.amount + "</td><td>" +
      deposit.projectName + "</td><td>" +
      deposit.projectCode + "</td><td>" +
      deposit.method + "</td><td>" +
      dateOut + "</td></tr>"
//      deposit.timestamp + "</td></tr>"

//    console.log(deposit)
//    console.log(deposit.timestamp)
  }
  out += "</tbody></table>" 
//alert(out)
  const p = document.createElement('p') 
  p.innerHTML = out
  outDiv.appendChild(p)
  const script = document.createElement('script') 
  script.type = 'text/javascript'
  let code = "$(document).ready( function () {" +
    "  $('#projectTable').DataTable(" +
    "    {" +
    "      'order': [[ 5, 'desc', ]]" +
    "    }" +
    "  )" +
    "} )"
  try {
    script.appendChild(document.createTextNode(code))
    document.body.appendChild(script)
  } catch (e) {
    script.text = code
    document.body.appendChild(script)
  }
  div.appendChild(outDiv)
}

const sendMultiForm = (div, flag) => {

  while(div.firstChild){
    div.removeChild(div.firstChild)
  }

  let elements
  let values = {}

  let projects = []
  let types = {}
  for(let i=0; i<depositsCollection.length; i++) {
    const deposit = depositsCollection[i]
    projects.push(deposit.projectName) 
  }

  let out = ''
  let data = {}
  div.innerHTML = "<h4>Send Funds Form (Multi)</h4>"
  out += "<h4>Send Funds</h4>"
  data.inputs = []
//  let projects = ['Project 1','Project 2']
  data.inputs.push({id: 'projectSend', type: 'select', name: 'project', value:'',label:'Select Project', options:projects})
  data.inputs.push({id: 'typeSend', type: 'select', name: 'type', value:'',label:'Currency Type', options:currencies})
  data.inputs.push({id: 'amount', type: 'text', name: 'amount', value:'',label:'Amount',placeholder:'enter amount'})
  data.inputs.push({id: 'receiver', type: 'text', name: 'receiver', value:'',label:'Receiver\'s email or Disberse wallet address',placeholder:'enter receiver email or address'})
  data.inputs.push({id: 'trackingCode', type: 'text', name: 'trackingCode', value:'',label:'Tracking Code',placeholder:'enter tracking code'})
  data.inputs.push({id: 'submitSendMulti', type: 'button', name: 'submit', value:'Send Funds',label:'',onclick:'return false'})

  const form = document.createElement('form') 
  form.setAttribute('id','sendMultiForm')
  form.setAttribute('name','sendMultiForm')
  formatFormElements(data, form)
  div.appendChild(form)


  div.style.display = "block"
}

const sendForm = (div, flag) => {

  while(div.firstChild){
    div.removeChild(div.firstChild)
  }

  let elements
  let values = {}

  let projects = []
  let types = {}
//  let myCurrencies = []
  for(let i=0; i<depositsCollection.length; i++) {
//alert(deposit)
//Object { type: "EUR", amount: "45", projectName: "45 euor name", projectCode: "45eur", method: "Bank Transfer" }
    const deposit = depositsCollection[i]
    projects.push(deposit.projectName) 
console.log(deposit.projectName)
//    type[deposit.projectName] = deposit.type
  }

//  for(let i=0; i<projects.length; i++)
//    for(let j=0; j<currencies.length; j++) {
//      if(types[projects[i]] === currencies[j])
//        myCurrencies.push(types[projects[i]])
//    }


  let out = ''
  let data = {}
  div.innerHTML = "<h4>Send Funds Form</h4>"
  out += "<h4>Send Funds</h4>"
  data.inputs = []
//  let projects = ['Project 1','Project 2']
  data.inputs.push({id: 'projectSend', type: 'select', name: 'project', value:'',label:'Select Project', options:projects})
  data.inputs.push({id: 'typeSend', type: 'select', name: 'type', value:'',label:'Currency Type', options:currencies})
  data.inputs.push({id: 'amount', type: 'text', name: 'amount', value:'',label:'Amount',placeholder:'enter amount'})
  data.inputs.push({id: 'receiver', type: 'text', name: 'receiver', value:'',label:'Receiver\'s email or Disberse wallet address',placeholder:'enter receiver email or address'})
  data.inputs.push({id: 'trackingCode', type: 'text', name: 'trackingCode', value:'',label:'Tracking Code',placeholder:'enter tracking code'})
  data.inputs.push({id: 'submitSend', type: 'button', name: 'submit', value:'Send Funds',label:'',onclick:'return false'})
//  out += "<form id='sendForm'>\n<div class=\"form-group\">\n"

  const form = document.createElement('form') 
  form.setAttribute('id','sendForm')
  form.setAttribute('name','sendForm')
  formatFormElements(data, form)
  div.appendChild(form)

//  formatFormElements(data, div)

  div.style.display = "block"
}

const redeemForm = (div, flag) => {

  while(div.firstChild){
    div.removeChild(div.firstChild)
  }

  let projects = []
  for(let i=0; i<depositsCollection.length; i++) {
//Object { type: "EUR", amount: "45", projectName: "45 euor name", projectCode: "45eur", method: "Bank Transfer" }
    const deposit = depositsCollection[i]
    projects.push(deposit.projectName)
  }

  let out = ''
  let data = {}
  div.innerHTML = "<h4>Redeem Form</h4>"
  data.inputs = []
//  let projects = ['Project 1','Project 2']
//  data.inputs.push({id: 'projectSend', type: 'select', name: 'project', value:'',label:'Select Project', options:projects})
//  data.inputs.push({id: 'projectRedeem', type: 'select', name: 'projectRedeem', value:'',label:'Select Project', options:projects})
//  data.inputs.push({id: 'test', type: 'select', name: 'test', value:'',label:'Select Test...', options:projects})
  data.inputs.push({id: 'projectRedeem', type: 'select', name: 'projectRedeem', value:'',label:'Select Project', options:projects})
  data.inputs.push({id: 'typeRedeem', type: 'select', name: 'typeRedeem', value:'',label:'Currency Type', options:currencies})
  data.inputs.push({id: 'amount', type: 'text', name: 'amount', value:'',label:'Amount',placeholder:'enter amount'})
  data.inputs.push({id: 'trackingCode', type: 'text', name: 'trackingCode', value:'',label:'Tracking Code',placeholder:'enter tracking code'})
  data.inputs.push({id: 'method', type: 'radio', name: 'method', value:'method',label:'Select method',options:transferMethods})
  data.inputs.push({id: 'submitRedeem', type: 'button', name: 'submit', value:'Redeem Funds',label:'',onclick:'return false'})

  const form = document.createElement('form') 
  form.setAttribute('id','redeemForm')
  form.setAttribute('name','redeemForm')
  formatFormElements(data, form)
  div.appendChild(form)

//  formatFormElements(data, div)

  div.style.display = "block"
}

const depositForm = (div, flag) => {
  
  let elements
  let values = {}

  if(flag === 'edit'){
    elements = document.getElementById('confirmDepositForm').elements
    while(div.firstChild){
      div.removeChild(div.firstChild)
    }

    for(let i=0; i<elements.length; i++) {
      let input = elements[i]
      if(input.type !== 'button' && input.type !== 'submit')
        values[input.id] = input.value
    }
    console.log(values)
  }

  let out = ''
  let data = {}
  div.innerHTML = "<h4>Deposit Form</h4>"
  data.inputs = []
  if(!values['type']) values['type'] = ''
  if(!values['amount']) values['amount'] = ''
  if(!values['projectName']) values['projectName'] = ''
  if(!values['projectCode']) values['projectCode'] = ''
  if(!values['method']) values['method'] = ''
  data.inputs.push({id: 'type', type: 'select', name: 'type', value:values['type'],label:'Currency Type', options:currencies,placeholder:'enter currency type'})
  data.inputs.push({id: 'amount', type: 'text', name: 'amount', value:values['amount'],label:'Amount',placeholder:'Enter amount to deposit',placeholder:'enter amount'})
  data.inputs.push({id: 'projectName', type: 'text', name: 'projectName', value:values['projectName'],label:'Project Name',placeholder:'enter project name'})
  data.inputs.push({id: 'projectCode', type: 'text', name: 'projectCode', value:values['projectCode'],label:'Project Code',placeholder:'enter project code'})
  data.inputs.push({id: 'method', type: 'radio', name: 'method', value:values['method'],label:'Select method',options:transferMethods})
  data.inputs.push({id: 'submitDeposit', type: 'button', name: 'submit', value:'Deposit & Create Project',label:'',onclick:'return false'})

  const form = document.createElement('form') 
  form.setAttribute('id','depositForm')
  form.setAttribute('name','depositForm')
  formatFormElements(data, form)
  div.appendChild(form)

  div.style.display = "block"
}

const confrimDepositPage =  () => {
  const div = document.getElementById('mainContent-deposit')
  const elements = document.getElementById('depositForm').elements

  // remove the old child form 
  while(div.firstChild){
    div.removeChild(div.firstChild)
  }

  const header = document.createElement('h4')
  header.textContent = "Confirm this data please" 
  div.appendChild(header)

  for(let i=0; i<elements.length; i++) {
    let input = elements[i]
    if(input.type != 'submit' && input.type != 'button'){
      const br = document.createElement('br')
      const p = document.createElement('span')
      const l = document.createElement('label')
      l.style.float = 'left'
      l.style.textAlign = 'right'
//      l.style.border = '1px solid green'
      l.style.width = "150px"
      l.textContent = elements[i].name + ":"
      p.style = 'margin-left: 10px'
      p.textContent = elements[i].value 
      br.setAttribute('clear','all')
      p.appendChild(l)
      p.appendChild(br)
      div.appendChild(p)
//      div.appendChild(br)
    }
  }

  const form = document.createElement('form')
  form.setAttribute('id', 'confirmDepositForm')

  let inputs = []
  inputs.push({id: 'confirmDeposit', type: 'button', name: 'submit', value:'Confirm Deposit',label:'',onclick:'return false'})
  inputs.push({id: 'editDeposit', type: 'button', name: 'edit', value:'Edit Deposit Details',label:'',onclick:'return false'})
  for(let i=0; i<elements.length; i++) {
    let input = elements[i]
    if(input.type !== 'button')
      inputs.push({id: input.id, type: 'hidden', name: input.name, value:input.value,label:'',onclick:'return false'})
  }
//  inputs.push({id: 'editDeposit', type: 'button', name: 'edit', value:'Edit Deposit Info',label:'',onclick:'return false'})
  for(let i=0; i<inputs.length; i++) {
    let input = inputs[i]
    const thisInput = document.createElement('input')
    if(input.type != 'hidden'){
      thisInput.setAttribute('class', "form-control track-input")
      thisInput.setAttribute('placeholder', input.placeholder)
    }
    thisInput.setAttribute('id', input.id)
    thisInput.setAttribute('type', input.type)
    thisInput.setAttribute('name', input.name)
    thisInput.setAttribute('value',input.value) 
    if(input.type === 'submit' || input.type === 'button'){
      thisInput.addEventListener('click',handleFormClick)
    }
    form.appendChild(thisInput)
//  div.appendChild(p)
  }
  div.appendChild(form)
}


const storeSendMultiData = (e) => {
  const elements = document.getElementById('sendMultiForm').elements
  let out = ''
  let data = {} 
  for(let i=0; i<elements.length; i++) {
    let input = elements[i]
    out += `${input.name} :: ${input.value}\n`
    if(input.type !== 'button')
      data[input.name] = input.value
  }
  const date = new Date()
  data['timestamp'] = date 

  const div = document.getElementById('mainContent-send-multi')

//alert(data)
//console.log(data)
  let hash = ''
  let sha3 = ethUtil.sha3("cmd:send,timestamp:" + date + ",project:" + data.project + ",amount:" + data.amount + ",receiver:" + data.receiver)
  multiTxsSync.push({cmd:'send','timestamp':date,'amount':data.amount,'sender':store.get('address'),'receiver':data.receiver,project:data.project,type:data.type,trackingCode:data.trackingCode,'sha3':sha3,'hash':hash})
console.log(multiTxsSync)
  store.set("multiTxsSync",multiTxsSync)
//  txsCollection = store.get('txs')

  while(div.firstChild){
    div.removeChild(div.firstChild)
  }

  let h3 = document
    .createElement('h3')
  var text = document.createTextNode("Multi Signature Send Funds Transaction Initialised")
  h3.appendChild(text)
  div.appendChild(h3)

  let h4 = document
    .createElement('h4')
  var text = document.createTextNode("test output")
  h4.appendChild(text)
  div.appendChild(h4)


}

const getSignersAndThreshold = (callback) => {
  txLib.getOrgInfoAsync(node, thisHdWallet, store.get('address'), store.get('myData').org)
  var orgInfoPromise = txLib.getOrgInfoAsync(node, thisHdWallet, store.get('address'), store.get('myData').org)
  orgInfoPromise.then(function(value){
    let valueObj = JSON.parse(value)
    let signers = valueObj.signers
    let threshold = valueObj.threshold
    callback(null,signers,threshold)
  })
}

const storeSendData = (e) => {
  const elements = document.getElementById('sendForm').elements
  let out = ''
  let data = {} 
  for(let i=0; i<elements.length; i++) {
    let input = elements[i]
    out += `${input.name} :: ${input.value}\n`
    if(input.type !== 'button')
      data[input.name] = input.value
  }
  const date = new Date()
  data['timestamp'] = date 

  const div = document.getElementById('mainContent-send')

  sendSendDataBootNode(data, (err,hash) => {
    if(err) {
      console.log(err)
      let h3 = document
        .createElement('h3')
      var text = document.createTextNode(err)
      h3.appendChild(text)
      div.insertBefore(h3, div.childNodes[0])
      h3.setAttribute('style', 'padding-bottom:20px;')
//      div.appendChild(h3)
    } else {

      while(div.firstChild){
        div.removeChild(div.firstChild)
      }

      let sha3 = ethUtil.sha3("cmd:send,timestamp:" + date + ",project:" + data.project + ",amount:" + data.amount + ",receiver:" + data.receiver)
      txsCollection.push({cmd:'send','timestamp':date,'amount':data.amount,'sender':store.get('address'),'receiver':data.receiver,project:data.project,type:data.type,trackingCode:data.trackingCode,'sha3':sha3,'hash':hash})
      store.set("txs",txsCollection)
      txsCollection = store.get('txs')

      let projectData = getProjectData(data.project,hash)

      sendTxsSync.push({cmd:'send','timestamp':date,'amount':data.amount,'sender':store.get('address'),'receiver':data.receiver,project:data.project,type:data.type,trackingCode:data.trackingCode,'sha3':sha3,'hash':hash,'projectData':projectData})
      store.set("sendTxsSync",sendTxsSync)

      let h3 = document
        .createElement('h3')
      var text = document.createTextNode("Send Funds Transaction Sent")
      h3.appendChild(text)
      div.appendChild(h3)

      let h4 = document
        .createElement('h4')
      text = document.createTextNode("TransactionId: " + hash)
      h4.appendChild(text)
      div.appendChild(h4)

/*
      sendSendDataReceiverNode(data,(err,hash) => {
        if(err)
          alert("callback: " + err)
        else {
          alert("hash: " + hash)
        }
      })
*/

    }
  })
}

const storeRedeemData = (e) => {
  const elements = document.getElementById('redeemForm').elements
  let out = ''
  let data = {} 
  for(let i=0; i<elements.length; i++) {
    let input = elements[i]
    out += `${input.name} :: ${input.value}\n`
    if(input.type !== 'button')
      data[input.name] = input.value
  }
  const date = new Date()
  data['timestamp'] = date 

  const div = document.getElementById('mainContent-redeem')
  while(div.firstChild){
    div.removeChild(div.firstChild)
  }

  sendRedeemDataBootNode(data, (err,hash) => {
    if(err) {
      console.log(err)
    } else {

      let string = "cmd:redeem,timestamp:" + date + ",project:" + data.project + ",amount:" + data.amount
//  alert(string)
//      alert(ethUtil.sha3(string).toString('hex'))

      let sha3 = ethUtil.sha3(string)
//alert("cmd:redeem,timestamp:" + date + ",project:" + data.project + ",amount:" + data.amount + ",receiver:" + store.get('myData').email)
      txsCollection.push({cmd:'redeem',project:data.projectRedeem,type:data.typeRedeem,amount:data.amount,'trackingCode':data.trackingCode,'sender':store.get('address'),method:data.method,'timestamp':date,'sha3':sha3,'hash':hash})
      store.set("txs",txsCollection)
      txsCollection = store.get('txs')

/*
      let sha3 = ethUtil.sha3("cmd:send,timestamp:" + date + ",project:" + data.project + ",amount:" + data.amount + ",receiver:" + data.receiver)
      txsCollection.push({cmd:'send','timestamp':date,'sha3':sha3,'hash':hash})
      store.set("txs",txsCollection)
      txsCollection = store.get('txs')
*/

      let h3 = document
        .createElement('h3')
      var text = document.createTextNode("Redeem Funds Transaction Sent")
      h3.appendChild(text)
      div.appendChild(h3)

      let h4 = document
        .createElement('h4')
      text = document.createTextNode("TransactionId: " + hash)
      h4.appendChild(text)
      div.appendChild(h4)
    }
  })

}

const getPeerMapTest = (callback) => {
  let sendToPeerId = PeerId.createFromB58String('QmdiF2cLAE3MtcE7Xw3qR6nk9inFiqUS4tbwQWdAuEByVd')
//  console.log(sendToPeerId)
  var count = 0
  PeerInfo.create(sendToPeerId, (err, peerInfo) => {
    if(err)
      console.log(err)
    node.dialProtocol(peerInfo, '/peerMap', (err, conn) => {
      if(err)
        console.log(err)
      else
        pull(
          conn,
          pull.asyncMap((data, callback) => {
//              console.log("123: " + data.toString())
              callback(null, data.toString())
          }),
          pull.collect((err, dataArray)=>{
            callback(err, dataArray)
          })
//          pull.drain(()=>{})
        )
    })
  })
}

const getPeerMap = (callback) => {
  let sendToPeerId = PeerId.createFromB58String('QmdiF2cLAE3MtcE7Xw3qR6nk9inFiqUS4tbwQWdAuEByVd')
//  console.log(sendToPeerId)
  var count = 0
  PeerInfo.create(sendToPeerId, (err, peerInfo) => {
    if(err)
      callback(err)
//    console.log(peerInfo)
    node.dialProtocol(peerInfo, '/peerMap', (err, conn) => {
      if(err)
        callback(err)
      else
        pull(
          conn,
          pull.asyncMap((data,mapCallback) => {
//console.log("my: " + node.peerInfo.id.toB58String())
//console.log(peerInfo.id.toB58String())
//            if(node.peerInfo.id.toB58String() != peerInfo.id.toB58String())
//console.log(count,data.toString())
//count++
              mapCallback(null, data)
//            else
//              callback('this peer ignore')
          }),
          pull.collect((err, dataArray)=>{
            callback(err, dataArray)
          })
//          pull.drain(()=>{})
        )
    })
  })
}

const getGasPrice = (data) => {
}

const getOrgInfo = () => {

  const org = "Test Org"
  const orgHash = web3.utils.keccak256(org)

  console.log("orgHash: " + orgHash)

  let sendToPeerId = PeerId.createFromB58String('QmdiF2cLAE3MtcE7Xw3qR6nk9inFiqUS4tbwQWdAuEByVd')
  PeerInfo.create(sendToPeerId, (err, sendToPeerInfo) => {
    node.dialProtocol(sendToPeerInfo, '/disberse/getOrgInfo', (err, conn) => {
      pull(
        pull.values([orgHash]),
        conn,
        pull.collect((err, data) => {
          if (err) { 
            console.log(err) 
          } else {
            console.log(data)
          }
        })
      )
    })
  })

}

const testEditOrgCall2 = () => {
  var address_to = config.disberse_admin_address
  var address_from = store.get('address')
  var pKey = thisHdWallet.getWallet().getPrivateKey()

  const cmdData = "signer::" + store.get('address') + "::editOrg::" + store.get('address')
}

const testEditOrgCall = () => {
alert("start testEditOrgCall")

  var address_to = config.disberse_admin_address
  var address_from = store.get('address')
  var pKey = thisHdWallet.getWallet().getPrivateKey()

  const cmdData = "signer::" + store.get('address') + "::editOrg::" + store.get('address')

  let data = ethUtil.sha3(cmdData)

  var disberse_abi = config.abi
  var owner_address = config.owner_address
  var contract_address = config.address

  const org = "Test Org"
  const orgHash = web3.utils.keccak256(org)
  // chrome gav-chrome user address
//  const orgAddress = '0x6c79dc388ab405e7e3055221295ebf34d7a4802c'
  const orgAddress = '0xf1742513690cc07772b9a93095d15bcef4b7b8fe'
  const threshold = 2
  const signers = []
  signers.push(store.get('address'))

  signers.push('0x28c89df6d88eb243612fd4da8f9d3dffe41634ed')

  //function editOrg(bytes32 _orgHash, uint _threshold, address[] memory _owners)
  var lodash = require('lodash')
  var this_function_abi = lodash.find(config.abi, { name: 'editOrg' })
  var payloadData = [orgHash,orgAddress,threshold,signers]
  var txPayloadData = web3.eth.abi.encodeFunctionCall(this_function_abi, payloadData)
  var transValue = web3.utils.toHex(0)

  alert("call dataNode editOrg :: " + txPayloadData) 

  let sendToPeerId = PeerId.createFromB58String('QmdiF2cLAE3MtcE7Xw3qR6nk9inFiqUS4tbwQWdAuEByVd')
  PeerInfo.create(sendToPeerId, (err, sendToPeerInfo) => {
    node.dialProtocol(sendToPeerInfo, '/disberse/gasnnonce', (err, conn) => {
      pull(
        pull.values([address_from]),
        conn,
        pull.collect((err, data) => {
          if (err) { 
            console.log(err) 
          } else {
            const returnData = data.toString().split("::")

            // these will need to grab data automatically - how ?????
            var nonceHex = web3.utils.toHex(returnData[2])
            var gasPrice = returnData[1]
            var gasPriceHex = web3.utils.toHex(gasPrice)
            var gasLimitHex = web3.utils.toHex(200000)

            var thisTx = {
              from: address_from,
              to: contract_address,
              value: transValue,
              data: txPayloadData,
              nonce: nonceHex,
              gasPrice: gasPriceHex,
              gasLimit: gasLimitHex,
            }
            alert(thisTx)

            var tx = new Tx(thisTx)
            tx.sign(pKey)
            var serializedTx = tx.serialize()

            node.dialProtocol(sendToPeerInfo, '/disberse/sendtx', (err, conn) => {
              pull(
                pull.values([serializedTx.toString('hex')]),
                conn,
                pull.collect((err, data) => {
                  if (err) { console.log(err) 
//                    console.log(err)
                  }
                  console.log('received hash:', data.toString())
                  console.log(tx.hash().toString('hex'))
//                  callback(null,'0x'+tx.hash().toString('hex'))
                  //save 
//                  let txsHashObj = {}
//                  store.set("txsHashs",txsHashObj)
                })
              )
              console.log("sent: " + serializedTx.toString('hex'))
            })
          }
        })
      )
    })
  })
}

const testDepositCall = (data) => {
  let msg = "hello"
  let sendToPeerId = PeerId.createFromB58String('QmdiF2cLAE3MtcE7Xw3qR6nk9inFiqUS4tbwQWdAuEByVd')
//alert("id: " + sendToPeerId)
  PeerInfo.create(sendToPeerId, (err, sendToPeerInfo) => {
    node.dialProtocol(sendToPeerInfo, '/disberse/deposit', (err, conn) => {
      pull(
        pull.values([msg]),
        conn
      )
      console.log("sent: " + msg)
    })
  })
}

const sendRedeemDataBootNode = (data, callback) => {
  var address_to = config.disberse_admin_address
  var address_from = store.get('address')
  var pKey = thisHdWallet.getWallet().getPrivateKey()

  var disberse_abi = config.abi
  var owner_address = config.owner_address
  var contract_address = config.contract_address
  var type = data.type

  let typeId
  for(let i=0; i<config.currencies.length; i++) 
    if(config.currencies[i] === data.typeRedeem)
      typeId = i

  var lodash = require('lodash')
  var this_function_abi = lodash.find(config.abi, { name: 'transfer' })
//  var payloadData = [data.receiver,data.amount,web3.utils.fromAscii(data.projectName),typeId]
//  var txPayloadData = web3.eth.abi.encodeFunctionCall(this_function_abi, payloadData)
  var payloadData = [address_to,data.amount,web3.utils.fromAscii(data.projectRedeem),typeId]
  var txPayloadData = web3.eth.abi.encodeFunctionCall(this_function_abi, payloadData)
  var transValue = web3.utils.toHex(0)
console.log(payloadData)

  let sendToPeerId = PeerId.createFromB58String('QmdiF2cLAE3MtcE7Xw3qR6nk9inFiqUS4tbwQWdAuEByVd')
  PeerInfo.create(sendToPeerId, (err, sendToPeerInfo) => {
    node.dialProtocol(sendToPeerInfo, '/disberse/gasnnonce', (err, conn) => {
      pull(
        pull.values([address_from]),
        conn,
        pull.collect((err, data) => {
          if (err) { 
            console.log(err) 
            callback(err)
          }
          console.log('received echo:', data.toString())
          // do you thing here
          const returnData = data.toString().split("::")

          // these will need to grab data automatically - how ?????
          var nonceHex = web3.utils.toHex(returnData[2])
          var gasPrice = returnData[1]
          var gasPriceHex = web3.utils.toHex(gasPrice)
          var gasLimitHex = web3.utils.toHex(2000000)

          var thisTx = {
            from: address_from,
            to: contract_address,
            value: transValue,
            data: txPayloadData,
            nonce: nonceHex,
            gasPrice: gasPriceHex,
            gasLimit: gasLimitHex,
          }
//console.log(thisTx)

          var tx = new Tx(thisTx)
          tx.sign(pKey)
          var serializedTx = tx.serialize()

          node.dialProtocol(sendToPeerInfo, '/disberse/sendtx', (err, conn) => {
            pull(
              pull.values([serializedTx.toString('hex')]),
              conn,
              pull.collect((err, data) => {
                if (err) { console.log(err) 
                  callback(err)
                }
                console.log('received hash:', data.toString())
                console.log(tx.hash().toString('hex'))
                callback(null,'0x'+tx.hash().toString('hex'))
                //save 
//                let txsHashObj = {}
//                store.set("txsHashs",txsHashObj)
              })
            )
            console.log("sent: " + serializedTx.toString('hex'))
          })
        })
      )  
    })
  })
}

const sendSendDataReceiverNode = (data, callback) => {
  var address_from = store.get('address')
  callback(null,'hash')
  callback("sendSendDataReceiverNode",'hash')
}

const sendSendDataBootNode = (data, callback) => {
  var address_from = store.get('address')
  var pKey = thisHdWallet.getWallet().getPrivateKey()

  var disberse_abi = config.abi
  var owner_address = config.owner_address
  var contract_address = config.contract_address
  var type = data.type

  let typeId
  for(let i=0; i<config.currencies.length; i++) 
    if(config.currencies[i] === data.type)
      typeId = i

  if(web3.utils.isAddress(data.receiver) === false)
    callback("ERROR from sendSendDataBootNode, error not a valid to address!!!")

  var lodash = require('lodash')
  var this_function_abi = lodash.find(config.abi, { name: 'transfer' })
  var payloadData = [data.receiver,data.amount,web3.utils.fromAscii(data.projectName),typeId]
//console.log(payloadData);
  var txPayloadData = web3.eth.abi.encodeFunctionCall(this_function_abi, payloadData)
  var transValue = web3.utils.toHex(0)
  
//  Disberse.methods.transfer(this_address_to,amount,project_ref,type_id).estimateGas(function(error, gasAmount){
//  })

  let sendToPeerId = PeerId.createFromB58String('QmdiF2cLAE3MtcE7Xw3qR6nk9inFiqUS4tbwQWdAuEByVd')
  PeerInfo.create(sendToPeerId, (err, sendToPeerInfo) => {
    node.dial(sendToPeerInfo, (err, conn) => {
      if(err)
        callback(err)
      else { 

        node.dialProtocol(sendToPeerInfo, '/disberse/gasnnonce', (err, conn) => {
          pull(
            pull.values([address_from]),
            conn,
            pull.collect((err, data) => {
              if (err) { 
                console.log(err) 
                callback(err)
              }
              console.log('received echo:', data.toString())
              // do you thing here
              const returnData = data.toString().split("::")
    
              // these will need to grab data automatically - how ?????
              var nonceHex = web3.utils.toHex(returnData[2])
              var gasPrice = returnData[1]
              var gasPriceHex = web3.utils.toHex(gasPrice)
              var gasLimitHex = web3.utils.toHex(2000000)
    
              var thisTx = {
                from: address_from,
                to: contract_address,
                value: transValue,
                data: txPayloadData,
                nonce: nonceHex,
                gasPrice: gasPriceHex,
                gasLimit: gasLimitHex,
              }
  //console.log(thisTx)
  
              var tx = new Tx(thisTx)
              tx.sign(pKey)
              var serializedTx = tx.serialize()
  
              node.dialProtocol(sendToPeerInfo, '/disberse/sendtx', (err, conn) => {
                pull(
                  pull.values([serializedTx.toString('hex')]),
                  conn,
                  pull.collect((err, data) => {
                    if (err) { console.log(err) 
                      callback(err)
                    }
                    console.log('received hash:', data.toString())
                    console.log(tx.hash().toString('hex'))
                    callback(null,'0x'+tx.hash().toString('hex'))
                    //save 
//                  let txsHashObj = {}
//                  store.set("txsHashs",txsHashObj)
                  })
                )
                console.log("sent: " + serializedTx.toString('hex'))
              })
            })
          )  
        })
      }
    })
  })
}

const sendDepositDataBootNode = (data, callback) => {
//  alert("send deposit data to smart contract")

  var address_from = store.get('address')
  var pKey = thisHdWallet.getWallet().getPrivateKey()

  var disberse_abi = config.abi
  var owner_address = config.owner_address
  var contract_address = config.contract_address
  var type = data.type

//  var Disberse = new web3.eth.Contract(disberse_abi, contract_address)
  let typeId
  for(let i=0; i<config.currencies.length; i++) 
    if(config.currencies[i] === data.type)
      typeId = i

  var lodash = require('lodash')
  var this_function_abi = lodash.find(config.abi, { name: 'deposit' });
  var payloadData = [data.amount,web3.utils.fromAscii(data.projectName),typeId];
  var txPayloadData = web3.eth.abi.encodeFunctionCall(this_function_abi, payloadData)
  var transValue = web3.utils.toHex(0)


//  /ipfs/QmdiF2cLAE3MtcE7Xw3qR6nk9inFiqUS4tbwQWdAuEByVd
  let sendToPeerId = PeerId.createFromB58String('QmdiF2cLAE3MtcE7Xw3qR6nk9inFiqUS4tbwQWdAuEByVd')
//alert("id: " + sendToPeerId)
  PeerInfo.create(sendToPeerId, (err, sendToPeerInfo) => {
/*
    node.dialProtocol(sendToPeerInfo, '/disberse/deposit', (err, conn) => {
      pull(
        pull.values([address_from]),
        conn
      )
      console.log("sent: ")
    })
*/
    node.dialProtocol(sendToPeerInfo, '/disberse/gasnnonce', (err, conn) => {
      pull(
        pull.values([address_from]),
        conn,
        pull.collect((err, data) => {
          if (err) { 
            console.log(err) 
            callback(err)
          }
          console.log('received echo:', data.toString())
          // do you thing here
          const returnData = data.toString().split("::")

          // these will need to grab data automatically - how ?????
          var nonceHex = web3.utils.toHex(returnData[2])
          var gasPrice = returnData[1]
          var gasPriceHex = web3.utils.toHex(gasPrice)
          var gasLimitHex = web3.utils.toHex(2000000)

          var thisTx = {
            from: address_from,
            to: contract_address,
            value: transValue,
            data: txPayloadData,
            nonce: nonceHex,
            gasPrice: gasPriceHex,
            gasLimit: gasLimitHex,
          }
//console.log(thisTx)

          var tx = new Tx(thisTx)
          tx.sign(pKey)
          var serializedTx = tx.serialize()

          node.dialProtocol(sendToPeerInfo, '/disberse/deposit', (err, conn) => {
            pull(
              pull.values([serializedTx.toString('hex')]),
              conn,
              pull.collect((err, data) => {
                if (err) { console.log(err) 
                  callback(err)
                }
                console.log('received hash:', data.toString())
                console.log(tx.hash().toString('hex'))
                callback(null,'0x'+tx.hash().toString('hex'))
                //save 
//                let txsHashObj = {}
//                store.set("txsHashs",txsHashObj)
              })
            )
            console.log("sent: " + serializedTx.toString('hex'))
          })
        })
      )
    })
  })


/*
  var thisTx = {
    from: address_from,
    to: contract_address,
    value: transValue,
    data: txPayloadData,
    nonce: nonceHex,
    gasPrice: gasPriceHex,
    gasLimit: gasLimitHex,
  }

  var tx = new Tx(thisTx)
  tx.sign(pKey)
  var serializedTx = tx.serialize()

  console.log(serializedTx)
  console.log(thisTx)
*/
//  console.log(pKey)
//  console.log(type + " -> " + typeId)
//  console.log(Disberse)
}

const storeDepositData = (e) => {
  const elements = document.getElementById('confirmDepositForm').elements

  let out = ''
  let data = {} 
  for(let i=0; i<elements.length; i++) {
    let input = elements[i]
    out += `${input.name} :: ${input.value}\n`
    if(input.type !== 'button')
      data[input.name] = input.value
  }

  sendDepositDataBootNode(data, (err,hash) => {
    if(err) {
      console.log(err)
    } else {
      const date = new Date()
      data['timestamp'] = date 
      data['hash'] = hash 
      depositsCollection.push(data)
      store.set("deposits",depositsCollection)
    
      let sha3 = ethUtil.sha3("cmd:deposit,timestamp:" + date + ",name:" + data.name)
      txsCollection.push({cmd:'deposit','name':data.name,'type':data.type,'amount':data.amount,'projectName':data.projectName,'projectCode':data.projectCode,'timestamp':date,'sha3':sha3,'hash':hash})
      store.set("txs",txsCollection)
      txsCollection = store.get('txs')

      const div = document.getElementById('mainContent-deposit')

      let h3 = document
        .createElement('h3')
      var text = document.createTextNode("Deposited Project Funds Transaction Sent")
      h3.appendChild(text)
      div.appendChild(h3)

      let h4 = document
        .createElement('h4')
      text = document.createTextNode("TransactionId: " + hash)
      h4.appendChild(text)
      div.appendChild(h4)
    }
  })


//  store.set("txs",{cmd:'deposit','timestamp':date,'hash':hash})
//  alert("store deposit data\n" + data)
//  alert(store.get("deposits"))
}

const handleProjectChangedRedeem = (e) => {
alert(321)
}

const handleProjectChanged = (e) => {
//  alert("* " + e.target.id)
//  alert(e.target.value)
  console.log(e.target.id,e.target.value)

  let type = {}
  for(let i=0; i<depositsCollection.length; i++) 
    type[depositsCollection[i].projectName] = depositsCollection[i].type

  let typeSelect
  if(e.target.id.search(/Send$/) > 0)
    typeSelect = document.getElementById('typeSend')
  else
    typeSelect = document.getElementById('typeRedeem')

  for(let i=0; i<typeSelect.options.length; i++) {
    if(typeSelect.options[i].value == type[e.target.value])
      typeSelect.options.selectedIndex = i
  }
}

const handleSignTxClick = (e) => {
//  console.log(e)
  const txId = e.target.id.replace('signTx-','')
//  alert(txId)
  var thisMultiTx = store.get("multiTxs")[txId]
  console.log(thisMultiTx)

  var pKey = thisHdWallet.getWallet().getPrivateKey()

  var msg = 'The text in your message here'
  var h = web3.utils.keccak256(msg)
  h = ethUtil.toBuffer(h)
  const sig = ethUtil.ecsign(h, pKey)
  var r = '0x'+sig.r.toString('hex')
  var s = '0x'+sig.s.toString('hex')
  var v = sig.v

  var sha3Text = Buffer.from(thisMultiTx.sha3).toString('hex')
  console.log("aaa",r,s,v,sha3Text)
  alert(thisMultiTx.sender)

  getPeerMap((err, allPeerMap) => {
    if(err)
      console.log(err)
    else {
      let peer = {}
      console.log(allPeerMap)
      for(let j=0; j<allPeerMap.length; j++) {
//        console.log("pm",allPeerMap[j].toString())
        let p = allPeerMap[j].toString().split("::")
        peer[p[1]] = p[0]
//console.log(p, peer[p[1]])
      }
      let targetPeer = peer[thisMultiTx.sender.toLowerCase()]
      alert("see peer map\n " + targetPeer)

      let sendToPeerId = PeerId.createFromB58String(targetPeer)
      PeerInfo.create(sendToPeerId, (err, peerInfo) => {
        node.dialProtocol(peerInfo, '/disberse/signedMultiTx', (err, conn) => {
          const address_from = store.get('address')
          const myPrivateKey = Buffer.from(thisHdWallet.getWallet().getPrivateKey().toString('hex'),'hex')
          const cmdData = `signer::${address_from}::sha3::${sha3Text}`
          const data = ethUtil.sha3(cmdData)
          const vrs = ethUtil.ecsign(data, myPrivateKey)
//var pubkey = ethUtil.ecrecover(data, vrs.v, vrs.r, vrs.s)
//var addrForPubKey = ethUtil.pubToAddress(pubkey)
//console.log("signer: " + addrForPubKey.toString('hex'))
//console.log(data, vrs.v, vrs.r, vrs.s)
//          multiTx.data = data
//          multiTx.vrs  = vrs
          console.log(data,vrs)
          alert("vrs")
          let output = vrs
          output['data'] = data 
          output['signer'] = address_from 
          output['sha3'] = sha3Text 
          pull(
//            pull.values(['test data']),
            pull.values([JSON.stringify(output)]),
            conn
          )
        })
      })
      
//        node.dialProtocol(peerInfo, '/disberse/projectData', (err, conn) => {
    }
  })

//  let sendToPeerId = PeerId.createFromB58String()
/*
  node.dialProtocol(peerInfo, '/disberse/signedMultiTx', (err, conn) => {
    if(err) {
      console.log(err)
      node.hangUp(peerInfo, (err) => {
        if(err) console.log(err)
      })
    } else {
      console.log("connect to boot node")
   }
  })
*/

//  alert(thisMultiTx.sha3.toString())

//  getSignersAndThreshold((err,signers,threshold) => {
//    console.log(signers)
//    console.log(threshold)

//    let sendToPeerId = PeerId.createFromB58String(targetPeer)
/*
    let sendToPeerId = PeerId.createFromB58String(targetPeer)
    PeerInfo.create(sendToPeerId, (err, peerInfo) => {
      node.dialProtocol(peerInfo, '/disberse/signedMultiTx', (err, conn) => {

        var msg = 'The text in your message here'
        var h = web3.utils.keccak256(msg)

        const myPrivateKey = Buffer.from(thisHdWallet.getWallet().getPrivateKey().toString('hex'),'hex')
        alert(myPrivateKey)

        console.log(multiTxs[txId])
        alert("tx: " + txId)
/*

        const privKey = addr_node.getWallet().getPrivateKey()

    h = ethUtils.toBuffer(h)
    const sig = ethUtils.ecsign(h, privKey)
    var r = '0x'+sig.r.toString('hex')
    var s = '0x'+sig.s.toString('hex')
    var v = sig.v

      pull(
        pull.values([msg]),
        conn,
        pull.collect((err, data) => {
          if (err) { console.log(err) 
            console.log(err)
          } else {
            peersDone.push(targetPeer)
            multiTxsSync[i].peersDone = peersDone
            store.set("multiTxsSync",multiTxsSync)
          }
        })
      )

      })
    })
*/
//  })
}

const handleFormClick = (e) => {

  // scroll window to top position in browser
  window.scrollTo(0,0)

  console.log(window.location.href)

//alert(e.target.id)


  if(e.target.id === 'confirmDeposit') {

    storeDepositData()

    const div = document.getElementById('mainContent-deposit')
    while(div.firstChild){
    div.removeChild(div.firstChild)
    }
    div.innerHTML = "<h4> Deposit tx being sent </h4>"

  } else if(e.target.id === 'editDeposit') {
    const elements = document.getElementById('confirmDepositForm').elements
    depositForm(document.getElementById('mainContent-deposit'), "edit")
  } else if(e.target.id === 'submitRedeem') {
    let out = '' 
    const elements = document.getElementById('redeemForm').elements
    let errors = ''
    for(let i=0; i<elements.length; i++) {
//      out += `${i} -> ${elements[i]} ${elements[i].name} '${elements[i].value}'\n`
      if(elements[i].name === 'projectReedeem')
        if(elements[i].value == '')
          out += "Select a Project\n"
      if(elements[i].name === 'typeRedeem')
        if(elements[i].value == '')
          out += "Select value for Currency Type\n"
      if(elements[i].name === 'amount')
        if(elements[i].value === '')
          out += "Enter value for Amount\n"
        else if(isNaN(elements[i].value) === true)
          out += "Enter a numerical value for Amount\n"
      if(elements[i].name === 'method')
        if(elements[i].value == '')
          out += "Select transfer method for redeemed fiat\n"
      if(elements[i].name === 'trackingCode')
        if(elements[i].value == '')
          out += "Enter value for tracking code\n"
    }
    if(out != ''){
      alert(out)
    } else {
      storeRedeemData()
    }
  } else if(e.target.id === 'submitSendMulti') {
    const elements = document.getElementById('sendMultiForm').elements
    let out = '' 
    let errors = ''
    for(let i=0; i<elements.length; i++) {
      if(elements[i].name === 'project')
        if(elements[i].value == '')
          out += "Select a Project\n"
      if(elements[i].name === 'type')
        if(elements[i].value == '')
          out += "Select value for Currency Type\n"
      if(elements[i].name === 'amount')
        if(elements[i].value === '')
          out += "Enter value for Amount\n"
        else if(isNaN(elements[i].value) === true)
          out += "Enter a numerical value for Amount\n"
      if(elements[i].name === 'receiver')
        if(elements[i].value == '')
          out += "Enter disberse address for receiver account\n"
      if(elements[i].name === 'trackingCode')
        if(elements[i].value == '')
          out += "Enter value for tracking code\n"
    }
    if(out != ''){
//    display Edit form
      alert(out)
    } else {
alert("storing tx data")
      storeSendMultiData()
    }
  } else if(e.target.id === 'submitSend') {
    let out = '' 
    const elements = document.getElementById('sendForm').elements
    let errors = ''
    for(let i=0; i<elements.length; i++) {
//      out += `${i} -> ${elements[i]} ${elements[i].name}\n`
//      out += `${i} -> ${elements[i]} ${elements[i].name} "${elements[i].value}"\n`
      if(elements[i].name === 'project')
        if(elements[i].value == '')
          out += "Select a Project\n"
      if(elements[i].name === 'type')
        if(elements[i].value == '')
          out += "Select value for Currency Type\n"
      if(elements[i].name === 'amount')
        if(elements[i].value === '')
          out += "Enter value for Amount\n"
        else if(isNaN(elements[i].value) === true)
          out += "Enter a numerical value for Amount\n"
      if(elements[i].name === 'receiver')
        if(elements[i].value == '')
          out += "Enter disberse address for receiver account\n"
      if(elements[i].name === 'trackingCode')
        if(elements[i].value == '')
          out += "Enter value for tracking code\n"
    }
    if(out != ''){
//    display Edit form
      alert(out)
    } else {
      storeSendData()
    }
  } else if(e.target.id === 'submitDeposit') {
    const elements = document.getElementById('depositForm').elements
    let out = ''
    let errors = ''
    for(let i=0; i<elements.length; i++) {
      if(elements[i].name === 'type')
        if(elements[i].value == '')
          out += "Select value for Currency Type\n"
      if(elements[i].name === 'amount')
        if(elements[i].value === '')
          out += "Enter value for Amount\n"
        else if(isNaN(elements[i].value) === true)
          out += "Enter a numerical value for Amount\n"
      if(elements[i].name === 'projectName')
        if(elements[i].value == '')
          out += "Enter value for Project Name\n"
      if(elements[i].name === 'projectCode')
        if(elements[i].value == '')
          out += "Enter value for Project Code\n"
      if(elements[i].type === 'radio') 
        if(elements[i].checked === false) {
//        if(elements[i].checked === true) {
          out += "  " + elements[i].checked + "\n"
          out += "  " + elements[i].value + "\n"
        }
    }
    if(out != ''){
/*
*/
      alert(out)
    } else
      confrimDepositPage()
  } else {
    alert(e.target.id)
  }

//  const input = document.getElementById('formInput')

//  alert(input.value)
}

const formatFormElementsPersonalData = (data, form) => {

  for(let i=0; i<data.inputs.length; i++) {
    let input = data.inputs[i]
    const radioLabel = document.createElement('label')
    radioLabel.setAttribute('for', input.id)
    radioLabel.textContent = input.label
    form.appendChild(radioLabel)
    if(input.type === 'radio') {
      let br = document.createElement('br')
      form.appendChild(br)
      for(let j=0; j<input.options.length; j++) {
        const radioInput = document.createElement('input')
        radioInput.setAttribute('class', "radio-custom radio-primary")
        radioInput.setAttribute('id', input.id)
        radioInput.setAttribute('type', input.type)
        radioInput.setAttribute('name', input.name)
        radioInput.setAttribute('value', input.options[j]) 
        radioInput.setAttribute('checked',"checked") 
//        radioInput.checked = false
        form.innerHTML += input.options[j] + " "
        form.appendChild(radioInput)
      }
      form.innerHTML += "<br>"
    } else if(input.type === 'select') {
      const thisInput = document.createElement('select')
      thisInput.setAttribute('class', "form-control track-input")
      thisInput.setAttribute('id', input.id)
      thisInput.setAttribute('type', input.type)
      thisInput.setAttribute('name', input.name)
      thisInput.setAttribute('value',input.value) 
      const infoOption = document.createElement('option')
      infoOption.setAttribute('value','')
      infoOption.innerHTML += "select a currency type... "
      thisInput.appendChild(infoOption)
      for(let j=0; j<input.options.length; j++) {
        const thisOption = document.createElement('option')
        thisOption.setAttribute('value',input.options[j]) 
        thisOption.innerHTML += input.options[j] + " "
        if(input.value === input.options[j])
          thisOption.setAttribute('selected',true) 
        thisInput.appendChild(thisOption)
      }
      form.appendChild(thisInput)
    } else {
      const thisInput = document.createElement('input')
      thisInput.setAttribute('class', "form-control track-input")
      if(input.placeholder)
        thisInput.setAttribute('placeholder', input.placeholder)
      thisInput.setAttribute('id', input.id)
      thisInput.setAttribute('type', input.type)
      thisInput.setAttribute('name', input.name)
      thisInput.setAttribute('value',input.value) 
      if(input.type === 'submit' || input.type === 'button')
        thisInput.addEventListener('click',handleSubmitPersonalData)
      form.appendChild(thisInput)
    }
    let br = document.createElement('br')
    form.appendChild(br)
  }
}

const formatFormElements = (data, form) => {
  for(let i=0; i<data.inputs.length; i++) {
    let input = data.inputs[i]
    const radioLabel = document.createElement('label')
    radioLabel.setAttribute('for', input.id)
    radioLabel.textContent = input.label
    form.appendChild(radioLabel)

    if(input.type === 'radio') {

      const p = document.createElement('p')

      
      for(let j=0; j<input.options.length; j++) {

        const thisInput = document.createElement('input')
        thisInput.setAttribute('class', "radio-custom radio-primary")
        thisInput.setAttribute('id', input.id)
        thisInput.setAttribute('type', input.type)
        thisInput.setAttribute('name', input.name)
        thisInput.setAttribute('value', input.options[j]) 
        thisInput.setAttribute('checked',"checked") 
//        thisInput.outerHTML = input.options[j]
        const text = document.createTextNode(input.options[j] + ": ")
        p.appendChild(text)
        p.appendChild(thisInput)
      }
      form.appendChild(p)
    } else if(input.type === 'select') {
      const thisInput = document.createElement('select')
      thisInput.setAttribute('class', "form-control track-input")
      thisInput.setAttribute('id', input.id)
      thisInput.setAttribute('type', input.type)
      thisInput.setAttribute('name', input.name)
      thisInput.setAttribute('value',input.value) 
      const infoOption = document.createElement('option')
      infoOption.setAttribute('value','')
      if(input.id === 'projectSend' || input.id === 'projectRedeem')
        infoOption.innerHTML += "select a project... "
      else
        infoOption.innerHTML += "select a currency type... "
      thisInput.appendChild(infoOption)
      for(let j=0; j<input.options.length; j++) {
        const thisOption = document.createElement('option')
        thisOption.setAttribute('value',input.options[j]) 
        thisOption.innerHTML += input.options[j] + " "
        if(input.value === input.options[j])
          thisOption.setAttribute('selected',true) 
        thisInput.appendChild(thisOption)
      }
//      if(input.id === 'projectSend' || input.id === 'projectRedeem'){
      if(input.id === 'test'){
        thisInput.onchange = handleProjectChanged
      }
      if(input.id === 'projectSend'){
        thisInput.onchange = handleProjectChanged
      }
      if(input.id === 'projectRedeem'){
        thisInput.onchange = handleProjectChanged
//        thisInput.onchange = console.log 
//        thisInput.onchange = handleProjectChangedRedeem
//console.log(handleProjectChangedRedeem)
//console.log(thisInput)
      }
//console.log(thisInput)
      form.appendChild(thisInput)
    } else {
      const thisInput = document.createElement('input')
      thisInput.setAttribute('class', "form-control track-input")
      thisInput.setAttribute('placeholder', input.placeholder)
      thisInput.setAttribute('id', input.id)
      thisInput.setAttribute('type', input.type)
      thisInput.setAttribute('name', input.name)
      thisInput.setAttribute('value',input.value) 
      if(!input.placeholder)
        thisInput.setAttribute('placeholder',input.value) 
      if(input.type === 'submit' || input.type === 'button')
        thisInput.addEventListener('click',handleFormClick)
      form.appendChild(thisInput)
    }
    let br = document.createElement('br')
    form.appendChild(br)
  }
}

const getTokenBalances = () => {

  let out = ""
  const cmdData = "signer::" + store.get('address') + "::balanceForType::" + store.get('address')
  const pKey = thisHdWallet.getWallet().getPrivateKey()
  let data = ethUtil.sha3(cmdData)
  let vrs = ethUtil.ecsign(data, pKey)

  const txOut = Buffer.from(
    cmdData +
    "::" +
    data.toString('hex') +
    "::" +
    vrs.v +
    "," +
    vrs.r.toString('hex') +
    "," +
    vrs.s.toString('hex')
  )
  console.log("signedTxsMmessage :: " + txOut.toString('utf8'))
  node.pubsub.publish('disberse/txs', txOut,() => {}) 

  return out

/*
  var balance = 0
  var address = store.get('address')
  var token_type_id = 0
  var disberse_abi = config.abi
  var owner_address = config.owner_address
  var contract_address = config.contract_address
  var Disberse = new web3.eth.Contract(disberse_abi, contract_address)
  Disberse.methods.getBalance(address,token_type_id).call({from:address}, function(err,res) {
    if(err) 
      alert(err)
    else {
      var return_val = {id:token_type_id,type:token_type,balance:Number(res).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,')};
      alert(return_val);
    }
  })


  alert(disberse_abi, owner_address, contract_address)
*/
}

const getBalances = () => {
  let out = ""
//  node.pubsub.publish('disberse/txs',Buffer.from(store.get('myData').email + "::" + "from browser node " + store.get('address') + "::" + node.peerInfo.id.toB58String()),() => {}) 
  const cmdData = "signer::" + store.get('address') + "::balance::" + store.get('address')
  const pKey = thisHdWallet.getWallet().getPrivateKey()

  let data = ethUtil.sha3(cmdData)

  let vrs = ethUtil.ecsign(data, pKey)

//  var pubkey = ethUtil.ecrecover(data, vrs.v, vrs.r, vrs.s);

  const txOut = Buffer.from(
    cmdData +
    "::" +
    data.toString('hex') +
    "::" +
    vrs.v +
    "," +
    vrs.r.toString('hex') +
    "," +
    vrs.s.toString('hex')
  )
  console.log("signedTxsMmessage :: " + txOut.toString('utf8'))
  node.pubsub.publish('disberse/txs', txOut,() => {}) 
//  out += "get balances for address " + store.get('address') + "<br>"
//alert(EthJSTx)
  return out
}

/*
const getBalances = () => {
  let out = ""
//  node.pubsub.publish('disberse/txs',Buffer.from(store.get('myData').email + "::" + "from browser node " + store.get('address') + "::" + node.peerInfo.id.toB58String()),() => {}) 
  const cmdData = "signer::" + store.get('address') + "::balance::" + store.get('address')
  const pKey = thisHdWallet.getWallet().getPrivateKey()

  let data = ethUtil.sha3(cmdData)

  let vrs = ethUtil.ecsign(data, pKey)

//  var pubkey = ethUtil.ecrecover(data, vrs.v, vrs.r, vrs.s);

  const txOut = Buffer.from(
    cmdData +
    "::" +
    data.toString('hex') +
    "::" +
    vrs.v +
    "," +
    vrs.r.toString('hex') +
    "," +
    vrs.s.toString('hex')
  )
  console.log("signedTxsMmessage :: " + txOut.toString('utf8'))
  node.pubsub.publish('disberse/txs', txOut,() => {}) 
//  out += "get balances for address " + store.get('address') + "<br>"
//alert(EthJSTx)
  return out
}
*/

const inactivityTimeOld = () => {
    let t
    window.onload = resetTimer;
    // DOM Events
    document.onmousemove = resetTimer;
    document.onkeypress = resetTimer;

    function logout() {
      alert("logout")

/*
      let bootServerPeerId = PeerId.createFromB58String('QmdiF2cLAE3MtcE7Xw3qR6nk9inFiqUS4tbwQWdAuEByVd')
 //     alert(bootServerPeerId)
      PeerInfo.create(bootServerPeerId, (err, bootServerPeerInfo) => {
        //disconnect() 
        bootServerPeerInfo.disconnect()
        alert('disconnected from ' + bootServerPeerInfo.id.toB58String())
      })
*/
      //location.href = 'logout.php'
    }

    function resetTimer() {
        clearTimeout(t)
        t = setTimeout(logout, (15 * 1000))
        // 1000 milisec = 1 sec
    }
}

const handleChatClick = () => {
  const form = document.getElementById('chatForm')
  for(let i=0; i<form.elements.length; i++) {
    if(form.elements[i].name == 'message'){
      node.pubsub.publish('disberse/chat',Buffer.from("<i>" + store.get('myData').email + ":</i><br>\n" + form.elements[i].value),() => {}) 
      form.elements[i].value = ''
    }
  }
}

const handleMouse = (e) => {
//  alert(e.type + " :: " + e.target.id)
//  console.log(e.target.id)

  const element = document.getElementById(e.target.id)
  
  if(e.type == 'mouseenter') {
    element.style.textDecoration = "underline"
  } else {
    element.style.textDecoration = "none"
  }
}

/*
const handleFormClick = (e) => {
  alert(e.target.id)

//  if(e.target.id == 'sideNav-dashboard') {
}
*/

const closeSignTxDiv = (e) => {
  const id = 'mainContent-signTx'
  const element = document.getElementById(id)
  element.innerHTML = ""
  element.style.display = 'none'
}

const createHref = (innerValue, element) => {
  const close = document
    .createElement('a')
  close.innerHTML = innerValue 
  close.style.padding = "5px" 
  close.setAttribute('href', '#')
  close.addEventListener('click', closeSignTxDiv, false)
  element.appendChild(close)
}

const listMultiTxs = (element) => {
  console.log(multiTxs)

  var p = document.createElement("p")
  p.innerHTML = "Organisation: " + store.get('myData').org
  element.appendChild(p)
/*
  p = document.createElement("p")
  p.innerHTML = "signers: " + signers 
  element.appendChild(p)

  p = document.createElement("p")
  p.innerHTML = "threshold: " + threshold
  element.appendChild(p)
*/
//  alert("listMultiTxs")
  const txTable = document
    .createElement('table')
  txTable.setAttribute('border','true')
//  txTable.style.top = '10px;' 
//  const tableBody = document
//    .createElement('tbody')
  var chk = {}
  for(var i=0; i<multiTxs.length; i++) {

    var sha3Hex = Buffer.from(multiTxs[i].sha3).toString('hex')
    console.log("mt",typeof sha3Hex)

    if(chk[sha3Hex] !== true) {
      const txRow = document
        .createElement('tr')
      const txData = document
        .createElement('td')
      txData.innerHTML =  multiTxs[i]['cmd']
      txRow.appendChild(txData)
      const txData0 = document
        .createElement('td')
      txData0.innerHTML =  multiTxs[i]['amount'] + " " + multiTxs[i]['type']
      txRow.appendChild(txData0)
      const txData1 = document
        .createElement('td')
      txData1.innerHTML =  multiTxs[i]['project']
      txRow.appendChild(txData1)
      const txData2 = document
        .createElement('td')
      txData2.innerHTML =  multiTxs[i]['timestamp']
      txRow.appendChild(txData2)
      const txData3 = document
        .createElement('td')
      const txDataButton3 = document
        .createElement('button')
      txDataButton3.setAttribute('id', 'signTx-' + i) 
      txDataButton3.innerHTML = "sign"
      txDataButton3.addEventListener('click', handleSignTxClick, false)
      txDataButton3.value = i
      txData3.appendChild(txDataButton3)
      txRow.appendChild(txData3)

      txTable.appendChild(txRow)
      chk[sha3Hex] = true
    }
  }
  element.appendChild(txTable)
}

const handleGetTxSignerClick = async(e) => {
}

const handleSignTxListClick = (e) => {
  const id = 'mainContent-signTx'
  const element = document.getElementById(id)
  element.innerHTML = ""

  let h4 = document.createElement("h4")
  h4.innerHTML = "Transactions to sign"
  element.appendChild(h4)

  createHref('new tx', element)
  createHref('close', element)

  if(element.style.display == 'block')
    element.style.display = 'none'
  else{
 
      listMultiTxs(element)
      getPeerMapTest((err,data) => {
        console.log(err, data)
      })

//    getSignersAndThreshold((err,signers,threshold) => {
//      console.log(signers)
//      console.log(threshold)
////      alert("getSignersAndThreshold")
//      orgSigners = signers
//      orgThreshold = threshold
//      listMultiTxs(element, signers, threshold)
//    })

//    txLib.editOrg(node, thisHdWallet, store.get('address'))
//    txLib.newOrg(node, thisHdWallet, store.get('address'))
//    txLib.updateOrg(node, thisHdWallet, store.get('address'))
//    txLib.getOrgInfo(node, thisHdWallet, store.get('address'), store.get('myData').org)
/*
    var orgInfoPromise = txLib.getOrgInfoAsync(node, thisHdWallet, store.get('address'), store.get('myData').org)
    orgInfoPromise.then(function(value){
      let valueObj = JSON.parse(value)
      let signers = valueObj.signers
      let threshold = valueObj.threshold
//      console.log("value: " + value)
//      console.log("signers: " + signers)
//      console.log("threshold: " + threshold)
    })
*/
//    txLib.newOrg(node, thisHdWallet, store.get('address'))
//    txLib.getOrgInfo(node, thisHdWallet, store.get('address'))
//    testEditOrgCall()
//alert(txLib.hello())
//alert(txLib.test("data input field"))
//console.log(txLib.hello())
//console.log(txLib.test("data"))

//    getOrgInfo()

//    testVerifyWithPrefixAndSendCall()

//verifyWithPrefixAndSend(bytes32 _orgHash, uint8[] memory sigV, bytes32[] memory sigR, bytes32[] memory sigS, bytes32[] memory _h, address[] memory signers, uint _value, uint _type, bytes8 projectName)

/*
        position: fixed; 
        display: none; 
        width: 100%; 
        height: 100%; 
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255,255,255,0.95); 
        z-index: 2;
*/


    element.style.zIndex = '2'
    element.style.position = 'fixed'
    element.style.border = '1px solid grey'
    element.style.width  = '500px'
    element.style.height = '350px'
    element.style.left  = (e.clientX - 500) + 'px'
//alert(e.clientX)
    var Y = e.clientY + 10;
    element.style.top  = Y + 'px'
    element.style.backgroundColor = "rgba(255,255,255,1.00)" 
    element.style.display = 'block'
  }
}

const handleDataClick = (e) => {

  const id = 'mainContent-dashboard'
  const element = document.getElementById(id)
  element.innerHTML = ""

  let h4 = document.createElement("h4")
  h4.innerHTML = "My Data"
  element.appendChild(h4)

  store.each(function(value, key) {
//    console.log(key, '==', value)
    element.innerHTML += `${key}:<br>`// ${value}<br>`
//if(typeof key === 'object')
//console.log(typeof value)
    if(typeof value === 'object' && value !== null){
      element.innerHTML += `object<br>`
      if(!value.length){
        console.log(key + " -- " + value + "\n")
      } else {
        console.log(key + " -- " + value + "\n" + value.length)
        for(let i=0; i<value.length; i++) {
          console.log(i + ": " + value[i])
        }
      }
    } else
      element.innerHTML += `${value}<br>`
      
  })

  element.style.display = 'block'
}

const handleImportClick = (e) => {
  alert("Import Data Page")

//  let password = "321"
  let encrypted = prompt("Please enter your data", "")
  let password = prompt("Please enter your password", "")
  console.log(encrypted)
  if (encrypted != null) {
    var algorithm = 'aes256'
    var decipher = crypto.createDecipher(algorithm, password)
    var decrypted = decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8')
    console.log(encrypted)
    console.log(JSON.parse(decrypted))

    let exportedData = JSON.parse(decrypted)
    for(let i=0; i<exportedData.length; i++) {
      if(exportedData[i].key !== 'sendTxsSync'){
        console.log(exportedData[i]) 
        console.log(exportedData[i].key)
        console.log(exportedData[i].value)
        store.set(exportedData[i].key, exportedData[i].value)
        if(exportedData[i].key === 'txs')
          txsCollection = store.get('txs')
        if(exportedData[i].key === 'deposits')
          depositsCollection = store.get('deposits')
      }
    }
  
  }
}

const handleExportClick = (e) => {
//  alert("Export Data Page")
  let storeDataExport = []
  let out = 'store data<br>'
  store.each(function(value, key) {
    storeDataExport.push({key:key,value:value}) 
//alert(typeof(value))
/*
    if(typeof value === 'object') {
      out += key + " :: \n"
      for(var key in value) {
        var thisValue = value[key]
        out += "   " + key + " :: " + thisValue + "\n"
      }
    } else
      out += key + " :: " + value + "\n"
*/
  })
//  alert(out)
  console.log(storeDataExport)
//  console.log(JSON.stringify(storeDataExport))
  let encrypted = null
  let  password = prompt("Please enter your password", "")
  if (password != null) {
    var algorithm = 'aes256'
    var cipher = crypto.createCipher(algorithm, password)
    encrypted = cipher.update(JSON.stringify(storeDataExport), 'utf8', 'hex') + cipher.final('hex')
    var decipher = crypto.createDecipher(algorithm, password)
    var decrypted = decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8')
    console.log(encrypted)
    console.log(JSON.parse(decrypted))

    var textarea = document.getElementById("encryptedData")

    if(textarea === null) {
      textarea = document.createElement("textarea")
    } else
      textarea.parentNode.removeChild(textarea)
    textarea.readOnly = true
    textarea.id = "encryptedData"
    textarea.rows = "10"
    textarea.cols = "100"
    textarea.value = encrypted
    document.body.appendChild(textarea)

    QRCode.toDataURL(encrypted, function (err, url) {
      var qrcodeImage = document.getElementById("encryptedDataQRImage")
      if(qrcodeImage === null) {
        qrcodeImage = document.createElement("img")
      } else
        qrcodeImage.parentNode.removeChild(qrcodeImage)
      qrcodeImage.id = "encryptedDataQRImage"
      qrcodeImage.src = url
      document.body.appendChild(qrcodeImage)
      console.log(url)
    }) 
  }
//  var encodedUri = encodeURI(storeDataExport)
//  window.open(encodedUri)
  var encodedUri = encodeURI(encrypted)
  var link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "my_data.json");
//  document.body.appendChild(link)
//  link.click()
}

const handleClick = (e) => {

  window.scrollTo(0,0)
  var stateObj = { click: e.target.id }
//  history.pushState(stateObj, e.target.id, "#" + e.target.id.replace(/^sideNav-/,''))
  console.log(window.location.href)
//alert(e.target.id)

  for (var type in mainContentStatus) {
    if(mainContentStatus[type] == true) {
      const id = 'mainContent-' + type
//      alert('mainContent-' + type)
      document.getElementById(id).style.display = 'none'
      mainContentStatus[type] = false 
    }
  }

  if(e.target.id == 'sideNav-home') {
    const id = 'mainContent-' + 'dashboard' 
    const element = document.getElementById(id) 
    element.innerHTML = "<p>Your Token Balances</p>"
    element.innerHTML += getBalances() + "<hr>"
    getTokenBalances()
//    element.getElementById(id).innerHTML += node.peerInfo.id.toB58String()
    element.style.display = 'block'
    mainContentStatus['dashboard'] = true
  } else if(e.target.id == 'sideNav-dashboard') {
    const id = 'mainContent-' + 'dashboard' 
    const element = document.getElementById(id) 
    element.innerHTML = "<p>mainContent-Balances</p>"
    element.innerHTML += getBalances() + "<hr>"
    getTokenBalances()
//    element.getElementById(id).innerHTML += node.peerInfo.id.toB58String()
    element.style.display = 'block'
    mainContentStatus['dashboard'] = true
  } else if(e.target.id == 'sideNav-transactions') {
    const id = 'mainContent-' + 'transactions' 
    document.getElementById(id).style.display = 'block'
    mainContentStatus['transactions'] = true
    txsPage(document.getElementById(id))
  } else if(e.target.id == 'sideNav-projects') {
    const id = 'mainContent-' + 'projects' 
    document.getElementById(id).style.display = 'block'
    mainContentStatus['projects'] = true
    projectsPage(document.getElementById(id))
  } else if(e.target.id == 'sideNav-rates') {
    const id = 'mainContent-' + 'rates' 
    document.getElementById(id).style.display = 'block'
    mainContentStatus['rates'] = true
//testDepositCall()
  } else if(e.target.id == 'sideNav-deposit') {
    const id = 'mainContent-' + 'deposit' 
    document.getElementById(id).style.display = 'block'
    const element = document.getElementById(id) 
//    element.innerHTML = "<h4>Deposit Form</h4>"
    render.getDepositPage(element)
    mainContentStatus['deposit'] = true
  } else if(e.target.id == 'sideNav-send-multi') {
    const id = 'mainContent-' + 'send-multi' 
    document.getElementById(id).style.display = 'block'
    const element = document.getElementById(id) 
    render.getSendMultiForm(element)
    mainContentStatus['send-multi'] = true
  } else if(e.target.id == 'sideNav-send') {
    const id = 'mainContent-' + 'send' 
    document.getElementById(id).style.display = 'block'
    const element = document.getElementById(id) 
    render.getSendForm(element)
    mainContentStatus['send'] = true
  } else if(e.target.id == 'sideNav-redeem') {
    const id = 'mainContent-' + 'redeem' 
    document.getElementById(id).style.display = 'block'
    const element = document.getElementById(id) 
    render.getRedeemForm(element)
    mainContentStatus['redeem'] = true
  } else if(e.target.id == 'sideNav-chat') {
    const id = 'mainContent-' + 'chat' 
    document.getElementById(id).style.display = 'block'
    mainContentStatus['chat'] = true
  } else {
    document.cookie = "authed=false; path=/"; location.reload()
  }
//console.log(e.currentTarget)
}


const handleSubmitLoginData = () => {
  const form = document.getElementById('loginForm')
  for(let i=0; i<form.elements.length; i++) {
    if(form.elements[i].name == 'pass') {
      if(form.elements[i].value == store.get('myData').pass) {
        document.cookie = "authed=true; path=/"
        store.set("pauthed", true)
        location.reload()
        overlayDiv.style.display = "none"
      } else {
        form.elements[i].value = ''
        document.cookie = "authed=false; path=/"
        store.set("pauthed", false)
        alert("Password not correct")
        location.reload()
      }
    }
  }
}

const handleSubmitPersonalDataEdit = () => {
/*
  alert("handle Edit Personal Data")
  const form = document.getElementById('personalDataForm')
  const submitButton = document.getElementById('submit')
  overlayDiv.style.display = "none"
  personalDataForm')

  let out = ''
  let chk = 0
  let chk2 = 0
  let pchk = false
  let pass = ''
  let passChk = ''
  let myData = {}
  for(let i=0; i<form.elements.length; i++) {
    myData[form.elements[i].name] = form.elements[i].value
    if(form.elements[i].id == 'Password')
      pass = form.elements[i].value 
    if(form.elements[i].id == 'Password Check')
      passChk = form.elements[i].value 
    if(form.elements[i].id != 'submit') {
      chk++
      if(form.elements[i].value == '') {
        chk2++
        out += "No value for " + form.elements[i].id + "\n"
      } 
    }
*/
}

const handleImportPersonalData = (e) => {
//  alert(e.target.id)
  handleImportClick(e)
  location.reload()
}

const handleSubmitPersonalData = (e) => {

//  alert(e.target.id)

  if(e.target.id == 'cancel'){
    overlayDiv.style.display = "none"
    return
  }

//  alert(e.target.id)

  const myAccountDataDiv = document.getElementById('my-account-data')
  const submitButton = document.getElementById('submit')
  const form = document.getElementById('personalDataForm')


  let out = ''
  let chk = 0
  let chk2 = 0
  let pchk = false
  let pass = ''
  let passChk = ''
  let myData = {}
  for(let i=0; i<form.elements.length; i++) {
    myData[form.elements[i].name] = form.elements[i].value
    if(form.elements[i].id == 'Password')
      pass = form.elements[i].value 
    if(form.elements[i].id == 'Password Check')
      passChk = form.elements[i].value 
    if(form.elements[i].id != 'submit') {
      chk++
      if(form.elements[i].value == '') {
        chk2++
        out += "No value for " + form.elements[i].id + "\n"
      } 
    }
  }
  
  if(pass != '' && passChk != '' && pass != passChk){
    out += "Password and Password Check do not match!\n"
    for(let i=0; i<form.elements.length; i++) {
      if(form.elements[i].id == 'Password Check' || form.elements[i].id == 'Password')
        form.elements[i].value = ''
    }
  }

  if(chk2 == 0 && pass == passChk) {
    store.set('myData', myData)
    render.personalDataFormLink()
    topOrgDiv.innerHTML = store.get('myData').org
    console.log(store.get('address') + ": updated personal details OKAY")
//    alert(store.get('myData').org)
//    alert(JSON.stringify(myData))
    overlayDiv.style.display = "none"
  } else {
    alert(out)
//    alert(store.get('address') + ": updated personal details")
    console.log(store.get('address') + ": failed to updated personal details : " + out)
//    console.log(store.get('myData'))
  }

  return false 
}

var render = {
  address: '0x',
  firstName: '',
  lastName: '',
  email: '',
  info: function (info) { 
    console.log('Info: ' + info);
  },
  warning:function (warning) { 
    console.log('Warning: ' + warning);
  },
  error:function (error) { 
    console.log('Error: ' + error);
  },

  allPages: (node, initHdWallet, thisTokenBalances) => {

    tokenBalances = thisTokenBalances
    
//    const reloadParam = window.location.href.replace(/^.*#/, '#')
    const reloadParam = window.location.href.split('#')[1]
    console.log("reload --> " + reloadParam)

//    let date = new Date()
//    document.title += " (" + config.version + "/" + date + ")"

    thisHdWallet = initHdWallet
    render.chatPage()
    render.dashboardPage(true, node)
    render.transactionsPage(false)
    render.projectsPage(false)
    render.ratesPage(false)
    render.depositPage(false)
    render.sendPage(false)
    render.sendPageMulti(false)
    render.redeemPage(false)
    render.signTxPage(false)
//    inactivityTime()

    inactivityTime()

    // on reload/back/forward etc, display correct page
    if(reloadParam) {
      const displayDiv = document.getElementById('mainContent-' + reloadParam)
      displayDiv.style.display = 'block'
alert(displayDiv)
    }

  },

  chatPage: (visable) => {
    const chatFormDiv = document
      .createElement('div')
    chatFormDiv.setAttribute('id', 'mainContent-chat')
    chatFormDiv.setAttribute('style', 'display:block;border:0px solid green;') 
    chatFormDiv.innerHTML = ""//"mainContent-chat"
    chatFormDiv.style.display = 'none'
    mainContentDiv.appendChild(chatFormDiv)

    const heading = document.createElement('h1')
    heading.innerHTML = "Chat Form"
    chatFormDiv.appendChild(heading)

    const form = document.createElement('form')
    form.setAttribute('id', 'chatForm') 

    let input = document.createElement('input')
    input.setAttribute('id', 'mainContent-chat-message') 
    input.setAttribute('name', 'message') 
    form.appendChild(input)

    input = document.createElement('input')
    input.setAttribute('id', 'submit') 
    input.setAttribute('type', 'submit') 
    input.setAttribute('name', 'submit') 
    input.setAttribute('value', 'publish to disberse/chat room') 
    input.setAttribute('onclick', 'return false') 
    input.addEventListener('click', handleChatClick, false)
    form.appendChild(input)

    chatFormDiv.appendChild(form)

    const messageHeading = document.createElement('h4')
    messageHeading.setAttribute('style', 'padding:10px;') 
    messageHeading.innerHTML = "Chat room messages"

    const messageOutDiv = document.createElement('div')
    messageOutDiv.setAttribute('id', 'chatMessageOut') 
    messageOutDiv.setAttribute('style', 'display:inline-block;border:0px solid red; padding-left:25px; padding-bottom: 30px;') 
//    messageOutDiv.innerHTML = '<br><h3>Chat room messages</h3><hr>' 

    chatFormDiv.appendChild(messageHeading)
    chatFormDiv.appendChild(messageOutDiv)

  },

  projectsPage: (visable) => {
    const newElement = document
      .createElement('div')
    newElement.setAttribute('id', 'mainContent-projects')
    newElement.innerHTML = "mainContent-projects"
    mainContentDiv.appendChild(newElement)
    newElement.style.display = 'none'
  },

  ratesPage: (visable) => {
    const newElement = document
      .createElement('div')
    newElement.setAttribute('id', 'mainContent-rates')
    newElement.innerHTML = "mainContent-rates"
    mainContentDiv.appendChild(newElement)
    newElement.style.display = 'none'
  },

  depositPage: (visable) => {
    const newElement = document
      .createElement('div')
    newElement.setAttribute('id', 'mainContent-deposit')
    newElement.innerHTML = "<h4>Deposit Funds Form</h4>"
    render.getDepositPage(newElement) 
    mainContentDiv.appendChild(newElement)
    newElement.style.display = 'none'
  },

  sendPage: (visable) => {
    const newElement = document
      .createElement('div')
    newElement.setAttribute('id', 'mainContent-send')
    newElement.innerHTML = "<h4>Send Funds Form</h4>"
    render.getSendForm(newElement)
    mainContentDiv.appendChild(newElement)
    newElement.style.display = 'none'
  },

  sendPageMulti: (visable) => {
    const newElement = document
      .createElement('div')
    newElement.setAttribute('id', 'mainContent-send-multi')
    newElement.innerHTML = "<h4>Send Funds Form (multi sig)</h4>"
    render.getSendForm(newElement)
    mainContentDiv.appendChild(newElement)
    newElement.style.display = 'none'
  },

  redeemPage: (visable) => {
    const newElement = document
      .createElement('div')
    newElement.setAttribute('id', 'mainContent-redeem')
    newElement.innerHTML = "<h4>Redeem Funds Form</h4>"
    render.getRedeemForm(newElement)
    mainContentDiv.appendChild(newElement)
    newElement.style.display = 'none'
  },

  transactionsPage: (visable) => { 
    const newElement = document
      .createElement('div')
    newElement.setAttribute('id', 'mainContent-transactions')
    newElement.innerHTML = "mainContent-transactions"
    mainContentDiv.appendChild(newElement)
    newElement.style.display = 'none'
  },

  signTxPage:function (visable, node) { 
    const newElement = document
      .createElement('div')
    newElement.setAttribute('id', 'mainContent-signTx')
    newElement.innerHTML = "mainContent-signTx"
    mainContentDiv.appendChild(newElement)
    newElement.style.display = 'none'
  },

  dashboardPage:function (visable, node) { 
    const newElement = document
      .createElement('div')
    newElement.setAttribute('id', 'mainContent-dashboard')
    newElement.innerHTML = "mainContent-dashboard"
    mainContentDiv.appendChild(newElement)

    let element

    element = document
      .createElement('div')
    element.setAttribute('id', 'mainContent-Balances')
    element.innerHTML += "<p>mainContent-Balances</p>"
//    element.innerHTML += getBalances(node) + "<hr>"
//    element.innerHTML += node.peerInfo.id.toB58String()
    newElement.appendChild(element)

    element = document
      .createElement('div')
    element.setAttribute('id', 'mainContent-Transactions')
    element.innerHTML += "mainContent-Transactions"
    newElement.appendChild(element)

    element = document
      .createElement('div')
    element.setAttribute('id', 'mainContent-Projects')
    element.innerHTML += "mainContent-Projects"
    newElement.appendChild(element)

//    const reloadParam = window.location.href.replace(/^.*#/, '#')
    const reloadParam = window.location.href.split('#')[1]
    if(!reloadParam || reloadParam == 'projects')
      newElement.style.display = 'block'
    else
      newElement.style.display = 'none'
  },

  menuLink:function (id,name) { 
    const linkA = document
      .createElement('a')
    linkA.innerHTML = name
    linkA.setAttribute('id', id)
    linkA.setAttribute('href', '#')
    linkA.addEventListener('click', handleClick, false)
    sideNavDiv.appendChild(linkA)
    sideNavDiv.innerHTML += " | "
  },
/*
  menuLink: function (id, name) => {
    const linkA = document
      .createElement('a')
    linkA.innerHTML = name
    linkA.setAttribute('id', id)
    linkA.setAttribute('href', '#')
    linkA.addEventListener('click', render.handleClick, false)
    sideNavDiv.appendChild(linkA)

    sideNavDiv.innerHTML += " | "
  },
*/
  personalLoginForm: function (data, div) {
    console.log("cookie: " + getCookie('authed'))
    console.log(data)
    let out = "<h1>" + data.title + "</h1>\n<form id='loginForm'>\n<div class=\"form-group\">\n"
    for(let i=0; i<data.inputs.length; i++) {
      let input = data.inputs[i]
      out += "<lable for=\"" + input.id + "\" >" + input.label + "</label>\n<input class=\"form-control\" aria-describedby=\"emailHelp\" placeholder=\"Enter "+ input.label + "\" type=\"" + 
        input.type + 
        "\" name=\"" + input.name + 
        "\" id=\"" + input.id + 
        "\" value=\"" + input.value + 
        "\" onclick=\"" + input.onclick + 
        "\" class=\"btn btn-primary\"><br/>\n"
    }
    out += "</div></form>" 
//console.log(div)
    div.innerHTML = out

    const submitButton = document.getElementById('submit')
    submitButton.addEventListener('click', handleSubmitLoginData);
  },

  personalDataForm: function (data, div) {
    console.log(data)
    let out = "<h1>" + data.title + "</h1>\n<form id='personalDataForm'>\n<div class=\"form-group\">\n"
    for(let i=0; i<data.inputs.length; i++) {
      let input = data.inputs[i]
      out += "<lable for=\"" + input.id + "\" >" + input.label + "</label>\n<input class=\"form-control\" aria-describedby=\"emailHelp\" placeholder=\"Enter "+ input.label + "\" type=\"" + 
        input.type + 
        "\" name=\"" + input.name + 
        "\" id=\"" + input.id + 
        "\" value=\"" + input.value + 
        "\" onclick=\"" + input.onclick + 
        "\" class=\"btn btn-primary\"><br/>\n"
    }
    out += "</div></form>" 
//console.log(div)
    div.innerHTML = out

    const submitButton = document.getElementById('submit')
    submitButton.addEventListener('click', handleSubmitPersonalData);

    const importButton = document.getElementById('import')
    importButton.addEventListener('click', handleImportPersonalData);
//    importButton.addEventListener('click', handleImportClick);

//    alert(submitButton)

    console.log(out)
  },

  getRedeemForm: function (div) {
    redeemForm(div)
/*
    let out = ''
    let data = {}
    out += "<h4>Redeem Funds</h4>"
    data.inputs = []
    let projects = ['Project 1','Project 2']
    data.inputs.push({id: 'project', type: 'select', name: 'project', value:'',label:'Select Project', options:projects})
    data.inputs.push({id: 'type', type: 'select', name: 'type', value:'',label:'Currency Type', options:currencies})
    data.inputs.push({id: 'amount', type: 'text', name: 'amount', value:'',label:'Amount'})
    data.inputs.push({id: 'method', type: 'radio', name: 'method', value:'',label:'Select method',options:transferMethods})
    data.inputs.push({id: 'trackingCode', type: 'text', name: 'trackingCode', value:'',label:'Tracking Code'})
    data.inputs.push({id: 'submitRedeem', type: 'submit', name: 'submit', value:'Redeem Funds',label:'',onclick:'return false'})
    out += "<form id='sendForm'>\n<div class=\"form-group\">\n"
    formatFormElements(data, div)
    div.style.display = "block"
*/
  },

  getSendForm: function (div) {
    while(div.firstChild){
      div.removeChild(div.firstChild)
    }
    sendForm(div)
  },

  getSendMultiForm: function (div) {
    while(div.firstChild){
      div.removeChild(div.firstChild)
    }
    sendMultiForm(div)
  },

  getDepositPage: function (div) {
    depositForm(div)
/*
*/
  },

  getDepositPageOld: function (div) {
    let out = ''
    let data = {}
    out += "<h4>Deposit Form</h4>"
    data.inputs = []
    data.inputs.push({id: 'type', type: 'select', name: 'type', value:'',label:'Currency Type', options:currencies})
    data.inputs.push({id: 'amount', type: 'text', name: 'amount', value:'',label:'Amount',placeholder:'Enter amount to deposit'})
    data.inputs.push({id: 'projectName', type: 'text', name: 'projectName', value:'',label:'Project Name',placeholder:'Eneter project name'})
    data.inputs.push({id: 'projectCode', type: 'text', name: 'projectCode', value:'',label:'Project Code',placeholder:'Enter project code'})
    data.inputs.push({id: 'method', type: 'radio', name: 'method', value:'',label:'Select method',options:transferMethods})
    data.inputs.push({id: 'submitDeposit', type: 'submit', name: 'submit', value:'Deposit &amp; Create Project',label:'',onclick:'return false'})
    out += "<form id='depositForm'>\n<div class=\"form-group\">\n"
//    out += formatFormElements(data, div)
    formatFormElements(data, div)
/*
    for(let i=0; i<data.inputs.length; i++) {
      let input = data.inputs[i]
      if(input.type === 'radio') {
        out += "<lable for=\"" + input.id + "\" >" + input.label + "</label><br/>\n"
//<select class=\"form-control\" aria-describedby=\"emailHelp\" placeholder=\"Enter "+ input.label + "\" type=\"\" class=\"btn btn-primary\">\n"
        for(let j=0; j<input.options.length; j++) {
//          out += `<option value="${input.options[j]}">${input.options[j]}</option>\n`
          out += `${input.options[j]} <input type='radio' name='${input.name}'>\n`
        }
      } else if(input.type === 'select') {
        out += "<lable for=\"" + input.id + "\" >" + input.label + "</label>\n<select class=\"form-control\" aria-describedby=\"emailHelp\" placeholder=\"Enter "+ input.label + "\" type=\"\" class=\"btn btn-primary\">\n"
        out += "<option value=\"\">Please select....</option>\n"
        for(let j=0; j<input.options.length; j++) {
          out += `<option value="${input.options[j]}">${input.options[j]}</option>\n`
        }
//alert(input.name)
//alert(input.options)
        out += "</select>\n"
      } else {
        out += "<lable for=\"" + input.id + "\" >" + input.label + "</label>\n<input class=\"form-control\" aria-describedby=\"emailHelp\" placeholder=\"Enter "+ input.label + "\" type=\"" + 
          input.type + 
          "\" name=\"" + input.name + 
          "\" id=\"" + input.id + 
          "\" value=\"" + input.value + 
          "\" onclick=\"" + input.onclick + 
          "\" class=\"btn btn-primary\"><br/>\n"
      }
    }
*/
//    out += "</div></form>" 
//    div.innerHTML = out
    div.style.display = "block"

/*
    const submitButton = document.getElementById('deposit_submit')
alert(submitButton)
var all = document.getElementsByTagName("*")
for (var i=0, max=all.length; i < max; i++) {
  console.log(all[i].id)
}
*/
//console.log(document)
//    submitButton.addEventListener('click', handleFormClick);

  },
 
  inactivePage: function () {
    const div = document.getElementById('my-account-data')
//    var computedStyle = window.getComputedStyle(overlayDiv)
//    console.log(computedStyle['background-color'])
    console.log(div.style.backgroundColor)
    overlayDiv.style.backgroundColor = "rgba(255,255,255,0.75)"
//    console.log(div.style.backgroundColor)
    while(div.firstChild){ div.removeChild(div.firstChild) }
    const header = document.createElement('h1')
    header.textContent = "Node Inactive" 
    div.appendChild(header)

    const editLinkA = document
      .createElement('a')
    editLinkA.innerHTML = "click page restart"
    editLinkA.setAttribute('href', '#')
    editLinkA.setAttribute('id', 'restart')
    editLinkA.addEventListener('click', restartNode, false)
    window.addEventListener('click', restartNode, false)
    div.appendChild(editLinkA)

    overlayDiv.style.display = "block"
  },

  personalDataFormEdit: function () {

//    const topNavDiv = document.getElementById('topNav')

    const myData = store.get('myData')

    const divEditMyDataFrom = document.getElementById('editMyDataFrom')

    const div = document.getElementById('my-account-data')
    let data = {}
    data.title = "<h1>Register Your Personal Data</h1>"
    data.inputs = []
    data.inputs.push({id: 'Organisation', type: 'text', name: 'org', value:myData.org,label:'Organisation'})
    data.inputs.push({id: 'Email', type: 'text', name: 'email', value:myData.email,label:'Email'})
    data.inputs.push({id: 'Mobile Phone', type: 'text', name: 'tel', value:myData.tel,label:'Mobile Phone'})
    data.inputs.push({id: 'Password', type: 'password', name: 'pass', value:myData.pass,label:'Password'})
    data.inputs.push({id: 'Password Check', type: 'password', name: 'passCheck', value:'',label:'Password Check'})
    data.inputs.push({id: 'submit', type: 'button', name: 'submit', value:'save',label:'',onclick:'return false'})
//    data.inputs.push({id: 'import', type: 'button', name: 'import', value:'import',label:'',onclick:'return false'})
    data.inputs.push({id: 'cancel', type: 'button', name: 'cancel', value:'cancel',label:'',onclick:'return false'})
//    formatFormElements(data, div)


//    let out = "<h1>Edit My Personal Details Form</h1>\n<form id='personalDataForm'>\n<div class=\"form-group\">\n"

    while(div.firstChild){
      div.removeChild(div.firstChild)
    }
    
    const form = document.createElement('form') 
    form.setAttribute('id','personalDataForm')
    const header = document.createElement('h1')
    header.textContent = "Edit My Personal Details Form" 
    formatFormElementsPersonalData(data, form)
    div.appendChild(header)
    div.appendChild(form)

//    divEditMyDataFrom.appendChild(header)
//    divEditMyDataFrom.appendChild(form)

//    divEditMyDataFrom.appendChild(div)

/*
    for(let i=0; i<data.inputs.length; i++) {
      let input = data.inputs[i]
      out += "<lable for=\"" + input.id + "\" >" + input.label + "</label>\n<input class=\"form-control\" aria-describedby=\"emailHelp\" placeholder=\"Enter "+ input.label + "\" type=\"" + 
        input.type + 
        "\" name=\"" + input.name + 
        "\" id=\"" + input.id + 
        "\" value=\"" + input.value + 
        "\" onclick=\"" + input.onclick + 
        "\" class=\"btn btn-primary\"><br/>\n"
    }
    out += "</div></form>" 
//console.log(div)
//    div.innerHTML = out

//    alert("rendering pdata form edit")
//    overlayDiv.style.display = "none"

    const submitButton = document.getElementById('submit')
    submitButton.addEventListener('click', handleSubmitPersonalData);

    const cancelButton = document.getElementById('cancel')
    cancelButton.addEventListener('click', handleSubmitPersonalData);
*/
    overlayDiv.style.display = "block"
  },


  personalDataFormLink: function () {

    const myData = store.get('myData')
    const my_header_info = myData.email + " (" + store.get('address') + ")"
    topNavDiv.innerHTML = my_header_info + " " 

/*   
    const editLinkA = document
      .createElement('a')
//    editLinkA.style.marginRight = "5px"
    editLinkA.innerHTML = "edit my data"
    editLinkA.setAttribute('href', '#')
    editLinkA.addEventListener('click', render.personalDataFormEdit, false)
    editLinkA.appendChild (document.createTextNode (" | "))
    topNavDiv.appendChild(editLinkA)

    const editLinkB = document
      .createElement('a')
//    editLinkB.style.marginRight = "5px"
    editLinkB.innerHTML = "export"
    editLinkB.setAttribute('href', '#')
    editLinkB.addEventListener('click', handleExportClick)
    editLinkB.appendChild (document.createTextNode (" | "))
    topNavDiv.appendChild(editLinkB)

    const editLinkC = document
      .createElement('a')
    editLinkC.style.marginRight = "5px"
    editLinkC.innerHTML = "import"
    editLinkC.setAttribute('href', '#')
    editLinkC.addEventListener('click', handleImportClick)
    editLinkC.appendChild (document.createTextNode (" | "))
    topNavDiv.appendChild(editLinkC)

    const editLinkX= document
      .createElement('a')
    editLinkX.style.marginRight = "5px"
    editLinkX.innerHTML = "signTx"
    editLinkX.setAttribute('href', '#')
    editLinkX.addEventListener('click', handleSignTxListClick)
    editLinkX.appendChild (document.createTextNode (" | "))
    topNavDiv.appendChild(editLinkX)

    const editLinkD = document
      .createElement('a')
    editLinkD.style.marginRight = "5px"
    editLinkD.innerHTML = "data"
    editLinkD.setAttribute('href', '#')
    editLinkD.addEventListener('click', handleDataClick)
//    editLinkD.appendChild (document.createTextNode (" | "))
    topNavDiv.appendChild(editLinkD)
*/

    // start the dropdown admin menu
    const dropdownButtonDiv = document
      .createElement('div')
    dropdownButtonDiv.setAttribute('class', 'dropdown')
    dropdownButtonDiv.style.border = "0px solid red"
    dropdownButtonDiv.style.display = "block"
    dropdownButtonDiv.style.float = "right"
    dropdownButtonDiv.style.top = '-5px'
    dropdownButtonDiv.style.padding = '0px 10px 10px'

    const dropdownButton = document
      .createElement('button')
    dropdownButton.innerHTML = "my admin menu"
    dropdownButton.setAttribute('class', 'btn btn-secondary dropdown-toggle')
    dropdownButton.setAttribute('type', 'button')
    dropdownButton.setAttribute('id', 'dropdownMenuButton')
    dropdownButton.setAttribute('data-toggle', 'dropdown')
    dropdownButton.setAttribute('aria-haspopup', 'true')
    dropdownButton.setAttribute('aria-expanded', 'false')
    dropdownButton.style.color = '#999999'
//    dropdownButton.style.backgroundColor('#ffffff')
//    dropdownButton.style.backgroundColor = "rgba(255,255,255)"
    dropdownButton.style.backgroundColor = "#1565c0"

    const dropdownButtonInternalInDiv = document.createElement('div')
    dropdownButtonInternalInDiv.setAttribute('class', 'dropdown-menu')
    dropdownButtonInternalInDiv.setAttribute('aria-labelledby', 'dropdownMenuButton')

    // data-toggle="modal" data-target="#exampleModal"
    const dropdownEditMyData = document.createElement('a')
    dropdownEditMyData.innerHTML = "edit my data"
//    dropdownEditMyData.setAttribute('data-toggle', 'modal')
//    dropdownEditMyData.setAttribute('data-target', '#exampleModal')
    dropdownEditMyData.setAttribute('href', '#')
    dropdownEditMyData.addEventListener('click', render.personalDataFormEdit, false)
    dropdownEditMyData.setAttribute('class', 'dropdown-item')
    dropdownButtonInternalInDiv.appendChild(dropdownEditMyData)

    const dropdownEditExport = document.createElement('a')
    dropdownEditExport.innerHTML = "export"
    dropdownEditExport.setAttribute('href', '#')
    dropdownEditExport.addEventListener('click', handleExportClick)
    dropdownEditExport.setAttribute('class', 'dropdown-item')
    dropdownButtonInternalInDiv.appendChild(dropdownEditExport)

    const dropdownImport = document.createElement('a')
    dropdownImport.style.marginRight = "5px"
    dropdownImport.innerHTML = "import"
    dropdownImport.setAttribute('href', '#')
    dropdownImport.addEventListener('click', handleImportClick)
    dropdownImport.setAttribute('class', 'dropdown-item')
    dropdownButtonInternalInDiv.appendChild(dropdownImport)

    const dropdownSignTx= document.createElement('a')
    dropdownSignTx.style.marginRight = "5px"
    dropdownSignTx.innerHTML = "signTx"
    dropdownSignTx.setAttribute('href', '#')
    dropdownSignTx.addEventListener('click', handleSignTxListClick)
    dropdownSignTx.setAttribute('class', 'dropdown-item')
    dropdownButtonInternalInDiv.appendChild(dropdownSignTx)

    const dropdownData = document.createElement('a')
    dropdownData.style.marginRight = "5px"
    dropdownData.innerHTML = "data"
    dropdownData.setAttribute('href', '#')
    dropdownData.addEventListener('click', handleDataClick)
    dropdownData.setAttribute('class', 'dropdown-item')
    dropdownButtonInternalInDiv.appendChild(dropdownData)
/*
    const dropdownButtonInternalA0 = document.createElement('a')
    dropdownButtonInternalA0.setAttribute('class', 'dropdown-item')
    dropdownButtonInternalA0.innerHTML = "Action"
    dropdownButtonInternalA0.setAttribute('href', '#')
    dropdownButtonInternalInDiv.appendChild(dropdownButtonInternalA0)

    const dropdownButtonInternalA1 = document.createElement('a')
    dropdownButtonInternalA1.setAttribute('class', 'dropdown-item')
    dropdownButtonInternalA1.innerHTML = "Action 2"
    dropdownButtonInternalA1.setAttribute('href', '#')
    dropdownButtonInternalInDiv.appendChild(dropdownButtonInternalA1)
*/
    dropdownButton.appendChild(dropdownButtonInternalInDiv)
    dropdownButtonDiv.appendChild(dropdownButton)
    topNavDiv.appendChild(dropdownButtonDiv)
  },


  sideNav: function () {

    let thisElement 

//    let menuItem = ["chat","dashboard","transactions","projects","rates","deposit","send","send-multi","redeem","logout"]
    let menuItem = ["home","chat","transactions","projects","deposit","send","send-multi","redeem","logout"]
    for(let i=0; i<menuItem.length;i++) {
//      console.log(menuItem[i])
      thisElement = document
        .createElement('div')
      thisElement.innerHTML = menuItem[i].charAt(0).toUpperCase() + menuItem[i].slice(1);
      thisElement.setAttribute('id', "sideNav-" + menuItem[i])
      thisElement.style.cursor = "pointer"
//      thisElement.setAttribute('href', '#')
      thisElement.addEventListener('click', handleClick, false)
      thisElement.addEventListener('mouseenter', handleMouse, false)
      thisElement.addEventListener('mouseleave', handleMouse, false)
      sideNavDiv.appendChild(thisElement)
    }

  },

  setupThisSubNode: function (thisNode) {
    node = thisNode

    node.pubsub.subscribe('disberse/info',(msg) => {
      console.log("PubSub Message Peer Info", "::" ,msg.from, "::", msg.data.toString())
    },(err) => {
/*
      setTimeout(() => {
        node.pubsub.publish('disberse/info',Buffer.from(store.get('myData').email + "::" + store.get('address')),() => {})
      }, 5000)
*/
    })

    node.pubsub.subscribe('disberse/chat',(msg) => {
      const messageOut = document.getElementById('chatMessageOut')
//      messageOut.innerHTML =  msg.from + ":<br/>\n" + msg.data.toString() + "<hr style=\"padding: 2px;\">"          + messageOut.innerHTML 
      messageOut.innerHTML =  "<div style='width:1000px;border-bottom: 1px dotted black;'>" + msg.data.toString() + "</div>" + messageOut.innerHTML 
      console.log("PubSub Message", "\nmessageForm: " ,msg.from, "\nmessage: ", msg.data.toString())
    },() => {})

    node.handle('/disberse/signedMultiTx', (protocol, conn) => {
      console.log("node.handle -> signedMutliTx")
      var thisMultiTxsSync = store.get("multiTxsSync")
      pull(
        conn,
        pull.map((data) => {
          var input = JSON.parse(data.toString('utf8'))
          var thisSha3 = input.sha3
          var thisSigner = input.signer
          var thisData = Buffer.from(input.data,'hex')
          var thisR = input.r.data
          var thisS = input.s.data
          var thisV = input.v
          var pubkey = ethUtil.ecrecover(thisData, thisV, thisR, thisS)

          var count = 0
          for(var i=0; i<thisMultiTxsSync.length; i++) {
            let sha3Hex = Buffer.from(thisMultiTxsSync[i].sha3).toString('hex')
            if(sha3Hex === thisSha3)
              count = i
          }
          let sha3Hex = Buffer.from(thisMultiTxsSync[count].sha3).toString('hex')
          
//          var tx = JSON.parse(data.toString())
          console.log('signer address -> 0x' + ethUtil.pubToAddress(pubkey).toString('hex'), thisSha3)
          console.log(sha3Hex ,thisSha3)
          if('0x' + ethUtil.pubToAddress(pubkey).toString('hex') === thisSigner && sha3Hex === thisSha3) {
//            alert("okay: sha3 and " + thisSigner)
//            alert(count)
            if(multiTxsSync[count]['signerData']) {
//              alert(multiTxsSync[count]['signerData'].length)
              var chk = false
              var out = 'out:\n'
              for(var i=0; i<multiTxsSync[count]['signerData'].length; i++) {
                if(multiTxsSync[count]['signerData'][i].signer === thisSigner && multiTxsSync[count]['signerData'][i].sha3 === thisSha3)               
                  chk = true
                out += multiTxsSync[count]['signerData'][i].signer + " /// " + multiTxsSync[count]['signerData'][i].sha3 + "\n"
              }
              console.log(out)
              chk = true
              if(chk === false){ 
                multiTxsSync[count]['signerData'].push(input)
                console.log("added:",input)
              }
            } else {
              multiTxsSync[count]['signerData'] = []
              multiTxsSync[count]['signerData'].push(input)
            }
//            console.log(multiTxsSync[count]['signerData'])
            store.set("multiTxsSync",multiTxsSync)
            console.log("added signing data:", count)
            

            getSignersAndThreshold((err,signers,threshold) => {
              if(err)
                console.log(err)
              else {
                if(multiTxsSync[count]['signerData'].length === (threshold - 1)){
                  console.log("signers count okay", multiTxsSync[count]['signerData'].length, signers,threshold)
                  console.log(prepareSignMultiTx(count, multiTxsSync[count]))
                  alert("signers count okay", multiTxsSync[count]['signerData'].length, signers,threshold)
                } else {
                  alert("more signers needed", signers,threshold)
                }
              }
            })
          } else
            alert("NOT okay: " + thisSigner)
//          console.log(thisSigner.toString('utf8'))
//          alert(data.toString('utf8'))
//          callback(Buffer.from(data.toString()).toString('utf8'))
        }),
        pull.drain(()=>{})
      )
    })

    node.handle('/disberse/multiData', (protocol, conn) => {
      console.log('call to handle /disberse/multiData') 
      pull(
        conn,
        pull.asyncMap((data, callback) => {
          var tx = JSON.parse(data.toString())
console.log(tx)

          var pubkey = ethUtil.ecrecover(Buffer.from(tx.data,'hex'), tx.vrs.v, tx.vrs.r.data, tx.vrs.s.data)
          if('0x' + ethUtil.pubToAddress(pubkey).toString('hex') === tx.sender){
            console.log("sender is the signer okay")
            let chk = false
            let out = ""
            for(i=0;i<multiTxs.length;i++){
console.log(multiTxs[i])
              out += tx.sha3.toString()+"\n"
              if(multiTxs[i].sha3 === tx.sha3)
                chk = true
            }
            if(chk === false) {
              multiTxs.push(tx)
              store.set("multiTxs",multiTxs)
              callback(null,"true-" + tx.hash)
            }
//            console.log("addr: " + ethUtil.pubToAddress(pubkey).toString('hex'))
//            console.log("senderAddr: " + tx.sender)
          } else {
            console.log("sender is NOT the signer!!!!")
            callback(null,"false-" + tx.hash)
          }
        }),
        conn
      )
    })

    node.handle('/disberse/projectData', (protocol, conn) => {
      console.log('call to handle /disberse/projectData') 
      pull(
        conn,
        pull.asyncMap((data, callback) => {
          var tx = JSON.parse(data.toString())
          var pubkey = ethUtil.ecrecover(Buffer.from(tx.data,'hex'), tx.vrs.v, tx.vrs.r.data, tx.vrs.s.data)
          if('0x' + ethUtil.pubToAddress(pubkey).toString('hex') === tx.sender){
            console.log("sender is the signer okay")

            console.log(tx)

            txsCollection.push(tx)
            store.set("txs",txsCollection)

//            if(tx.cmd === 'deposit') {
//              depositsCollection.push(tx)
//              store.set("deposits",depositsCollection)
//            }

            callback(null,"true-" + tx.hash)
//            console.log("addr: " + ethUtil.pubToAddress(pubkey).toString('hex'))
//            console.log("senderAddr: " + tx.sender)
          } else {
            console.log("sender is NOT the signer!!!!")
            callback(null,"false-" + tx.hash)
          }
        }),
        conn
      )
/*
      pull(
        conn,
        pull.map((data) => {
          var tx = JSON.parse(data.toString())
          var pubkey = ethUtil.ecrecover(Buffer.from(tx.data,'hex'), tx.vrs.v, tx.vrs.r.data, tx.vrs.s.data)
          if('0x' + ethUtil.pubToAddress(pubkey).toString('hex') === tx.sender){
            console.log("sender is the signer okay")
//            console.log("addr: " + ethUtil.pubToAddress(pubkey).toString('hex'))
//            console.log("senderAddr: " + tx.sender)
          }
        }),
        pull.drain(()=>{})
      )
*/
    })
  }

}

module.exports = render

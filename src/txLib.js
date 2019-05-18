const hexSortAsc = (a, b) => {
  const aHexInt = parseInt(a, 16)
  const bHexInt = parseInt(b, 16)
  return aHexInt - bHexInt
}

function txLib(config,  ethUtil, web3, PeerId, PeerInfo, Tx, pull) {
  this.hello = function() {
    console.log(config.address)
    return 'hello'
  }

  this.test = function(data) {
    return data
  }

  this.getOrgInfoAsync = function(node, thisHdWallet, fromAddress, org) {
    return new Promise((resolve,reject) => {
      const orgHash = web3.utils.keccak256(org)
      let sendToPeerId = PeerId.createFromB58String('QmdiF2cLAE3MtcE7Xw3qR6nk9inFiqUS4tbwQWdAuEByVd')
      var count = 0
      PeerInfo.create(sendToPeerId, (err, peerInfo) => {
        if(err)
          reject(err)
        else {
          node.dialProtocol(peerInfo, '/disberse/getOrgInfo', (err, conn) => {
            if(err)
              reject(err)
            else {
              pull(
                pull.values([orgHash]),
                conn,
                pull.collect((err, data) => {
                  if (err) { 
                    console.log('/disberse/getOrgInfo ERROR')
                    reject(err) 
                  } else {
//                    console.log('/disberse/getOrgInfo')
//                    console.log(orgHash)
//                    console.log(JSON.parse(data))
                    resolve(data)
                  }
                })
              )
            }
          })
        }
      })
/*
      setTimeout(() => {
        resolve('resolved');
      }, 2000); 
*/
    })
  }

  this.getOrgInfo = function(node, thisHdWallet, fromAddress, org) {
//    const org = "eh7 Internet Ltd"
    const orgHash = web3.utils.keccak256(org)
    let sendToPeerId = PeerId.createFromB58String('QmdiF2cLAE3MtcE7Xw3qR6nk9inFiqUS4tbwQWdAuEByVd')
    var count = 0
    PeerInfo.create(sendToPeerId, (err, peerInfo) => {
      if(err)
        console.log(err)
      else {
        node.dialProtocol(peerInfo, '/disberse/getOrgInfo', (err, conn) => {
          if(err)
            console.log(err)
          else {
            pull(
              pull.values([orgHash]),
              conn,
              pull.collect((err, data) => {
                if (err) { 
                  console.log('/disberse/getOrgInfo ERROR')
                  console.log(err) 
                } else {
//                  console.log('/disberse/getOrgInfo')
//                  console.log(orgHash)
//                  console.log(JSON.parse(data))
                  return(data)
                }
              })
            )
          }
        })
      }
    })
  }

  this.newOrg = function(node, thisHdWallet, fromAddress) {
    var address_to = config.disberse_admin_address
    var address_from = fromAddress
    var pKey = thisHdWallet.getWallet().getPrivateKey()

    const cmdData = "signer::" + address_from + "::newOrg::" + address_from
    let data = ethUtil.sha3(cmdData)

    var p2pay_abi = config.abi
    var contract_address = config.address
    
    const org = "eh7 Internet Ltd"
    const orgHash = web3.utils.keccak256(org)

    const orgAddress = '0xf1742513690cc07772b9a93095d15bcef4b7b8fe'
    const threshold = 2
    let signers = []
    signers.push(fromAddress)
    signers.push('0x6c79dc388ab405e7e3055221295ebf34d7a4802c')
    signers.push('0x28c89df6d88eb243612fd4da8f9d3dffe41634ed')
    signers.sort(hexSortAsc)

    //function editOrg(bytes32 _orgHash, uint _threshold, address[] memory _owners)
    var lodash = require('lodash')
    var this_function_abi = lodash.find(config.abi, { name: 'newOrg' })
    var payloadData = [orgHash,orgAddress,threshold,signers]
    var txPayloadData = web3.eth.abi.encodeFunctionCall(this_function_abi, payloadData)
    var transValue = web3.utils.toHex(0)

    let sendToPeerId = PeerId.createFromB58String('QmdiF2cLAE3MtcE7Xw3qR6nk9inFiqUS4tbwQWdAuEByVd')
    PeerInfo.create(sendToPeerId, (err, sendToPeerInfo) => {
if(err) console.log(err)
//alert(sendToPeerInfo)
      node.dialProtocol(sendToPeerInfo, '/disberse/gasnnonce', (err, conn) => {
        pull(
          pull.values([address_from]),
          conn,
          pull.collect((err, data) => {
            if (err) { 
              console.log(err) 
            } else {
              const returnData = data.toString().split("::")
//console.log(data)
//alert(data)

              // these will need to grab data automatically - how ?????
              var nonceHex = web3.utils.toHex(returnData[2])
              var gasPrice = returnData[1]
              var gasPriceHex = web3.utils.toHex(gasPrice)
              var gasLimitHex = web3.utils.toHex(550000)

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
//              alert(thisTx)

              var tx = new Tx(thisTx)
              tx.sign(pKey)
              var serializedTx = tx.serialize()

              node.dialProtocol(sendToPeerInfo, '/disberse/sendtx', (err, conn) => {
                pull(
                  pull.values([serializedTx.toString('hex')]),
                  conn,
                  pull.collect((err, data) => {
                    if (err) { console.log(err) 
//                      console.log(err)
                    }
                    console.log('received hash:', data.toString())
                    console.log(tx.hash().toString('hex'))
                    alert(tx.hash().toString('hex'))
//                    callback(null,'0x'+tx.hash().toString('hex'))
                    //save 
//                    let txsHashObj = {}
//                    store.set("txsHashs",txsHashObj)
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

  this.updateOrg = function(node, thisHdWallet, fromAddress) {

    var address_to = config.disberse_admin_address
    var address_from = fromAddress
    var pKey = thisHdWallet.getWallet().getPrivateKey()

    const cmdData = "signer::" + address_from + "::updateOrg::" + address_from
    let data = ethUtil.sha3(cmdData)

    var p2pay_abi = config.abi
    var contract_address = config.address
    
    const org = "eh7 Internet Ltd"
    const orgHash = web3.utils.keccak256(org)

    const orgAddress = '0xf1742513690cc07772b9a93095d15bcef4b7b8fe'
    const threshold = 2
    const signers = []
    signers.push(fromAddress)
    signers.push('0x6c79dc388ab405e7e3055221295ebf34d7a4802c')
    signers.push('0x28c89df6d88eb243612fd4da8f9d3dffe41634ed')
    signers.sort(hexSortAsc)

    //function editOrg(bytes32 _orgHash, uint _threshold, address[] memory _owners)
    var lodash = require('lodash')
    var this_function_abi = lodash.find(config.abi, { name: 'updateOrg' })
    var payloadData = [orgHash,orgAddress,threshold,signers]
console.log(payloadData)
    var txPayloadData = web3.eth.abi.encodeFunctionCall(this_function_abi, payloadData)
    var transValue = web3.utils.toHex(0)

    let sendToPeerId = PeerId.createFromB58String('QmdiF2cLAE3MtcE7Xw3qR6nk9inFiqUS4tbwQWdAuEByVd')
    PeerInfo.create(sendToPeerId, (err, sendToPeerInfo) => {
if(err) console.log(err)
//alert(sendToPeerInfo)
      node.dialProtocol(sendToPeerInfo, '/disberse/gasnnonce', (err, conn) => {
        pull(
          pull.values([address_from]),
          conn,
          pull.collect((err, data) => {
            if (err) { 
              console.log(err) 
            } else {
              const returnData = data.toString().split("::")
//console.log(data)
//alert(data)

              // these will need to grab data automatically - how ?????
              var nonceHex = web3.utils.toHex(returnData[2])
              var gasPrice = returnData[1]
              var gasPriceHex = web3.utils.toHex(gasPrice)
              var gasLimitHex = web3.utils.toHex(400000)

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
//              alert(thisTx)

              var tx = new Tx(thisTx)
              tx.sign(pKey)
              var serializedTx = tx.serialize()

              node.dialProtocol(sendToPeerInfo, '/disberse/sendtx', (err, conn) => {
                pull(
                  pull.values([serializedTx.toString('hex')]),
                  conn,
                  pull.collect((err, data) => {
                    if (err) { console.log(err) 
//                      console.log(err)
                    }
                    console.log('received hash:', data.toString())
                    console.log(tx.hash().toString('hex'))
                    alert(tx.hash().toString('hex'))
//                    callback(null,'0x'+tx.hash().toString('hex'))
                    //save 
//                    let txsHashObj = {}
//                    store.set("txsHashs",txsHashObj)
                  })
                )
                console.log("sent: " + serializedTx.toString('hex'))
              })
/*
*/
            }
          })
        )
      })
    })
  }

/*
  this.editOrg = function(node, thisHdWallet, fromAddress) {

    var address_to = config.disberse_admin_address
    var address_from = fromAddress
    var pKey = thisHdWallet.getWallet().getPrivateKey()

    const cmdData = "signer::" + address_from + "::editOrg::" + address_from
    let data = ethUtil.sha3(cmdData)

    var p2pay_abi = config.abiDisberse
    var contract_address = config.addressDisberse
    
    const org = "eh7 Internet Ltd"
    const orgHash = web3.utils.keccak256(org)

    const orgAddress = '0xf1742513690cc07772b9a93095d15bcef4b7b8fe'
    const threshold = 2
    const signers = []
    signers.push(fromAddress)
    signers.push('0x6c79dc388ab405e7e3055221295ebf34d7a4802c')
    signers.push('0x28c89df6d88eb243612fd4da8f9d3dffe41634ed')

    //function editOrg(bytes32 _orgHash, uint _threshold, address[] memory _owners)
    var lodash = require('lodash')
    var this_function_abi = lodash.find(config.abiDisberse, { name: 'editOrg' })
    var payloadData = [orgHash,orgAddress,threshold,signers]
    var txPayloadData = web3.eth.abi.encodeFunctionCall(this_function_abi, payloadData)
    var transValue = web3.utils.toHex(0)

    let sendToPeerId = PeerId.createFromB58String('QmdiF2cLAE3MtcE7Xw3qR6nk9inFiqUS4tbwQWdAuEByVd')
    PeerInfo.create(sendToPeerId, (err, sendToPeerInfo) => {
if(err) console.log(err)
//alert(sendToPeerInfo)
      node.dialProtocol(sendToPeerInfo, '/disberse/gasnnonce', (err, conn) => {
        pull(
          pull.values([address_from]),
          conn,
          pull.collect((err, data) => {
            if (err) { 
              console.log(err) 
            } else {
              const returnData = data.toString().split("::")
//console.log(data)
//alert(data)

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
//console.log(thisTx)
//              alert(thisTx)

              var tx = new Tx(thisTx)
              tx.sign(pKey)
              var serializedTx = tx.serialize()

              node.dialProtocol(sendToPeerInfo, '/disberse/sendtx', (err, conn) => {
                pull(
                  pull.values([serializedTx.toString('hex')]),
                  conn,
                  pull.collect((err, data) => {
                    if (err) { console.log(err) 
//                      console.log(err)
                    }
                    console.log('received hash:', data.toString())
                    console.log(tx.hash().toString('hex'))
                    alert(tx.hash().toString('hex'))
//                    callback(null,'0x'+tx.hash().toString('hex'))
                    //save 
//                    let txsHashObj = {}
//                    store.set("txsHashs",txsHashObj)
                  })
                )
                console.log("sent: " + serializedTx.toString('hex'))
              })
            }
          })
        )
      })
    })
//alert(transValue)
//alert(payloadData)
  }
*/

}

module.exports = txLib

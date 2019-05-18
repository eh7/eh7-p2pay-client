'use strict'

const PeerId = require('peer-id')
const PeerInfo = require('peer-info')
const Node = require('./browser-bundle')

var crypto = require('libp2p-crypto')

function createNode (address, callback) {

  PeerInfo.create((err, peerInfo) => {
    if (err) {
      return callback(err)
    }

    const peerIdStr = peerInfo.id.toB58String()
//    const ma = `/dns4/star-signal.cloud.ipfs.team/tcp/443/wss/p2p-webrtc-star/ipfs/${peerIdStr}`
//    const ma = `/dns4/eh1-15.eh7.co.uk/tcp/9991/ws/p2p-webrtc-star/ipfs/${peerIdStr}`
//    const ma = `/dns4/eh1-15.eh7.co.uk/tcp/9010/ws/p2p-webrtc-star/ipfs/${peerIdStr}`
//    const ma = `/dns4/localhost/tcp/8443/wss/p2p-webrtc-star/ipfs/${peerIdStr}`
//    const ma1 = `/dns4/10.0.0.10/tcp/8443/wss/p2p-webrtc-star/ipfs/${peerIdStr}`
//    peerInfo.multiaddrs.add(ma1)
    const ma = `/dns4/pilot.disberse.com/tcp/8443/wss/p2p-webrtc-star/ipfs/${peerIdStr}`

    peerInfo.multiaddrs.add(ma)

    const node = new Node({
      peerInfo
    })
console.log(node)

    node.idStr = peerIdStr
    callback(null, node)
  })
}

module.exports = createNode

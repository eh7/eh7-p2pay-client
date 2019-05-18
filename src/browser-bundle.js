'use strict'

const WebRTCStar = require('libp2p-webrtc-star')
const WebSockets = require('libp2p-websockets')
const KadDHT = require('libp2p-kad-dht')
const Mplex = require('libp2p-mplex')
const SPDY = require('libp2p-spdy')
const SECIO = require('libp2p-secio')
const Bootstrap = require('libp2p-railing')
const defaultsDeep = require('@nodeutils/defaults-deep')
//const libp2p = require('../../../../')
//const libp2p = require('../../../../../')
const libp2p = require('libp2p')

// Find this list at: https://github.com/ipfs/js-ipfs/blob/master/src/core/runtime/config-browser.json
const bootstrapers = [
  '/dns4/demo.disberse.com/tcp/9997/wss/ipfs/QmdiF2cLAE3MtcE7Xw3qR6nk9inFiqUS4tbwQWdAuEByVd',
//  '/ip4/87.224.39.215/tcp/9999/ws/ipfs/QmdiF2cLAE3MtcE7Xw3qR6nk9inFiqUS4tbwQWdAuEByVd'
//  '/ip4/10.0.0.10/tcp/9999/ws/ipfs/QmdiF2cLAE3MtcE7Xw3qR6nk9inFiqUS4tbwQWdAuEByVd'
/*
  '/dns4/ams-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLer265NRgSp2LA3dPaeykiS1J6DifTC88f5uVQKNAd',
  '/dns4/sfo-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLju6m7xTh3DuokvT3886QRYqxAzb1kShaanJgW36yx',
  '/dns4/lon-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLMeWqB7YGVLJN3pNLQpmmEk35v6wYtsMGLzSr5QBU3',
  '/dns4/sfo-2.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLnSGccFuZQJzRadHn95W2CrSFmZuTdDWP8HXaHca9z',
  '/dns4/sfo-3.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLPppuBtQSGwKDZT2M73ULpjvfd3aZ6ha4oFGL1KrGM',
  '/dns4/sgp-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLSafTMBsPKadTEgaXctDQVcqN88CNLHXMkTNwMKPnu',
  '/dns4/nyc-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLueR4xBeUbY9WZ9xGUUxunbKWcrNFTDAadQJmocnWm',
  '/dns4/nyc-2.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLV4Bbm51jM9C4gDYZQ9Cy3U6aXMJDAbzgu2fzaDs64',
  '/dns4/wss0.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmZMxNdpMkewiVZLMRxaNxUeZpDUb34pWjZ1kZvsd16Zic',
  '/dns4/wss1.bootstrap.libp2p.io/tcp/443/wss/ipfs/Qmbut9Ywz9YEDrz8ySBSgWyJk41Uvm2QJPhwDJzJyGFsD6'
*/
]

class Node extends libp2p {
  constructor (_options) {
//    const wrtcStar = new WebRTCStar({ id: _options.peerInfo.id })
//    const wrtcStar = new WebRTCStar({ id: _options.peerInfo.id, key: 'eh7peerjs' })
   let  mySpOptions = {
      trickle: false,
      config: {
        iceServers: [
          {
            urls: "turn:eh1-15.eh7.co.uk:3488",
            username: "disberse",
            credential: "shamboona"
          }
        ]
      }
    }
    const wrtcStar = new WebRTCStar({ id: _options.peerInfo.id, key: 'eh7peers', spOptions: mySpOptions})

    const defaults = {
      modules: {
        transport: [
          wrtcStar,
          new WebSockets()
        ],
        streamMuxer: [
          Mplex,
          SPDY
        ],
        connEncryption: [
          SECIO
        ],
        peerDiscovery: [
          wrtcStar.discovery,
          Bootstrap
        ],
        dht: KadDHT
      },
      config: {
        peerDiscovery: {
          webRTCStar: {
//            enabled: false, 
            enabled: true, 
            iceServers: [{
              urls: "turn:eh1-15.eh7.co.uk",
              username: "whoaminow",
              credential: "barndoorsarebigfun"
            }]
          },
          websocketStar: {
//            enabled: false 
            enabled: true
          },
          bootstrap: {
            interval: 30000,
            enabled: true,
//            enabled: false,
            list: bootstrapers
          }
        },
        relay: {
          enabled: false,
          hop: {
            enabled: false,
            active: false
          }
        },
        dht: {
          kBucketSize: 20
        },
        EXPERIMENTAL: {
          dht: true,
          pubsub: true 
        }
      }
    }

    super(defaultsDeep(_options, defaults))
  }
}

module.exports = Node

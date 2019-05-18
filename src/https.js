'use strict'

const fs = require('fs')
const Path = require('path')
const Hapi = require('hapi')

var tls = {
//  key: fs.readFileSync('./certbot2/eh1-15.eh7.co.uk/privkey1.pem'),
//  cert: fs.readFileSync('./certbot2/eh1-15.eh7.co.uk/cert1.pem')
  key: fs.readFileSync('./certbot/config/live/eh1-15.eh7.co.uk/privkey.pem'),
  cert: fs.readFileSync('./certbot/config/live/eh1-15.eh7.co.uk/cert.pem')
}
var tlsDemoDisberse = {
//  key: fs.readFileSync('/home/gavin/blockchain/apps/disberse/dev/certbot/config/live/demo.disberse.com/privkey.pem'),
  key: fs.readFileSync('../apps/disberse/dev/certbot/config/live/demo.disberse.com/privkey.pem'),
//  key: fs.readFileSync('./certbot2/demo.disberse.com/privkey.pem'),
//  cert: fs.readFileSync('/home/gavin/blockchain/apps/disberse/dev/certbot/config/live/demo.disberse.com/cert.pem')
  cert: fs.readFileSync('../apps/disberse/dev/certbot/config/live/demo.disberse.com/cert.pem')
//  cert: fs.readFileSync('./certbot2/demo.disberse.com/cert.pem')
}


const server = Hapi.server({
  port:9093,
  host: 'eh1-15.eh7.co.uk',
//  host: 'localhost',
//  host: 'demo.disberse.com',
  tls: tls
/*
  routes: {
    files: {
      relativeTo: Path.join(__dirname, 'public')
    }
  }
*/
})

/*
const serverDemoDisberse = Hapi.server({
  port:9092,
  host: 'demo.disberse.com',
//  host: 'localhost',
  tls: tlsDemoDisberse
})
*/

const init = async () => {

//  await server.start();
//  console.log(`Server running at: ${server.info.uri}`);

  await server.register(require('inert')); 

  server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
//      console.log(request.href)
      request.log('/index.html')
      return h.file('./public/index.html');
    }
  })

  server.route({
    method: 'GET',
    path: '/bundle.js',
    handler: (request, h) => {
//      console.log(request.href)
      request.log('/bundle.js')
      return h.file('./public/bundle.js');
    }
  })

  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
        directory: {
            path: './public/',
//            listing: true
        }
    }
  })

  server.events.on('response', function (request) {
    var datetime = new Date(request.info.received).toISOString()
    console.log(request.info.remoteAddress + ': (' + datetime + ") " + request.method.toUpperCase() + ' ' + request.url.path + ' --> ')// + request.response.statusCode);
//    console.log(request.info.remoteAddress + ': (' + request.info.received + ") " + request.method.toUpperCase() + ' ' + request.url.path + ' --> ')// + request.response.statusCode);
//console.log(request.response)
  })

  server.events.on('log', (event, tags) => {
    if (tags.error) {
        console.log(`Server error: ${event.error ? event.error.message : 'unknown'}`)
    }
  })

  await server.start();
  console.log(`Server running at: ${server.info.uri}`);
}

const initDemoDisberse = async () => {

  await serverDemoDisberse.register(require('inert')); 

  serverDemoDisberse.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
//      console.log(request.href)
      request.log('/index.html')
      return h.file('./public/index.html');
    }
  })

  serverDemoDisberse.route({
    method: 'GET',
    path: '/bundle.js',
    handler: (request, h) => {
//      console.log(request.href)
      request.log('/bundle.js')
      return h.file('./public/bundle.js');
    }
  })

  serverDemoDisberse.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
        directory: {
            path: './public/',
//            listing: true
        }
    }
  })

  serverDemoDisberse.events.on('response', function (request) {
    var datetime = new Date(request.info.received).toISOString()
    console.log(request.info.remoteAddress + ': (' + datetime + ") " + request.method.toUpperCase() + ' ' + request.url.path + ' --> ')// + request.response.statusCode);
//    console.log(request.info.remoteAddress + ': ' + request.method.toUpperCase() + ' ' + request.url.path + ' --> ')// + request.response.statusCode);
//console.log(request.response)
  })

  serverDemoDisberse.events.on('log', (event, tags) => {
    if (tags.error) {
        console.log(`Server error: ${event.error ? event.error.message : 'unknown'}`)
    }
  })

  await serverDemoDisberse.start();
  console.log(`Server running at: ${serverDemoDisberse.info.uri}`);
}

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
})

init()
//initDemoDisberse()

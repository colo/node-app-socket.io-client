
const	mootools = require('mootools')

let io, socket,
  ports = [];

// try {
//   importScripts('/socket.io/socket.io.js')
// } catch(e) {
  io = require('socket.io-client')
// }

// // console.log('io')
// // console.log(io)
// // console.log(self)
// Post data to parent thread
// self.postMessage({ foo: 'foo' });

self.addEventListener('connect', function(event) {
  const port = event.ports[0]
  ports.push(port)
  port.start()

  // console.log('client connected to shared worker', event)

  port.addEventListener('message', event => handleMessage(event, port), false)
}, false)

// Respond to message from parent thread
self.addEventListener('message', event => handleMessage(event, self), false)

function handleMessage(event, port) {
  // console.log('handleMessage')
  // console.log(event.data)

  if(event && event.data){
    if(event.data.uri){

      if(socket && socket.connected === true){
        port.postMessage({'connected': true})
        port.postMessage({'on': 'connect'})
      }
      else{
        socket = io(event.data.uri,event.data.io)
      }

      socket.on('connect', function () {
        port.postMessage({'connected': true})
        port.postMessage({'on': 'connect'})
      })

      socket.on('disconnect', function () {
        port.postMessage({'connected': false})
        port.postMessage({'on': 'disconnect'});
      })
    }
    else if(event.data.once){
      socket.once(event.data.once, function (data) {
        port.postMessage({'once': event.data.once, result: data})
      })
    }
    else if(event.data.on){
      socket.on(event.data.on, function (data) {
        if(ports.length > 0){
          // console.log('sending to ports' + ports.length)
          ports.forEach(function(port){
            port.postMessage({'on': event.data.on, result: data})
          })
        }
        else{
          port.postMessage({'on': event.data.on, result: data})
        }
      })
    }
    else if(event.data.emit){
      // socket.emit.attempt(event.data.emit)
      socket.emit(event.data.emit[0], event.data.emit[1])
    }
    else if(event.data === 'removeAllListeners'){
      // socket.emit.attempt(event.data.emit)
      socket.removeAllListeners()
    }
    // else if(event.data.on){
    //
    // }

  }
}

// self.addEventListener('message', function(event){
//   if(event && event.data){
//     // console.log('message')
//     // console.log(event.data)
//
//     if(event.data.uri){
//       socket = io(event.data.uri,event.data.io)
//
//       socket.on('connect', function () {
//         self.postMessage({'connected': true})
//         self.postMessage({'on': 'connect'})
//       })
//
//       socket.on('disconnect', function () {
//         self.postMessage({'connected': false})
//         self.postMessage({'on': 'disconnect'});
//       })
//     }
//     else if(event.data.once){
//       socket.once(event.data.once, function (data) {
//         self.postMessage({'once': event.data.on, result: data})
//       })
//     }
//     else if(event.data.on){
//       socket.on(event.data.on, function (data) {
//         self.postMessage({'on': event.data.on, result: data})
//       })
//     }
//     else if(event.data.emit){
//       // socket.emit.attempt(event.data.emit)
//       socket.emit(event.data.emit[0], event.data.emit[1])
//     }
//     else if(event.data === 'removeAllListeners'){
//       // socket.emit.attempt(event.data.emit)
//       socket.removeAllListeners()
//     }
//     // else if(event.data.on){
//     //
//     // }
//   }
//
// })

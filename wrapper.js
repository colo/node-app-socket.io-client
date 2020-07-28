// 'use strict'

let io = require('socket.io-client')
const	mootools = require('mootools')

const debug = require('debug')('node-app-socket.io-client:wrapper'),
			debug_internals = require('debug')('node-app-socket.io-client:wrapper:Internals'),
			debug_events = require('debug')('node-app-socket.io-client:wrapper:Events')

const Worker = require('worker-loader!./worker')
// const Worker = require('sharedworker-loader!./worker')// worker.js BUGY


module.exports = new Class({
  Implements: [Options, Events],

  __io: undefined,
  __worker: undefined,
  connected: false,

  options: {
    scheme: 'http',
		host: '127.0.0.1',
		port: 80,
    io: {
			// manager: new io.Manager({
			// 	autoConnect: false
			// })
		},

    type: 'socket.io-client'
  },
  initialize: function(options){
    debug('initialize', options)
    this.setOptions(options)

    let	path = (typeof(this.options.path) !== "undefined") ? this.options.path : '/';



    if((this.options.type !== 'SharedWorker' ) && (this.options.type !== 'Worker' || !Worker)){//|| !SharedWorker is undefined on Chrome Android and breaks this ckeck
      this.__io = io(this.options.scheme + '://'+ this.options.host + ':' + this.options.port+path, this.options.io)
      // this.__io.on('connect', function(){
      //   debug('connect')
      //
      //   this.connected == this.__io.connected
      //   this.fireEvent('connect')
      // }.bind(this))
      //
      // this.__io.on('disconnect', function(){
      //   debug('disconnect')
      //
      //   this.connected == this.__io.connected
      //   this.fireEvent('disconnect')
      // }.bind(this))
    }
    else {
			this.__worker = new Worker()
      // if (this.options.type === 'SharedWorker'){
      //   // this.__worker = new SharedWorker('./worker.js', { type: 'module' })
      // }
      // else {
      //   // this.__worker = new Worker('./worker.js', { type: 'module' })
      // }
			//
      // // const port = this.__worker.port || this.__worker

      debug('worker', this.__worker)

			let port = this.__worker.port || this.__worker
			port.onmessage = function(event){
          debug('onmessage', event.data)
					if(event && event.data){
						if(event.data.connected){
							this.connected = event.data.connected
						}
						else if(event.data.on){
							this.fireEvent(event.data.on, event.data.result)
						}
						else if(event.data.once){
							this.fireEvent(event.data.once, event.data.result)
						}
					}
          // this.fireEvent(event.data.type, event.data.message)
      }.bind(this)

      this.__worker.onerror = function(event){
        debug('onerror', event)
          // this.fireEvent('error', event)
      }

			// port.start()

			port.postMessage({uri: this.options.scheme + '://'+ this.options.host + ':' + this.options.port+path, io: this.options.io})
    }

    // const worker = new SharedWorker('./worker.js', { type: 'module' })
    // debug('worker', worker, options)
    // worker.port.start()
    // worker.port.postMessage({options: options})
  },
  once: function(){
    debug('once', arguments)
    let event = arguments[0]
    let cb = arguments[1]
    // let params = []
    // for (let i = 2; i < arguments.length; i++){
    //   params.push(arguments[i])
    // }
    // this.addEvent(event, cb)
    // this.__io.once(event, function(){
    //   debug('once __io', event, arguments)
    //   this.fireEvent(event, arguments)
    // }.bind(this))
		if(this.__io !== undefined){
      this.__io.once(event, cb)
		}
		else if(this.__worker !== undefined){
			this.addEvent(event, cb)
			let port = this.__worker.port || this.__worker
			port.postMessage({'once': event})

		}
  },
  on: function(){
    debug('on', arguments)
    let event = arguments[0]
    let cb = arguments[1]
    // let params = []
    // for (let i = 2; i < arguments.length; i++){
    //   params.push(arguments[i])
    // }
    // this.addEvent(event, cb)
    // this.__io.on(event, function(){
    //   debug('on __io', event, arguments)
    //   this.fireEvent(event, arguments)
    // }.bind(this))
    if(this.__io !== undefined){
      this.__io.on(event, cb)
			// this.socket.on(...arguments)
		}
		else if(this.__worker !== undefined){
			this.addEvent(event, cb)
			let port = this.__worker.port || this.__worker
			port.postMessage({'on': event})

		}
  },
  emit: function(){
    debug('emit', arguments)
    let event = arguments[0]
    // let cb = arguments[1]
    // let params = []
    // for (let i = 1; i < arguments.length; i++){
    //   params.push(arguments[i])
    // }

    if(this.__io !== undefined){
      this.__io.emit(event, arguments[1])
			// this.socket.emit(...arguments)
		}
		else if(this.__worker !== undefined){
			// this.addEvent(event, cb)
			let port = this.__worker.port || this.__worker
			port.postMessage({'emit': [arguments[0],arguments[1]]})

		}
  },
  removeAllListeners: function(){
    debug('removeAllListeners', arguments)
    if(this.__io !== undefined){
      this.__io.removeAllListeners()
		}
		else if(this.__worker !== undefined){
			// this.addEvent(event, cb)
			let port = this.__worker.port || this.__worker
			port.postMessage('removeAllListeners')

		}
  }
})

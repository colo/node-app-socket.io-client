IO'use strict'

var App = require('node-app'),
		path = require('path'),
		fs = require('fs'),
		// pathToRegexp = require('path-to-regexp'),
		io = require('socket.io-client');



var debug = require('debug')('app-socket.io-client');
var debug_events = require('debug')('app-socket.io-client:Events');
var debug_internals = require('debug')('app-socket.io-client:Internals');


var AppIOClient = new Class({
  //Implements: [Options, Events],
  Extends: App,

  ON_CONNECT: 'onConnect',
  ON_CONNECT_ERROR: 'onConnectError',

  //request: null,
	conn: null,

  api: {},

  methods: [
		'on',
		'emit',
	],

  authorization:null,
  //authentication: null,
  _merged_apps: {},

  options: {

		scheme: 'http',
		host: '127.0.0.1',
		port: 80,
		// db: '',

		// io: {
    //
		// },


		logs: null,

		authentication: null,

		//authentication: {
			//username: 'user',
			//password: 'pass',
			//sendImmediately: true,
			//bearer: 'bearer,
			//basic: false
		//},

		authorization: null,


		/*routes: {

			get: [
				{
					path: '/:param',
					callbacks: ['check_authentication', 'get'],
					content_type: /text\/plain/,
				},
			],
			post: [
				{
				path: '',
				callbacks: ['', 'post']
				},
			],
			all: [
				{
				path: '',
				callbacks: ['', 'get']
				},
			]

		},*/

		// api: {
    //
		// 	content_type: 'application/json',
    //
		// 	path: '',
    //
		// 	version: '0.0.0',
    //
		// 	versioned_path: false, //default false
    //
		// 	//accept_header: 'accept-version', //implement?
    //
		// 	/*routes: {
		// 		get: [
		// 			{
		// 			path: '',
		// 			callbacks: ['get_api'],
		// 			content_type: 'application/x-www-form-urlencoded',
		// 			//version: '1.0.1',
		// 			},
		// 			{
		// 			path: ':service_action',
		// 			callbacks: ['get_api'],
		// 			version: '2.0.0',
		// 			},
		// 			{
		// 			path: ':service_action',
		// 			callbacks: ['get_api'],
		// 			version: '1.0.1',
		// 			},
		// 		],
		// 		post: [
		// 			{
		// 			path: '',
		// 			callbacks: ['check_authentication', 'post'],
		// 			},
		// 		],
		// 		all: [
		// 			{
		// 			path: '',
		// 			callbacks: ['get'],
		// 			version: '',
		// 			},
		// 		]
    //
		// 	},*/
    //
    //
		// 	/*doc: {
		// 		'/': {
		// 			type: 'function',
		// 			returns: 'array',
		// 			description: 'Return an array of registered servers',
		// 			example: '{"username":"lbueno","password":"40bd001563085fc35165329ea1ff5c5ecbdbbeef"} / curl -v -L -H "Accept: application/json" -H "Content-type: application/json" -X POST -d \' {"user":"something","password":"app123"}\'  http://localhost:8080/login'
    //
		// 		}
		// 	},*/
		// },
  },
  initialize: function(options){

		this.parent(options);//override default options

		let	path = (typeof(this.options.path) !== "undefined") ? this.options.path : '/';

		this.conn = io(this.options.scheme + '://'+ this.options.host + ':' + this.options.port+path)

		if(this.logger)
			this.logger.extend_app(this);

		/**
		 * logger
		 *  - end
		 * **/

		/**
		 * authorization
		 * - start
		 * */
		 if(this.options.authorization && this.options.authorization.init !== false){
			 var authorization = null;

			 if(typeof(this.options.authorization) == 'class'){
				 authorization = new this.options.authorization({});
				 this.options.authorization = {};
			 }
			 else if(typeof(this.options.authorization) == 'function'){
				authorization = this.options.authorization;
				this.options.authorization = {};
			}
			else if(this.options.authorization.config){
				var rbac = this.options.authorization.config;

				if(typeof(this.options.authorization.config) == 'string'){
					//rbac = fs.readFileSync(path.join(__dirname, this.options.authorization.config ), 'ascii');
					rbac = fs.readFileSync(this.options.authorization.config , 'ascii');
					this.options.authorization.config = rbac;
				}

				/**
				 * @todo
				 * should do module injection, avoid "automatigically" importing and starting modules
				 * */
				authorization = new Authorization(this,
					JSON.decode(
						rbac
					)
				);
				/**
				 * *
				 * */
			}

			if(authorization){
				this.authorization = authorization;
				//app.use(this.authorization.session());
			}
		}
		/**
		 * authorization
		 * - end
		 * */

		this.apply_routes(this.options.routes, false);


  },
  apply_routes: function(routes, is_api){
		var uri = '';


		var instance = this;

		Array.each(this.methods, function(verb){


			/**
			 * @callback_alt if typeof function, gets executed instead of the method asigned to the matched route (is an alternative callback, instead of the default usage)
			 * */
			instance[verb] = function(verb, original_func, options, callback_alt){

				// let	path = (typeof(this.options.path) !== "undefined") ? this.options.path : '';

				options = options || {};

				debug_internals('instance[verb] routes %o', routes);


				debug_internals('routes %o', routes);
				debug_internals('verb %s', verb);
				debug_internals('routes[verb] %o', routes[verb]);

				if(routes[verb]){
					// var uri_matched = false;

					Array.each(routes[verb], function(route){
						debug_internals('instance[verb] route.path %s', route.path);

						route.path = route.path || '';
						options.uri = options.uri || '';

						var keys = []
						var re = pathToRegexp(route.path, keys);


						if(options.uri != null && re.test(options.uri) == true){
							uri_matched = true;

							var callbacks = [];

							/**
							 * if no callbacks defined for a route, you should use callback_alt param
							 * */
							if(route.callbacks && route.callbacks.length > 0){
								route.callbacks.each(function(fn){
									//////console.log('route function: ' + fn);

									//if the callback function, has the same name as the verb, we had it already copied as "original_func"
									if(fn == verb){
										callbacks.push({ func: original_func.bind(this), name: fn });
									}
									else{
										callbacks.push({ func: this[fn].bind(this), name: fn });
									}

								}.bind(this));
							}


							var merged = {};

							let response = function(err, resp){

								if(resp){
									let cast_resp = null;
									if(resp[0]){
										cast_resp = [];


										Array.each(resp, function(value, index){
											cast_resp.push(value);
										})

										resp = cast_resp;


									}
									else{
										cast_resp = {};
										Object.each(resp, function(value, key){
											cast_resp[key] = value;
										})

										resp = cast_resp;


									}
								}


								if(err){
									//this.fireEvent(this.ON_CONNECT_ERROR, {options: merged, uri: options.uri, route: route.path, error: err });
									this.fireEvent(this.ON_CONNECT_ERROR, {uri: options.uri, route: route.path, error: err });
								}
								else{
									//this.fireEvent(this.ON_CONNECT, {options: merged, uri: options.uri, route: route.path, response: resp, body: body });
									//this.fireEvent(this.ON_CONNECT, {uri: options.uri, route: route.path, response: resp });
									this.fireEvent(this.ON_CONNECT, {uri: options.uri, route: route.path, response: resp, options: options });
								}


								if(typeof(callback_alt) == 'function' || callback_alt instanceof Function){
									var profile = 'ID['+this.options.id+']:METHOD['+verb+']:PATH['+merged.uri+']:CALLBACK[*callback_alt*]';

									if(process.env.PROFILING_ENV && this.logger) this.profile(profile);

									//callback_alt(err, resp, body, {options: merged, uri: options.uri, route: route.path });
									callback_alt(err, resp, {uri: options.uri, route: route.path, options: options });

									if(process.env.PROFILING_ENV && this.logger) this.profile(profile);
								}
								else{
									Array.each(callbacks, function(fn){
										var callback = fn.func;
										var name = fn.name;

										var profile = 'ID['+this.options.id+']:METHOD['+verb+']:PATH['+merged.uri+']:CALLBACK['+name+']';

										if(process.env.PROFILING_ENV && this.logger) this.profile(profile);

										//callback(err, resp, body, {options: merged, uri: options.uri, route: route.path });
										callback(err, resp, {uri: options.uri, route: route.path, options: options });

										if(process.env.PROFILING_ENV && this.logger) this.profile(profile);

									}.bind(this))
								}


							}.bind(this);

							var args = options.args || [];


							var req_func = null;
							var db = keys[0];



							if(db){
								var name = re.exec(options.uri)[1];
								// req_func = this.request['database'](name);
								req_func = this.conn.use(name);

							}
							else{

								req_func = this.conn;

							}

								args.push(response);

								if(args.length == 0)
									args = null;

								if(args.length == 1)
									args = args[0];


								req_func[verb].attempt(args, req_func);



						}

					}.bind(this));

					if(!uri_matched){
						debug_internals('No routes matched for URI: %s', uri+path+options.uri);
						throw new Error('No routes matched for URI: '+uri+path+options.uri);
					}
				}
				else{
					debug_internals('No routes defined for method:  %s', verb.toUpperCase());
					throw new Error('No routes defined for method: '+verb.toUpperCase());

				}


			}.bind(this, verb, this[verb]);//copy the original function if there are func like this.get, this.post, etc

		}.bind(this));

	},
	use: function(mount, app){

		debug('use instanceOf(app, AppIOClient) %o', instanceOf(app, AppIOClient));

		if(instanceOf(app, AppIOClient))
			this.parent(mount, app);


	}



});




module.exports = AppIOClient

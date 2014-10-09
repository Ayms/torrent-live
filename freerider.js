/*Copyright (C) 2014 Naïs - Aymeric Vitte

	With modifications of https://github.com/mafintosh/torrent-stream:
	
	Copyright (C) 2014 Mathias Buus Madsen <mathiasbuus@gmail.com>

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	And
	
	https://github.com/feross/bittorrent-dht

	Copyright (c) 2013 Feross Aboukhadijeh, Mathias Buus, and other contributors

	Permission is hereby granted, free of charge, to any person obtaining a copy of
	this software and associated documentation files (the "Software"), to deal in
	the Software without restriction, including without limitation the rights to
	use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
	the Software, and to permit persons to whom the Software is furnished to do so,
	subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
	FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
	COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
	IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
	CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var bittorrent=require('./index.js'),
	dht=require('./node_modules/bittorrent-dht/index.js'),
	pws=require('./node_modules/peer-wire-swarm/index.js'),
	blocklist=require('./lib/blocklist.js'),
	hat=require('./node_modules/hat/index.js'),
	utp=require('./node_modules/utp/index.js'),
	fs=require('fs'),
	http=require('http'),
	oconsole=console.log.bind(console),
	torrent,
	ini_dht,
	swarm,
	spiesfile,
	geoipfile,
	Arrayblocklist=[],
	blocked,
	blocked_1,
	knownspies=[],
	tblocked=0,
	closest,
	magnet,
	path,
	findspies,
	findspiesonly,
	testspies,
	compare,
	MB=1048576,
	SPEED=100000,
	START,
	RETRY=10*1000,
	MERGE=5*60*1000,
	nbspy=0,
	nbspy_1=0,
	myPort,
	infohash,
	fakeinfohash,
	NB_FILES,
	T0,
	myip='0.0.0.0',
	geoip,
	streamspies,
	file1,
	file2,
	fakenodeid,
	spynodeid,
	spyinfo,
	spyannounce,
	spy_level1=[],
	spy_level2=[],
	LEVEL_1=1,
	LEVEL_2=2,
	UTP_TIMEOUT=5000;

try {
	geoip=require('./geoip.js').geoip;
} catch(ee) {};
	
/*
Use:
node freerider.js [infohash]
node freerider.js [magnet]
node freerider.js [magnet] [path]

node freerider.js [infohash] findspies
node freerider.js [magnet] findspies
node freerider.js [magnet] [path] findspies

node freerider.js [infohash] findspiesonly
node freerider.js [magnet] findspiesonly
node freerider.js [magnet] [path] findspiesonly
*/

process.on('uncaughtException',function (err) {
	oconsole(err.stack);
	try {
		var fd=fs.openSync('/torrent.txt','a');
		fs.writeSync(fd,(new Date().toDateString())+' '+(new Date().toTimeString()));
		fs.writeSync(fd,err.stack);
		fs.closeSync(fd);
	} catch(ee) {}
});

if (process.argv) {
	if (process.argv.length>1) {
		var args=process.argv.splice(2);
		console.log(args);
		if (args.length) {
			if (args.length>1) {
				magnet=args[0];
				if (args[1]==='findspies') {
					findspies=true;
				} else if (args[1]==='findspiesonly') {
					findspiesonly=true;
					findspies=true;
				} else if (args[1]==='testspies') {
					testspies=args[2]?args[2]:true;
				} else if (args[1]==='compare') {
					compare=true;
					file1=args[2];
					file2=args[3];
				} else if (args[1]==='passivespy') {
					fakenodeid=args[0];
				} else if (args[1]==='spylookup') {
					spynodeid=args[0];
				} else if (args[1]==='spyinfo') {
					spyinfo=true;
				} else if (args[1]==='spyannounce') {
					spyannounce=true;
				} else {
					path=args[1];
				};
				if (args.length>2) {
					if (args[2]==='findspies') {
						findspies=true;
					} else if (args[2]==='findspiesonly') {
						findspiesonly=true;
						findspies=true;
					};
				};
			} else {
				magnet=args[0]
			};
		};
	};
};

path=path||'./store';

magnet=magnet||'magnet:?xt=urn:btih:ef330b39f4801d25b4245212e75a38634bfc856e';

if (magnet.length<60) {
	magnet='magnet:?xt=urn:btih:'+magnet;
};

if (magnet.length>60) {
	console.log('Wrong magnet format, please enter it as: ef330b39f4801d25b4245212e75a38634bfc856e or magnet:?xt=urn:btih:ef330b39f4801d25b4245212e75a38634bfc856e');
	process.exit();
};

console.log(path+' '+magnet);

infohash=magnet.split(':btih:')[1].toLowerCase();

spiesfile='spies-'+infohash+'.txt';

geoipfile='geoip-'+infohash+'.csv';

var streamlog=fs.createWriteStream('log-'+infohash+'.txt');

streamlog.on('open',function() {
	console.log=function(txt,user) {
		if (user) {
			try {
				oconsole(txt);
			} catch (ee) {}
		};
		txt +=' '+(new Date().toDateString())+' '+(new Date().toTimeString());
		streamlog.write(txt+'\n');
	};
	if (testspies) {
		spiestest();
	} else if (compare) {
		comparef(file1,file2);
	} else {
		init();
	};
});

var onsettorrent=function() {
	if (findspies) {
		if ((ini_dht)&&(ini_dht.closest_from_infohash)) {
			console.log('settorrent dht ready',true);
			ini_dht.removeListener('peer',onpeer);
			ini_dht.on('peer',function(addr) {torrent.discovery.emit('peer', addr)});
			var closest_nodes=ini_dht.closest_from_infohash;
			closest_nodes.forEach(function (contact) {
				var addr=contact.addr;
				var ip=addr.split(':')[0];
				if (!blocked.contains(ip)) {
					console.log('sendgetpeer to '+addr+' for '+infohash,true);
					ini_dht._sendGetPeers(addr,infohash,function() {});
				} else {
					console.log('blocked sendgetpeer to known spy '+addr,true);
				};
			});
		} else {
			console.log('settorrent dht not ready, retry later',true);
			setTimeout(onsettorrent,RETRY);
		};
	};
};

var onready=function() {
	console.log('torrent ready',true);
	T0=Date.now();
	NB_FILES=torrent.files.length;
	torrent.files.forEach(function(file) {
		console.log('filename: '+file.name,true);
		var stream = file.createReadStream();
		var inc=0;
		var t0=Date.now();
		var l=file.length;
		var name=file.name;
		var speed,time,nbwires,onbwires;
		stream.on('data',function(chunk) {
			var nb_peer_left=0;
			inc +=chunk.length;
			speed=inc*8/(Date.now()-T0);
			time=((l-inc)*8/(speed*1000*3600)).toFixed(2).split('.');
			time[1]=parseInt(time[1]*60/100);
			time[1]=(time[1]<10)?('0'+time[1]):time[1];
			torrent.swarm._queues.forEach(function(val) {nb_peer_left +=val.length});
			console.log('got for torrent '+name+' size '+(l/MB).toFixed(2)+' MB '+chunk.length+' bytes of data - offset '+stream._piece+' - remaining '+((l-inc)/MB).toFixed(2)+' MB - speed: '+((speed<SPEED)?(parseInt(speed)+' kbps - time left: '+time[0]+'h'+time[1]):'already downloaded')+' - nb peers: '+torrent.swarm.wires.length+' - other peers '+nb_peer_left+' - blocked spies '+tblocked,true);
			t0=Date.now();
			if (l===inc) {
				console.log('Download finished for '+name,true);
				NB_FILES--;
				if (!NB_FILES) {
					torrent.destroy();
					process.exit();
				};
			};
		});
		var peers=function() {
			nbwires=torrent.swarm.wires.length;
			if (nbwires!==onbwires) {
				console.log('--- Peers in swarn:',true)
				torrent.swarm.wires.forEach(function(wire) {
					console.log(wire.peerAddress,true);
					if (!wire.block_timeout) {
						wire.block_timeout=true;
						wire.on('timeout',function() {
							torrent.swarm._remove(wire.peerAddress);
							console.log('request timeout, add as spy');
							onpeer(wire.peerAddress);
						});
					};
				});
			};
			onbwires=nbwires;
		};
		setInterval(peers,10000);
	});
};

var addtestspy=function(addr,arr) {
	if (arr.indexOf(addr)===-1) {
		arr.push(addr);
	};
};

var addspy=function(addr,type) {
	var ip=addr.split(':')[0];
	if (type===LEVEL_2) {
		if (!blocked.contains(ip)) {
			console.log('adding new spy '+addr,true);
			nbspy++;
			blocked.add(ip);
			Arrayblocklist.push(ip);
			streamspies.write('"'+ip+'",');
			if (geoip) {
				geoip(geoipfile,[ip]);
			};
		};
	} else {
		if (!blocked_1.contains(ip)) {
			blocked_1.add(ip);
			nbspy_1++;
			console.log('spy level 1 '+addr+' total '+nbspy_1,true);
		};
	};
};

var increment_knownspies=function(ip) {
	if (knownspies.indexOf(ip)===-1) {
		knownspies.push(ip);
	};
	console.log('already known spy '+ip+' - total of known spies encountered :'+knownspies.length+' of '+Arrayblocklist.length,true);
};

var onpeer=function(addr,hash,_addr) {
	if (_addr) {
		var ip=_addr.split(':')[0];
		if (!blocked_1.contains(ip)) {
			console.log('potential new spy level 1 '+_addr,true);
			addtestspy(_addr,spy_level1);
		};
	};
	if (swarm) {
		console.log('potential new spy level 2 '+addr+' sent by '+_addr,true);
		ip=addr.split(':')[0];
		if (!blocked.contains(ip)) {
			addtestspy(addr,spy_level2);
		} else {
			increment_knownspies(ip)
		};
	};
};

var createDHT=function(finfohash,opts,bool) {
	var table=dht(opts);
	var nodeId=table.nodeId.toString('hex');
	table.on('peer',onpeer);
	table.on('listening',function(port) {
		console.log('listening on port '+port,true);
	});
	table.on('ready',function() {
		console.log('dht ready - starting lookup for infohash '+finfohash+' with nodeId '+nodeId+' - new spies found: '+nbspy+' - spies level 1: '+nbspy_1+' - '+(new Date().toTimeString()),true);
		table.lookup(finfohash);
	});
	table.on('closest',function() {
		closest=table.closest_from_infohash;
		if ((closest.length)&&(!ini_dht)&&(!bool)) {
			ini_dht=table;
		};
		closest.forEach(function (contact) {
			if (findspies&&bool) { //just announce for the listener
				var announce=function(err,res) {
					if (res) {
						console.log('announcing '+finfohash+' from my nodeId '+nodeId+' to closest: '+contact.addr+' nodeId '+ contact.id.toString('hex')+' token '+(res.token?((new Buffer(res.token,'binary')).toString('hex')):''),true);
						if (res.token) {
							table._sendAnnouncePeer(contact.addr,finfohash,myPort,res.token,function(err,res) {});
						};
					};
				};
				table._sendGetPeers(contact.addr,finfohash,announce);
			};
		});
		if (!bool) {
			var reinit=function() {
				if (table!==ini_dht) {
					table.destroy();
				};
				delete opts.nodeId;
				createDHT(finfohash,opts);
			};
			if (findspies) {
				if (spy_level1.length) {
					var b=(parseInt(finfohash.slice(finfohash.length-8),16)^parseInt('FFFFFFFF',16)).toString(16);
					if (b.length!==8) {
						b='0'+b;
					};
					var testinfohash=finfohash.substr(0,finfohash.length-8)+b;
					while (spy_level1.length) {
						var test=function(err,res) {
							//console.log('test result '+this.addr+' '+err+' '+res);
							if ((!err)&&(res)&&(res.values)) {
								this.success++;
								this.counter=3;
							};
							if (this.counter<3) {
								this.counter++;
								if (table._addrData) {
									console.log('testing peer level 1 '+this.addr+' counter '+this.counter+' list '+spy_level1.length,true);
									table._sendGetPeers(this.addr,testinfohash,test.bind(this));
								};
							} else {
								console.log('success '+this.addr+' '+spy_level1.length);
								if (this.success) {
									addspy(this.addr,LEVEL_1);
								};
								if (!spy_level1.length) {
									reinit();
								} else {
									test.call({addr:spy_level1.shift(),counter:0,success:0},null,null);
								};
							};
						};
						test.call({addr:spy_level1.shift(),counter:0,success:0},null,null);
					};
					if (swarm) {
						while (spy_level2.length) {
							setTimeout((function() {
									console.log('testing peer level 2 TCP: '+this,true);
									swarm.add(this);
									var addr=this.split(':');
									console.log('testing peer level 2 uTP: '+this,true);
									var socket=utp.connect(addr[1],addr[0]);
									var utp_destroy=setTimeout(function() {console.log('timeout destroying utp socket',true);socket.destroy()},UTP_TIMEOUT);
									socket.on('connect',(function() {
										console.log('uTP success for '+this,true);
										addspy(this,LEVEL_2);
										clearTimeout(utp_destroy);
										socket.destroy();
									}).bind(this));
									socket.socket.on('error',(function() {
										clearTimeout(utp_destroy);
										//console.log('uTP error for '+this,true);
									}).bind(this));
									socket.socket.on('close',(function() {
										clearTimeout(utp_destroy);
										//console.log('uTP close for '+this,true);
									}).bind(this));
								}
							).bind(spy_level2.shift()),500);
						};
					} 
				} else {
					reinit();
				};
			} else {
				reinit();
			};
		} else {
			if (!findspies) {
				start_torrent(Arrayblocklist);
			};
		};
	});
};

var spiestest=function() {
	// node freerider.js ef330b39f4801d25b4245212e75a38634bfc856e testspies --> send get_peer for infohash to ip in file - test swarm found peer
	// node freerider.js ef330b39f4801d25b4245212e75a38634bfc856e testspies aa.bb.cc.dd:1068 --> send get_peer for fakeinfohash to aa.bb.cc.dd:1068 - test swarm found peer
	console.log('true infohash '+infohash,true);
	var last=infohash.slice(infohash.length-1);
	last=parseInt(last,16)^1;
	last=last.toString(16);
	fakeinfohash=infohash.substr(0,infohash.length-1)+last;
	console.log('fake infohash '+fakeinfohash,true);
	var sp;
	if (testspies===true) {
		sp=fs.readFileSync('receivedfromport.txt').toString('utf8');
		sp=JSON.parse('['+sp.slice(0,sp.length-1).toString('utf8')+']');
	} else {
		console.log(testspies,true);
		sp=[testspies];
	};
	var table=dht({debug:false,freerider:false,bootstrap:false});
	
	var swarm=pws(fakeinfohash,'-TS0008-'+hat(48),{size:20,speed:10,freerider:null});
	swarm.on('wire',function(wire,connection) {
		console.log('new spy level 2 '+wire.peerAddress,true);
	});
	swarm.on('connected',function(wire) {
		console.log('connected maybe new spy level 2 '+wire.peerAddress,true);
	});
	swarm.on('handshake',function(wire) {
		console.log('handshake not spy '+wire.peerAddress,true);
	});
	swarm.on('error',function(wire) {
		console.log('error not spy '+wire.peerAddress,true);
	});
	swarm.on('close',function(wire) {
		console.log('connection close not spy '+wire.peerAddress,true);
	});
	var nodeId=table.nodeId.toString('hex');
	var sendgetpeer=function(addr) {
		console.log('sending get_peer to '+addr+' for infohash '+fakeinfohash+' with nodeId '+nodeId,true);
		table._sendGetPeers(addr,fakeinfohash,function(err,res) {
			if (res) {
				console.log('response from '+addr+' '+(res.values?'values':'nodes'),true);
			} else {
				console.log('response error from '+addr+' '+err,true);
			}
		});
		if (sp.length) {
			setTimeout(function() {sendgetpeer(sp.shift())},200);
		};
	};
	table.on('listening',function(port) {
		console.log('listening on port '+port,true);
	});
	table.on('peer',function(addr,hash,_addr) {
		console.log('testing level 2 spy TCP '+addr+' sent by '+_addr,true);
		swarm.add(addr);
		var address=addr.split(':');
		console.log('testing peer level 2 uTP '+address[1]+' '+address[0],true);
		var socket=utp.connect(address[1],address[0]);
		var utp_destroy=setTimeout(function() {socket.destroy()},UTP_TIMEOUT);
		socket.on('connect',function() {
			console.log('uTP connected',true);
			clearTimeout(utp_destroy);
			socket.destroy();
		});
		socket.socket.on('error',function() {
			clearTimeout(utp_destroy);
			console.log('uTP error',true);
		});
		socket.socket.on('close',function() {
			clearTimeout(utp_destroy);
			console.log('uTP close',true);
		});
	});
	table.on('ready',function() {
		console.log('testing level 1 spies',true);
		console.log(sp[0],true);
		sendgetpeer(sp.shift());
	});
};

var start_torrent=function(blocklist) {
	console.log('-------------- start torrent --------------------',true);
	torrent=bittorrent(magnet,{blocklist:blocklist||null,connections:20,path:path,verify:true,debug:false,freerider:true,dht:ini_dht});
	torrent.blocked=blocked;
	torrent.on('setTorrent',onsettorrent);
	torrent.on('ready',onready);
	torrent.on('blocked-peer',function() {tblocked++});
	torrent.on('blocking',function(addr) {
		console.log('torrent blocking peer '+addr,true);
		onpeer(addr);
	});
};

var start=function() {
	console.log('myip: '+myip,true);
	console.log('true infohash '+infohash,true);
	var last=infohash.slice(infohash.length-1);
	myPort=parseInt(Math.random()*10000+35000);
	var last2=parseInt(last,16)^8;
	last2=last2.toString(16);
	var fakeinfohash2=infohash.substr(0,infohash.length-1)+last2;
	last=parseInt(last,16)^1;
	last=last.toString(16);
	var fake='magnet:?xt=urn:btih:'+infohash.substr(0,infohash.length-1)+last;
	fakeinfohash=fake.split(':btih:')[1];
	console.log('fake infohash '+fakeinfohash,true);
	if (findspies) {
		swarm=pws(fakeinfohash,'-TS0008-001122334455',{size:20,speed:10,freerider:null});
		swarm.on('wire',function(wire,connection) {
			console.log('new spy level 2 '+wire.peerAddress,true);
		});
		swarm.on('connected',function(wire) {
			console.log('connected probably new spy level 2 '+wire.peerAddress,true);
			addspy(wire.peerAddress,LEVEL_2);
		});
		swarm.on('handshake',function(wire) {
			console.log('handshake not spy '+wire.peerAddress,true);
		});
		swarm.on('error',function(wire) {
			//console.log('error not spy '+wire.peerAddress);
		});
		swarm.on('close',function(wire) {
			//console.log('connection close not spy '+wire.peerAddress);
		});
		createDHT(fakeinfohash,{debug:false,freerider:false,blocklist:blocked,knownspies:knownspies,myip:myip});
		if (findspiesonly) {
			//createDHT(fakeinfohash,{debug:false,freerider:false,blocklist:blocked,knownspies:knownspies,myip:myip,nodeId:fakeinfohash2},true);
			setInterval(function() {console.log('Known spies encountered '+knownspies.length+' of '+Arrayblocklist.length,true)},60*1000)
		} else {
			setTimeout(function() {start_torrent(Arrayblocklist)},START);
		}
	} else if (fakenodeid) {
		//node freerider.js ef330b39f4801d25b4245212e75a38634bfc856e passivespy --> monitor nodeid ef330b39f4801d25b4245212e75a38634bfc856e and send get_peer with random infohash
		var table=dht({debug:false,freerider:false,blocklist:blocked,knownspies:knownspies,myip:myip,nodeId:fakenodeid});
		var lookup=function() {
			var finfohash=hat(160).toString('hex');
			console.log('dht ready - starting lookup for infohash '+finfohash+' - with nodeId '+fakenodeid+' '+(new Date().toTimeString()),true);
			table.lookup(finfohash);
		};
		table.on('ready',function() {
			lookup();
		});
		table.on('closest',lookup);
		table.on('peer',function(addr,hash,_addr) {
			console.log('passivespy found peer '+addr+' for infohash '+hash+' received from '+_addr);
		});
	} else if (spynodeid) {
		//node freerider.js ef330b39f4801d25b4245212e75a38634bfc856e spylookup --> set nodeid to ef330b39f4801d25b4245212e75a38634bfc856e and perform lookup for infohash ef330b39f4801d25b4245212e75a38634bfc856e
		var table=dht({debug:false,freerider:false,blocklist:blocked,knownspies:knownspies,myip:myip,nodeId:spynodeid});
		var lookup=function() {
			console.log('dht ready - starting lookup for infohash '+spynodeid+' - with nodeId '+spynodeid+' '+(new Date().toTimeString()),true);
			table.lookup(spynodeid);
		};
		table.on('ready',function() {
			lookup();
		});
		table.on('closest',function() {
			console.log('---- closest nodes from '+spynodeid+' ----',true);
			table.closest_from_infohash.forEach(function (contact) {
				console.log(contact.addr+' '+contact.id.toString('hex'),true);
			});
		});
	} else if (spyinfo) {
		//node freerider.js log spyinfo
		var table=dht({debug:false,freerider:false,blocklist:blocked,knownspies:knownspies,myip:myip,nodeId:hat(160).toString('hex')});
		var lookup=function() {
			var finfohash=hat(160).toString('hex');
			console.log('dht ready - starting lookup for infohash '+finfohash+' '+(new Date().toTimeString()),true);
			table.lookup(finfohash);
		};
		table.on('ready',function() {
			lookup()
		});
		table.on('closest',lookup);
	} else if (spyannounce) {
		var table=dht({debug:false,freerider:false,blocklist:blocked,knownspies:knownspies,myip:myip,nodeId:hat(160).toString('hex')});
		table.on('ready',function() {
			var cb=function(err,res) {
				if (err) {
					console.log('sendfindnode error '+err,true);
				} else {
					console.log('sendfindnode ok',true);
				};
			};
			table.on('found_node',function(addr) {
				setTimeout(function() {table._sendFindNode(addr,new Buffer(hat(160).toString('hex'),'hex'),function() {});},10000);
			});
			//table._sendFindNode('aa.bb.cc.154:1063',new Buffer(hat(160).toString('hex'),'hex'),cb);
		});
	} else {
		createDHT(fakeinfohash,{debug:false,freerider:false,blocklist:blocked,knownspies:knownspies,myip:myip},true);
	};
};

var merge=function(filename,gfile) {
	var name=gfile.split('.')[0];
	console.log('merging '+name);
	var tmp='';
	var sp='';
	var files=fs.readdirSync('.');
	files.forEach(function(file) {
		if (file.indexOf(name+'-')!==-1) {
			console.log('adding '+file,true);
			tmp +=fs.readFileSync(file).toString('utf8');
		};
		if (file===filename) {
			//fs.unlink(file);
		};
	});
	try {
		sp=fs.readFileSync(gfile).toString('utf8');
		if (name==='spies') {
			console.log('Number of spies in '+gfile+' '+JSON.parse('['+sp.slice(0,sp.length-1).toString('utf8')+']').length,true);
		} else {
			console.log('Number of spies in '+gfile+' '+(sp.split('\n')).length,true);
			tmp='\n'+tmp;
		};
	} catch(ee) {
		console.log('Number of spies in '+gfile+': 0',true);
	};
	sp +=tmp;
	return sp;
};

var comparef=function(file1,file2) {
	var tmp1=fs.readFileSync(file1).toString('utf8');
	var tmp2=fs.readFileSync(file2).toString('utf8');
	var arr1,arr2,res;
	if (file1==='exit.js') {
		arr1=JSON.parse(tmp1);
		arr1=arr1.map(function(val) {return val.split('-')[1]});
	} else {
		arr1=JSON.parse('['+tmp1.slice(0,tmp1.length-1).toString('utf8')+']');
	};
	arr2=JSON.parse('['+tmp2.slice(0,tmp2.length-1).toString('utf8')+']');
	console.log('file1 length '+arr1.length,true);
	console.log('file2 length '+arr2.length,true);
	var count=0;
	arr1.forEach(function(ip) {
		if (arr2.indexOf(ip)!==-1) {
			count++;
			res.push(ip);
			console.log(ip,true);
		};
	});
	console.log('ip in common: '+count,true);
	res=JSON.stringify(res);
	fs.writeFileSync('./common.txt',res);
};

//modification of http://www.shamasis.net/2009/09/fast-algorithm-to-find-unique-items-in-javascript-array/
var unique=function() {
	var o={};
	var l=this.length;
	var r=[];
	this.forEach(function(val,i) {o[val]=i});
	for(var i in o) {
		r.push(i);
	};
	o=null;
	return r;
};

var update_spies=function(spies,geoips) {
	var tmp=JSON.parse('['+spies.slice(0,spies.length-1).toString('utf8')+']');
	console.log('Number of known spies before cleaning (all merged spies.txt): '+tmp.length,true);
	Arrayblocklist=unique.call(tmp);
	console.log('Arrayblocklist',true);
	tmp=JSON.stringify(Arrayblocklist);
	console.log('end cleaning',true);
	fs.writeFileSync('./spies.txt',tmp.substr(1,tmp.length-2)+',');
	blocked=blocklist(Arrayblocklist);
	blocked_1=blocklist([]);
	console.log('Number of known spies after cleaning (spies.txt): '+Arrayblocklist.length,true);
	if (geoips) {
		var tmp=geoips.split('\n');
		tmp=unique.call(tmp);
		console.log('Number of known spies after cleaning (geoip.csv): '+tmp.length,true);
		fs.writeFileSync('./geoip.csv',tmp.join('\n'));
	};
};

var init=function() {
	var spies=merge(spiesfile,'spies.txt');
	var geoips=merge(geoipfile,'geoip.csv');
	streamspies=fs.createWriteStream(spiesfile);
	streamspies.on('open',function() {
		if (spies) {
			update_spies(spies,geoips);
		} else {
			blocked=blocklist([]);
			blocked_1=blocklist([]);
		};
		START=Arrayblocklist.length?(30*1000):(5*60*1000);
		var options = {
			host: 'www.monip.org',
			path: '/',
			port: 80,
			method: 'GET'
		};
		var req=http.request(options,function(res) {
			var data_='';
			res.on('data', function(d) {
				data_ +=d.toString('utf8');
			});
			res.on('end',function() {
				if (data_) {
					try {
						var res=data_.split("<BR>");
						if (res.length) {
							res=res[1];
							res=res.split("<br>");
							if (res.length) {
								res=res[0].split(':');
								if (res.length>1) {
									myip=res[1].trim();
								};
							};
						};
					} catch(ee) {};
				};
				start();
			});
			res.on('error',function() {
				start();
			});
		});
		req.on('error', function(e) {
			start();
		});
		req.end();
	});
};
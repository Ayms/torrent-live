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
	knownspies=[],
	closest,
	magnet,
	path,
	findspies,
	findspiesonly,
	testspies,
	MB=1048576,
	SPEED=100000,
	START,
	RETRY=10*1000,
	MERGE=5*60*1000,
	nbspy=0,
	myPort,
	infohash,
	fakeinfohash,
	NB_FILES,
	T0,
	myip='0.0.0.0',
	geoip,
	streamspies;

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
					testspies=true;
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
	if (!testspies) {
		init();
	} else {
		spiestest();
	};
});

var onsettorrent=function() {
	if (findspies) {
		if (ini_dht.closest_from_infohash) {
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
			console.log('got for torrent '+name+' size '+(l/MB).toFixed(2)+' MB '+chunk.length+' bytes of data - offset '+stream._piece+' - remaining '+((l-inc)/MB).toFixed(2)+' MB - speed: '+((speed<SPEED)?(parseInt(speed)+' kbps - time left: '+time[0]+'h'+time[1]):'already downloaded')+' - nb peers: '+torrent.swarm.wires.length+' - other peers '+nb_peer_left,true);
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

var addspy=function(addr) {
	var ip=addr.split(':')[0];
	nbspy++;
	blocked.add(ip);
	Arrayblocklist.push(ip);
	streamspies.write('"'+ip+'",');
	if (geoip) {
		geoip(geoipfile,[ip]);
	};
	if (torrent) {
		torrent.blocked=blocked;
	};
};

var increment_knownspies=function(ip) {
	if (knownspies.indexOf(ip)===-1) {
		knownspies.push(ip);
	};
	console.log('already known spy '+ip+' - total of known spies encountered :'+knownspies.length+' of '+Arrayblocklist.length,true);
};

var onpeer=function(addr,hash,_addr) {
	var ip=_addr.split(':')[0];
	if (!blocked.contains(ip)) {
		console.log('new spy level 1 '+_addr,true);
		addspy(_addr);
	} else {
		increment_knownspies(ip);
	};
	if (swarm) {
		console.log('testing level 2 spy '+addr+' sent by '+_addr,true);
		ip=addr.split(':')[0];
		if (!blocked.contains(ip)) {
			swarm.add(addr);
		} else {
			increment_knownspies(ip)
		};
	};
};

var createDHT=function(infoHash,opts,bool) {
	var table=dht(opts);
	var nodeId=table.nodeId.toString('hex');
	table.on('peer',onpeer);
	table.on('ready',function() {
		console.log('dht ready - starting lookup for infohash '+infoHash+' '+(new Date().toTimeString())+' - new spies found: '+nbspy,true);
		table.lookup(infoHash);
	});
	table.on('closest',function() {
		//console.log('announcing '+infoHash+' from my nodeId '+nodeId,true);
		closest=table.closest_from_infohash;
		if ((closest.length)&&(!ini_dht)&&(!bool)) {
			ini_dht=table;
		};
		closest.forEach(function (contact) {
			if (findspies&&bool) { //just announce for the listener
				var announce=function(err,res) {
					if (res) {
						console.log('announcing '+infoHash+' from my nodeId '+nodeId+' to closest: '+contact.addr+' nodeId '+ contact.id.toString('hex')+' token '+(res.token?((new Buffer(res.token,'binary')).toString('hex')):''),true);
						if (res.token) {
							table._sendAnnouncePeer(contact.addr,infoHash,myPort,res.token,function(err,res) {});
						};
					};
				};
				table._sendGetPeers(contact.addr,infoHash,announce);
			};
		});
		if (!bool) {
			if (table!==ini_dht) {
				table.destroy();
			};
			delete opts.nodeId;
			createDHT(infoHash,opts);
		} else {
			if (!findspies) {
				start_torrent(Arrayblocklist);
			};
		};
	});
};

var spiestest=function() {
	console.log('true infohash '+infohash,true);
	var last=infohash.slice(infohash.length-1);
	last=parseInt(last,16)^1;
	last=last.toString(16);
	fakeinfohash=infohash.substr(0,infohash.length-1)+last;
	console.log('fake infohash '+fakeinfohash,true);
	var sp=fs.readFileSync('receivedfromport.txt').toString('utf8');
	sp=JSON.parse('['+sp.slice(0,sp.length-1).toString('utf8')+']');
	var table=dht({debug:false,freerider:false});
	var swarm=pws(fakeinfohash,'-TS0008-'+hat(48),{size:20,speed:10,freerider:null});
	swarm.on('wire',function(wire,connection) {
		console.log('new spy level 2 '+wire.peerAddress,true);
	});
	swarm.on('connected',function(wire) {
		console.log('connected maybe new spy level 2 '+wire.peerAddress,true);
	});
	swarm.on('handshake',function(wire) {
		console.log('handshake maybe new spy level 2 '+wire.peerAddress,true);
	});
	swarm.on('error',function(wire) {
		console.log('error fake spy '+wire.peerAddress,true);
	});
	swarm.on('close',function(wire) {
		console.log('connection close spy '+wire.peerAddress,true);
	});
	var nodeId=table.nodeId.toString('hex');
	var sendgetpeer=function(addr) {
		table._sendGetPeers(addr,fakeinfohash,function(err,res) {
			if (res) {
				console.log('response from '+addr+' '+(res.nodes?'nodes':'values'));
			} else {
				console.log('response error from '+addr);
			}
		});
		if (sp.length) {
			setTimeout(function() {sendgetpeer(sp.shift())},200);
		};
	};
	table.on('peer',function(addr,hash,_addr) {
		//addr='66.229.115.233:51779';//test peer
		console.log('testing level 2 spy '+addr+' sent by '+_addr,true);
		swarm.add(addr);
	});
	table.on('ready',function() {
		console.log('testing level 1 spies',true);
		sendgetpeer(sp.shift());
	});
};

var start_torrent=function(blocklist) {
	console.log('-------------- start torrent --------------------',true);
	torrent=bittorrent(magnet,{blocklist:blocklist||null,connections:20,path:path,verify:true,debug:false,freerider:true,dht:ini_dht});
	torrent.on('setTorrent',onsettorrent);
	torrent.on('ready',onready);
	torrent.on('blocking',onpeer);
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
			addspy(wire.peerAddress);
		});
		swarm.on('handshake',function(wire) {
			console.log('handshake maybe new spy level 2 '+wire.peerAddress,true);
		});
		swarm.on('error',function(wire) {
			console.log('error fake spy '+wire.peerAddress,true);
		});
		swarm.on('close',function(wire) {
			console.log('connection close spy '+wire.peerAddress,true);
		});
		createDHT(fakeinfohash,{debug:false,freerider:false,blocklist:blocked,knownspies:knownspies,myip:myip});
		if (findspiesonly) {
			//createDHT(fakeinfohash,{debug:false,freerider:false,blocklist:blocked,knownspies:knownspies,myip:myip,nodeId:fakeinfohash2},true);
			setInterval(function() {console.log('Known spies encountered '+knownspies.length+' of '+Arrayblocklist.length,true)},60*1000)
		} else {
			setTimeout(function() {start_torrent(Arrayblocklist)},START);
		}
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
			fs.unlink(file);
		};
	});
	try {
		sp=fs.readFileSync(gfile).toString('utf8');
		if (name==='spies') {
			console.log('Number of spies in '+gfile+' '+JSON.parse('['+sp.slice(0,sp.length-1).toString('utf8')+']').length);
		} else {
			console.log('Number of spies in '+gfile+' '+(sp.split('\n')).length);
			tmp='\n'+tmp;
		};
	} catch(ee) {
		console.log('Number of spies in '+gfile+': 0');
	};
	sp +=tmp;
	return sp;
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
	console.log('Number of known spies before cleaning (all merged): '+tmp.length,true);
	Arrayblocklist=unique.call(tmp);
	console.log('Arrayblocklist',true);
	tmp=JSON.stringify(Arrayblocklist);
	console.log('end cleaning',true);
	fs.writeFileSync('./spies.txt',tmp.substr(1,tmp.length-2)+',');
	blocked=blocklist(Arrayblocklist);
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
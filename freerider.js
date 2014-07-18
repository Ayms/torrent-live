/*Copyright (C) 2014 Aymeric Vitte

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
	blocklist=require('./lib/blocklist.js'),
	fs=require('fs'),
	torrent,
	Arrayblocklist,
	blocked,
	closest,
	spies,
	magnet,
	path,
	findspies,
	findspiesonly,
	MB=1048576,
	SPEED=100000,
	START=5*60*1000,
	nbspy=0,
	nbspyknown=0,
	myPort,
	fakeinfohash,
	NB_FILES,
	T0;

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

if (process.argv) {
	if (process.argv.length>1) {
		var args=process.argv.splice(2);
		if (args.length) {
			if (args.length>1) {
				magnet=args[0];
				if (args[1]==='findspies') {
					findspies=true;
				} else if (args[1]==='findspiesonly') {
					findspiesonly=true;
					findspies=true;
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

var infohash=magnet.split(':btih:')[1];

fs.open('log.txt','w',function(err,fd) {
	var oconsole=console.log.bind(console);
	console.log=function(txt) {
		oconsole(txt);
		txt +=' '+(new Date().toDateString())+' '+(new Date().toTimeString());
		fs.write(fd,txt+'\n',function() {});
	};
});

var writefile=function(file,txt) {
	fs.open(file,'a',function(err,fd) {
		fs.write(fd,txt,function(){});
	});
};

var onready=function() {
	console.log('torrent ready');
	T0=Date.now();
	NB_FILES=torrent.files.length;
	torrent.files.forEach(function(file) {
		console.log('filename: '+file.name);
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
			console.log('got for torrent '+name+' size '+(l/MB).toFixed(2)+' MB '+chunk.length+' bytes of data - offset '+stream._piece+' - remaining '+((l-inc)/MB).toFixed(2)+' MB - speed: '+((speed<SPEED)?(parseInt(speed)+' kbps - time left: '+time[0]+'h'+time[1]):'already downloaded')+' - nb peers: '+torrent.swarm.wires.length+' - other peers '+nb_peer_left);
			t0=Date.now();
			if (l===inc) {
				console.log('Download finished for '+name);
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
				console.log('--- Peers in swarn:')
				torrent.swarm.wires.forEach(function(wire) {console.log(wire.peerAddress)});
			};
			onbwires=nbwires;
		};
		setInterval(peers,10000);
	});
};

var onpeer = function(addr) {
	var ip=addr.split(':')[0];
	if (!blocked.contains(ip)) {
		console.log('spy '+addr);
		nbspy++;
		blocked.add(ip);
		writefile('spies.txt','"'+ip+'",');
		if (torrent) {
			torrent.blocked=blocked;
		};
	} else {
		nbspyknown++;
		console.log('already known spy - total of known spies encountered :'+nbspyknown);
	};
};

var createDHT = function(infoHash,opts) {
	var table=dht(opts);
	var nodeId=table.nodeId.toString('hex');
	table.on('peer',onpeer);
	table.on('ready',function() {
		console.log('dht ready - starting lookup for infohash '+infoHash+' '+(new Date().toTimeString())+' - new spies found: '+nbspy);
		table.lookup(infoHash);
	});
	table.on('closest',function() {
		console.log('announcing');
		closest=table.closest_from_infohash;
		closest.forEach(function (contact) {
			var addr=contact.addr;
			var addrData=table._getAddrData(addr);
			var token=table._generateToken(addrData[0]);
			table._sendAnnouncePeer(addr,fakeinfohash,myPort,token,function(err,res) {});
		});
		table.destroy();
		createDHT(infoHash,{debug:false,freerider:false});
		/*launch real torrent
		closest.forEach(function (contact) {var addr=contact.addr;dht._sendGetPeers(addr,infohash,function() {}););
		*/
	});
};

var start_torrent=function(blocklist) {
	console.log('-------------- start torrent --------------------');
	torrent=bittorrent(magnet,{blocklist:blocklist||null,connections:20,path:path,verify:true,dht:true,debug:false,freerider:true});
	torrent.on('ready',onready);
};

var start=function(blocklist) {
	if (findspies) {
		var last=infohash.slice(infohash.length-1);
		myPort=parseInt(Math.random()*10000+35000);
		last=parseInt(last,16)^1;
		last=last.toString(16);
		var fake='magnet:?xt=urn:btih:'+infohash.substr(0,infohash.length-1)+last;
		fakeinfohash=fake.split(':btih:')[1];
		console.log('fake infohash '+fake);
		createDHT(fakeinfohash,{debug:false,freerider:false});
		if (!findspiesonly) {
			setTimeout(function() {start_torrent(blocklist)},START);
		};
	} else {
		start_torrent(blocklist);
	};
};

try {spies=fs.readFileSync('./spies.txt');} catch(ee) {}

if (spies) {
	Arrayblocklist=JSON.parse('['+spies.slice(0,spies.length-1).toString('utf8')+']');
	blocked=blocklist(Arrayblocklist);
	console.log('Number of known spies: '+Arrayblocklist.length);
} else {
	blocked=blocklist([]);
};

start(Arrayblocklist);
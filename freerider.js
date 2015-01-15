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
	
	And
	
	https://github.com/hassansin/node-dnsbl-lookup
	
	And
	
	transcode inspired from https://github.com/trenskow/stream-transcoder.js/blob/master/lib/transcoder.js
*/

var child_process=require('child_process');

child_process.exec('ulimit -n >>ulimit.txt',function(){});

var bittorrent=require('./index.js'),
	dht=require('./node_modules/bittorrent-dht/index.js'),
	pws=require('./node_modules/peer-wire-swarm/index.js'),
	blocklist=require('./lib/blocklist.js'),
	hat=require('./node_modules/hat/index.js'),
	utp=require('./node_modules/utp/index.js'),
	compact2string=require('./node_modules/compact2string/index.js'),
	lookup=require('./node_modules/dnsbl-lookup/index.js'),
	os=require('os'),
	fs=require('fs'),
	http=require('http'),
	net=require('net'),
	oconsole=console.log.bind(console),
	Arrayblocklist=[],
	Testblocklist={},
	Iniblocklist={},
	blocked,
	SWARMS={},
	nbswarms=0,
	queue=[],
	blocked_1,
	Arrayblocklist1=[],
	knownspies=[],
	tblocked=0,
	format,
	freerider=true,//TODO default to false
	findspiesonly,
	testspies,
	testproxy,
	proxy,
	leveltest,
	compare,
	MB=1048576,
	SPEED=100000,
	START=1*1000,
	//START=5*60*1000,
	RETRY=10*1000,
	MERGE=5*60*1000,
	nbspy=0,
	nbspy_1=0,
	NB_FILES,
	myip='0.0.0.0',
	geoip,
	file1,
	file2,
	fakenodeid,
	spynodeid,
	spyinfo,
	spyannounce,
	sendannounce,
	spy_level1=[],
	spy_level2=[],
	LEVEL_1=1,
	LEVEL_2=2,
	UTP_TIMEOUT=5000,
	TEST_BLOCKLIST=60*60*1000,
	QUERY_BLOCKLIST=15*60*1000,
	QUERY_BLOCKLIST2=60*60*1000,
	//TEST_BLOCKLIST=2*60*1000,
	nb_blocklist=0,
	NB_RETRIES=3,
	TEST_CONNECT=30000,
	TEST_PEER=200,
	INI_TEST=1000,
	PROC_QUEUE=200,
	mille,
	nbmille=0,
	save=0,
	write=true,
	test,
	AB_PREFIX=32,
	NOR_PREFIX=24,
	PREF_MIN=20,
	PREF_MAX=24,
	CLOSEST_MIN=5,
	PEER_RATE=0.1,
	PEER_MIN=20,
	ANNOUNCERS={},
	GETPEERS={},
	TOO_MANY=10,
	FFMPEG_BIN_PATH;

try {
	geoip=require('./geoip.js').geoip;
} catch(ee) {};
	
/*
Use:
node freerider.js [infohash1-infohash2-...] [mp4/webm] [ffmpeg_path]
node freerider.js [magnet1-magnet2-...] [mp4/webm] [ffmpeg_path]
node freerider.js [a1-a2-...] [path] [mp4/webm] [ffmpeg_path]

node freerider.js [infohash1-infohash2-...] freerider [mp4/webm] [ffmpeg_path]
node freerider.js [magnet1-magnet2-...] freerider [mp4/webm] [ffmpeg_path]
node freerider.js [a1-a2-...] [path] freerider [mp4/webm] [ffmpeg_path]

node freerider.js [infohash1-infohash2-...] findspiesonly
node freerider.js [magnet1-magnet2-...] findspiesonly
node freerider.js [a1-a2-...] [path] findspiesonly
*/

process.on('uncaughtException',function (err) {
	oconsole(err.stack+' '+(new Date().toDateString()));
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
		console.log('The torrent is going to start, the initialization and the anti-spies features can take several minutes, please wait...');
		if (args.length) {
			var magnets=args[0];
			if (args.length>1) {
				if (args[1]==='freerider') {
					freerider=true;
				} else if (args[1]==='findspiesonly') {
					findspiesonly=true;
					freerider=true;
				} else if (args[1]==='testspies') {
					infohash=args[0];
					testspies=args[2]?args[2]:true;
					leveltest=args[3];
				} else if (args[1]==='testproxy') {
					testproxy=true;
					proxy=args[0];
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
				} else if (args[1]==='sendannounce') {
					sendannounce=true;
				} else if (args[1]==='mp4') {
					format='mp4';
				} else if (args[1]==='webm') {
					format='webm';
				} else {
					path=args[1];
				};
				if (args.length>2) {
					if (args[2]==='freerider') {
						freerider=true;
					} else if (args[2]==='mp4') {
						format='mp4';
					} else if (args[2]==='webm') {
						format='webm';
					} else if (args[2]==='findspiesonly') {
						findspiesonly=true;
					} else {
						FFMPEG_BIN_PATH=args[2]
					};
				};
				if (args.length>3) {
					FFMPEG_BIN_PATH=args[3]
				};
			};
		};
	};
};

FFMPEG_BIN_PATH=FFMPEG_BIN_PATH||'C:/Program Files/ffmpeg/ffmpeg-20150113-git-b23a866-win32-static/bin/ffmpeg.exe';

var path=path||'./store';

var torrent_live=function(magnet,first,free) {
	var torrent,
		infohash,
		fakeinfohash,
		fakeinfohash2,
		ini_dht,
		swarm,
		closest,
		T0,
		myPort,
		CLOSEST={},
		PEERS=[],
		STARTED,
		queue_speer=[];

	magnet=magnet||'magnet:?xt=urn:btih:ef330b39f4801d25b4245212e75a38634bfc856e';
	
	free=!!free;

	if (magnet.length<60) {
		magnet='magnet:?xt=urn:btih:'+magnet;
	};

	if (magnet.length>60) {
		console.log('Wrong magnet format, please enter it as: ef330b39f4801d25b4245212e75a38634bfc856e or magnet:?xt=urn:btih:ef330b39f4801d25b4245212e75a38634bfc856e');
		process.exit();
	};

	//console.log(path+' '+magnet+' freerider '+free);

	infohash=magnet.split(':btih:')[1].toLowerCase();
	
	var check_peer=function(err,res,addr) {
		if (!err) {
			if (res) {
				if (res.values) {
					console.log('------- closest spy '+addr,true);
					addspy(addr,LEVEL_1);
				} else {
					CLOSEST.push(addr);
				};
			};
		} else {
			//console.log('--- error --- '+addr,true);
		};
		if (queue_speer.length) {
			queue_speer.shift()();
		} else {
			var check_peer2=function(err,res,addr) {
				if (!err) {
					if (!freerider) {
						if (res.token) {
							ini_dht._sendAnnouncePeer(contact.addr,infohash,myPort,res.token,function(err,res) {});
						};
					};
					if (res.values) {
						var c=res.values.length;
						var rate=c>PEER_MIN?PEER_RATE:0;
						var l=Math.ceil(c*rate);
						res.values.forEach(function(add,i) {
							if (i>l) {
								if (!blocked.contains(add.split(':')[0])) {
									PEERS.push(add);
								} else {
									console.log('------------- blocked spy '+add,true);
									tblocked++;
								};
							};
						})
					};
				};
				if (queue_speer.length) {
					queue_speer.shift()();
				} else {
					var tmp=[];
					PEERS=unique.call(PEERS);
					PEERS.sort(function() {return 0.5 - Math.random()});//TODO - better random
					console.log('launch torrent nb_peers '+PEERS.length,true);
					if (PEERS.length>=PEER_MIN) {
						PEERS.forEach(function(addr) {
							var ip=addr.split(':')[0];
							if (tmp.indexOf(ip)===-1) {
								tmp.push(ip);
							} else {
								addspy(addr,LEVEL_2);
							};
						});
					};
					STARTED=true;
					PEERS.forEach(function(addr) {
						torrent.discovery.emit('peer',addr);
					});
				};
			};
			console.log('number of closest after testing: '+CLOSEST.length,true);
			CLOSEST.forEach(function (addr,i) {
				var ip=addr.split(':')[0];
				console.log(addr,true);
				queue_speer.push(function() {
					ini_dht._sendGetPeers(addr,infohash,function(err,res) {check_peer2(err,res,addr)});
				});
			});
			if (queue_speer.length) {
				queue_speer.shift()();
			};
		};
	};

	var onsettorrent=function() {
		if (!STARTED) {
			console.log('settorrent dht ready',true);
			ini_dht.removeListener('peer',onpeer);
			ini_dht.removeListener('node',onnode);
			CLOSEST=ini_dht.closest_from_infohash;
			console.log('number of closest: '+CLOSEST.length,true);
			var tmp=[];
			var tmp2=[];
			var preflist=CLOSEST.map(function(contact) {return prefix(contact.id.toString('hex'),fakeinfohash)});
			preflist.forEach(function(val,i) {
				if ((val>=PREF_MIN)&&(val<=PREF_MAX)) {
					tmp.push(CLOSEST[i]);
				};
			});
			console.log('number of closest between 20 and 24: '+tmp.length,true);
			if (tmp.length>=CLOSEST_MIN) {
				CLOSEST=tmp;
			};
			tmp=[];
			CLOSEST.forEach(function(contact,i) {
				var addr=contact.addr;
				var ip=addr.split(':')[0];
				if (tmp2.indexOf(ip)===-1) {
					tmp2.push(ip);
				} else {
					addspy(addr,LEVEL_1);
				};
				if (!blocked_1.contains(ip)) {
					tmp.push(contact);
				} else {
					console.log('--------- potential spy '+addr,true);
				};
			});
			CLOSEST=tmp;
			console.log('number of closest after cleaning: '+CLOSEST.length,true);
			CLOSEST.forEach(function (contact,i) {
				var addr=contact.addr;
				var ip=addr.split(':')[0];
				queue_speer.push(function() {
					//console.log('fake sendgetpeer to '+addr+' for '+fakeinfohash,true);
					ini_dht._sendGetPeers(addr,fakeinfohash,function(err,res) {check_peer(err,res,addr)})
				});
			});
			if (queue_speer.length) {
				CLOSEST=[];
				queue_speer.shift()();
			};
		} else {
			console.log('Restarting torrent',true);
			PEERS.forEach(function(addr) {
				torrent.discovery.emit('peer',addr);
			});
		};
	};

	var onready=function() {
		console.log('torrent ready',true);
		T0=Date.now();
		NB_FILES=torrent.files.length;
		torrent.files.forEach(function(file) {
			console.log('filename: '+file.name,true);
			console.log('path: '+file.path);
			var inc=0;
			var n=0;
			var t0=Date.now();
			var l=file.length;
			var name=file.name;
			var child_buff=[];
			var speed,time,nbwires,onbwires,child,streamres;
			var stream=file.createReadStream();
			var transcode=function() {
				var a;
				var trans=name.split('.');
				trans.pop();
				trans=trans.join('.');
				trans=path+'/'+trans+'.'+format;
				if (format==='webm') {
					a='-i - -y -acodec libvorbis -f webm -maxrate 750k -minrate 550k -bufsize 1600k -b:v 600k -keyint_min 48 -g 48 -sc_threshold 0 -ab 96k pipe:1'; //TODO check that this is working with MSE
				} else {
					//a='-i - -vcodec h264 -f mp4 -movflags frag_keyframe+faststart -strict experimental pipe:1';
					a='-i - -vcodec h264 -f mp4 -movflags frag_keyframe -strict experimental pipe:1'; //TODO check why fatstart does not work and make it mpeg-dash compatible
				};
				a=a.split(' ');
				streamres=fs.createWriteStream(trans,{flags:'w'});
				streamres.on('open',function() {
					var n=0;
					console.log('spawning ffmpeg '+a.join(' '),true);
					child=child_process.spawn(FFMPEG_BIN_PATH,a,{cwd:os.tmpdir()});
					child.stdin.on('error',function(err) {console.log('stdin error '+console.log(err.message))});
					child.stderr.on('data', function(chunk) {
						if (!(n%10)) {
							console.log(' Transcoding still active: '+chunk.toString(),true);
						};
						n++;
					});
					child.on('exit',function(code) {
						console.log('---- Transcoding finished -----',true)
					});
					//stream.pipe(child.stdin);//Slowing down too much the main download - write into the stream instead
					child.stdout.pipe(streamres);
				});
			};
			if (format) {
				var ext=get_extension(file.name);
				if (format!==ext) {
					if (['avi','mkv','mp4','webm'].indexOf(ext)!==-1) {
						//try {
							console.log('Starting transcoding to '+format+' , this is usually much slower than the main download. When the download is finished please wait for the transcoding process to complete. You can start streaming the main file or the transcoded file just after the download has started.');
							transcode();
						//} catch(ee) {};
					};
				};
			};
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
						ini_dht.destroy();
					};
				};
				if (streamres) {
					if (child) {
						var cwrite=function() {
							var ok=true;
							child.__buffer__=false;
							while ((child_buff.length)&&(ok)) {
								ok=child.stdin.write(child_buff.shift());
								n++;
							};
							if (!ok) {
								child.__buffer__=true;
								child.stdin.once('drain',cwrite);
							};
						};
						child_buff.push(chunk);
						if (!child.__buffer__) {
							cwrite();
						};
					} else {
						child_buff.push(chunk);
					};
				};
			});
			var peers=function() {
				nbwires=torrent.swarm.wires.length;
				if (nbwires!==onbwires) {
					console.log('--- Peers in swarm:',true)
					torrent.swarm.wires.forEach(function(wire) {
						console.log(wire.peerAddress,true);
						if (!wire.block_timeout) {
							wire.block_timeout=true;
							wire.on('timeout',function() {
								torrent.swarm._remove(wire.peerAddress);
								console.log('request timeout, add as spy');
								addspy(wire.peerAddress,LEVEL_2);
							});
						};
					});
				};
				onbwires=nbwires;
			};
			setInterval(peers,10000);
		});
	};
	
	var utp_connect=function(addr,sw) {
		var address=addr.split(':');
		//console.log('testing peer level 2 uTP '+address[1]+' '+address[0],true);
		if (address[0]) {
			var socket=utp.connect(address[1],address[0]);
			var utp_destroy=setTimeout(function() {socket.destroy()},UTP_TIMEOUT);
			socket.on('connect',function() {
				swarm['__'+addr+'__']=true;
				//console.log('uTP connected for '+addr);
				swarm['_'+addr+'_']=NB_RETRIES;
				//if (!Testblocklist[addr]) {
					addspy(addr,LEVEL_2);
				//};
				clearTimeout(utp_destroy);
				socket.destroy();
			});
			socket.socket.on('error',function() {
				clearTimeout(utp_destroy);
				//console.log('uTP error',true);
			});
			socket.socket.on('close',function() {
				clearTimeout(utp_destroy);
				//console.log('uTP close',true);
			});
			return socket;
		};
	};
	
	var test_connect=function(sw) {
		var tmp=this.split(':');
		var ip=tmp[0];
		var test=((typeof Testblocklist[ip]==='undefined')||(typeof sw!=='undefined'))?true:(Testblocklist[ip].port!==0?true:false);
		if (test) {
			if (sw) {
				delete Iniblocklist[ip];
				if ((Testblocklist[ip])&&(Testblocklist[ip].info===sw)) {
					var min=0;
					var inisw=sw;
					Object.keys(SWARMS).forEach(function(info) {
						var dist=distance(inisw,info);
						if ((dist<min)||(min===0)) {
							min=dist;
							sw=SWARMS[info];
						};
					});
					//console.log('test_connect iniblocklist'+this+' info '+inisw+' with swarm '+sw.infoHash.toString('hex'),true);
				} else {
					return;
				};
			} else {
				if (Iniblocklist[ip]) {
					delete Iniblocklist[ip];
					if (Testblocklist[ip]) {
						if (!Testblocklist[ip].info) {
							Testblocklist[ip].info=fakeinfohash;
						} else {
							return;
						};
					} else {
						return;
					};
				};
				sw=swarm;
			};
			sw.add(this);
			//var udps=utp_connect(this,sw);
			//console.log('test_connect '+this+' '+sw.infoHash.toString('hex'),true);
			setTimeout((function() {
				try {
					udps.socket.close();
				} catch(ee) {};
				if (!sw['__'+this+'__']) {
					//console.log('connection timeout for '+this,true);
					deletespy(this,sw);
				} else {
					delete sw['__'+this+'__'];
				};
			}).bind(this),TEST_CONNECT);
			setTimeout(function() {
				if (queue.length) {
					queue.shift()();
				};
			},PROC_QUEUE);
		};
	};

	var addtestspy=function(addr,arr) {
		if (arr.indexOf(addr)===-1) {
			arr.push(addr);
		};
	};

	var deletespy=function(addr,sw) {
		if (!sw['_'+addr+'_']) {
			var ip=addr.split(':')[0];
			if (Testblocklist[ip]) {
				delete Testblocklist[ip];
				//nb_blocklist--;
				//console.log('removing spy '+addr+' from swarm '+sw.infoHash.toString('hex'),true);
			};
			delete sw['_'+addr+'_'];
		} else {
			//console.log('Retrying '+addr);
			sw['_'+addr+'_']--;
			test_connect.call(addr);
		};
	};

	var addspy=function(addr,type) {
		var tmp=addr.split(':');
		var ip=tmp[0];
		var port=tmp[1];
		if (isIP(ip)&&(isPort(port))) {
			if (type===LEVEL_2) {
				if (!blocked.contains(ip)) {
					//console.log('adding new spy '+addr+' for swarm '+swarm.infoHash.toString('hex'),true);
					nbspy++;
					blocked.add(ip);
					Arrayblocklist.push(ip);
					if (swarm) {
						swarm['_'+addr+'_']=NB_RETRIES;
					};
					/*
					if (geoip) {
						if (!mille) {
							geoip(geoipfile,[ip]);
						};
					};
					*/
				} else {
					if (swarm) {
						swarm['_'+addr+'_']=NB_RETRIES;
					};
				};
				if (Testblocklist[ip]) {
					if ((port!==Testblocklist[ip].port)&&(Testblocklist[ip].port)) {
						//console.log('tagging permanently '+ip)
						Testblocklist[ip].port=0;
					} else {
						Testblocklist[ip].info=fakeinfohash;
						if (swarm) {
							setTimeout(test_connect.bind(addr),TEST_BLOCKLIST);
						};
					};
				} else {
					Testblocklist[ip]={port:port,info:fakeinfohash};
					if (swarm) {
						setTimeout(test_connect.bind(addr),TEST_BLOCKLIST);
					};
				};
				if (torrent) {
					if (torrent.swarm) {
						torrent.swarm._remove(addr);
					};
				};
			} else {
				if (!blocked_1.contains(ip)) {
					Arrayblocklist1.push(ip);
					blocked_1.add(ip);
					nbspy_1++;
					//console.log('spy level 1 '+addr+' total '+nbspy_1,true);
				};
			};
		};
	};

	var peer_announce=function(nodeId) {
		var table=dht({debug:false,freerider:false,blocklist:blocked,knownspies:knownspies,myip:myip,nodeId:nodeId});
		var lookup=function() {
			var finfohash=hat(160).toString('hex');
			table.lookup(finfohash);
		};
		table.on('ready',lookup);
		table.on('closest',lookup);
		table.on('onAnnounce',function(addr) {
			ANNOUNCERS[addr]=(++ANNOUNCERS[addr])||1;
			if (ANNOUNCERS[addr]>TOO_MANY) {
				var ip=addr.split(':')[0];
				if (!blocked.contains(ip)) {
					console.log('------- too many announces suspicious address '+addr,true);
					addspy(addr,LEVEL_2);
				};
			};
		});
		table.on('onGetPeers',function(addr) {
			GETPEERS[addr]=(++GETPEERS[addr])||1;
			if (GETPEERS[addr]>TOO_MANY) {
				var ip=addr.split(':')[0];
				if (!blocked.contains(ip)) {
					console.log('------- too many getpeers suspicious address '+addr,true);
					addspy(addr,LEVEL_2);
				};
			};
		});
	};
	
	var increment_knownspies=function(ip) {
		if (knownspies.indexOf(ip)===-1) {
			knownspies.push(ip);
		};
		//console.log('already known spy '+ip+' - total of known spies encountered :'+knownspies.length+' of '+Arrayblocklist.length,true);
	};

	var onpeer=function(addr,hash,_addr) {
		if (_addr) {
			var ip=_addr.split(':')[0];
			if (!blocked_1.contains(ip)) {
				addspy(_addr,LEVEL_1);
			};
		};
		if (swarm) {
			ip=addr.split(':')[0];
			test_connect.call(addr);
			if (blocked.contains(ip)) {
				increment_knownspies(ip)
			};
		};
	};
	
	var onnode=function(addr,nodeId) {
		var pre=prefix(nodeId.toString('hex'),fakeinfohash);
		if ((pre>=PREF_MIN)&&(pre<=PREF_MAX)) {
			CLOSEST[addr]=nodeId;
		};
	};

	var createDHT=function(finfohash,opts,bool) {
		var table=dht(opts);
		var nodeId=table.nodeId.toString('hex');
		table.on('peer',onpeer);
		table.on('node',onnode);
		table.on('listening',function(port) {
			//console.log('listening on port '+port,true);
		});
		table.on('ready',function() {
			console.log('dht ready - starting lookup for infohash '+finfohash+'...',true);
			table.lookup(finfohash);
			setTimeout(function() {
				if (queue.length) {
					queue.shift()();
				};
			},PROC_QUEUE);
		});
		table.on('closest',function() {
			closest=table.closest_from_infohash;
			if ((closest.length)&&(!ini_dht)) {
				//console.log('dht closest: '+closest.length,true);
				ini_dht=table;
			};
			var reinit=function(bool) {
				if ((table!==ini_dht)||findspiesonly) {
					//console.log('destroying table for infohash '+finfohash+' with nodeId '+nodeId,true)
					table.destroy();
					table=null;
				};
				delete opts.nodeId;
				if (queue.length) {
					queue.shift()();
					queue.push(function() {
						createDHT(finfohash,opts,bool);
					});
				} else {
					createDHT(finfohash,opts,bool);
				};
			};
			if (!bool) {
				reinit();
			} else {
				var tmp=[];
				var dqueue=[];
				var dnext=function() {
					if (dqueue.length) {
						dqueue.shift()();
					} else {
						table.closest_from_infohash=tmp;
						setTimeout(function() {start_torrent(Arrayblocklist)},START);
					};
				};
				var dnsbl_test=function(contact) {
					var addr=contact.addr;
					var ip=addr.split(':')[0];
					var dnsbl=new lookup.dnsbl(ip);
					dnsbl.on('error',function() {});
					dnsbl.on('data',function(result,blocklist){
						if (result.status==='listed') {
							console.log('------ potential spy --- '+addr,true);
							addspy(addr,LEVEL_1);
						} else {
							tmp.push(contact);
						};
					});
					dnsbl.on('done',dnext);
				};
				if (!Array.isArray(CLOSEST)) {
					Object.keys(CLOSEST).forEach(function(val) {
						tmp.push({addr:val,id:CLOSEST[val]});
					});
					CLOSEST=tmp;
					tmp=[];
				};
				if (CLOSEST.length===0) {
					ini_dht=null;
					reinit(true);
				} else {
					console.log('number of closest '+CLOSEST.length,true);
					CLOSEST.forEach(function(contact) {
						dqueue.push(function() {dnsbl_test(contact)});
					});
					if (dqueue.length) {
						dqueue.shift()();
					};
				};
			};
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
			addspy(addr,LEVEL_2);
		});
	};

	var start=function(first) {
		console.log('true infohash '+infohash,true);
		myPort=parseInt(Math.random()*10000+35000);
		fakeinfohash=infohash.substr(0,AB_PREFIX/4)+hat(160-AB_PREFIX).toString('hex');
		fakeinfohash2=infohash.substr(0,NOR_PREFIX/4)+hat(160-NOR_PREFIX).toString('hex');
		var fake='magnet:?xt=urn:btih:'+fakeinfohash;
		console.log('fake infohash '+fakeinfohash,true);
		if (findspiesonly) {
			swarm=pws(fakeinfohash,'-TS0008-'+hat(48),{size:20,speed:10,freerider:null});
			SWARMS[fakeinfohash]=swarm;
			nbswarms++;
			swarm.on('wire',function(wire,connection) {
				console.log('wire for '+wire.peerAddress+' infohash '+swarm.infoHash.toString('hex'),true);
				wire.destroy();
			});
			var valid=function(wire) {
				//console.log(wire.peerAddress+' is still valid',true);
				swarm['__'+wire.peerAddress+'__']=true;
				swarm['_'+wire.peerAddress+'_']=NB_RETRIES;
				//if (!wire.__error__) {
					addspy(wire.peerAddress,LEVEL_2);
				//};
			};
			swarm.on('connected',function(wire) {
				//console.log('connected to spy level 2 '+wire.peerAddress);
				valid(wire);
			});
			swarm.on('handshake',function(wire) {
				console.log('handshake for '+wire.peerAddress+' infohash '+swarm.infoHash.toString('hex'),true);
				valid(wire);
			});
			swarm.on('error',function(wire,err) {
				//console.log('error '+wire.peerAddress+' '+err,true);
				wire.__error__=true;
				//valid(wire);
				wire.emit('close');
			});
			swarm.on('close',function(wire) {
				//console.log('close '+wire.peerAddress+' '+wire.__connected__,true);
				if ((!wire.__error__)&&(!wire.__timeout__)) {
					valid(wire);
				};
			});
			createDHT(fakeinfohash,{debug:false,freerider:free,blocklist:blocked,knownspies:knownspies,myip:myip});
			if (first) {
				test=setInterval(testblocklist,QUERY_BLOCKLIST);
				peer_announce(fakeinfohash2);
			};
			if ((mille&&(nbswarms===nbmille))||(!mille)) {
				var c=0;
				console.log('testing iniblockllist',true);
				Object.keys(Iniblocklist).forEach(function(n) {c++;setTimeout(test_connect.bind(n+':'+Iniblocklist[n].port,Iniblocklist[n].info),c*INI_TEST)});
			};
			
		} else if (fakenodeid) {
			var table=dht({debug:false,freerider:false,blocklist:blocked,knownspies:knownspies,myip:myip,nodeId:fakenodeid});
			var lookup=function() {
				var finfohash=hat(160).toString('hex');
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
			});
		} else if (sendannounce) {
			var addr='xx';
			var node='xx';
			var finfohash='xx';
			var finfohash2='xx';
			var table=dht({debug:false,freerider:false,blocklist:blocked,knownspies:knownspies,myip:myip,nodeId:node});
			var announce=function(err,res) {
				console.log('announcing');
				if (res) {
					if (res.token) {
						table._sendAnnouncePeer(addr,finfohash2,'24550',res.token,function(err,res) {});
						setTimeout(function() {table._sendGetPeers(addr,finfohash2,function(err,res) {
								if (res) {
									console.log('response from '+addr+' '+(res.values?'values':'nodes'),true);
								} else {
									console.log('response error from '+addr+' '+err,true);
								}
							}
						)},1000);
					};
				};
			};
			table._sendGetPeers(addr,finfohash,announce);
		} else {
			createDHT(fakeinfohash,{debug:false,freerider:freerider,blocklist:blocked,knownspies:knownspies,myip:myip},true);
			setInterval(testblocklist,QUERY_BLOCKLIST2);
			peer_announce(fakeinfohash2);
		};
	};
	start(first,free);
};

var spiestest=function() {
	console.log('true infohash '+infohash,true);
	var nodeId;
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
	swarm.on('error',function(wire,err) {
		console.log('error '+wire.peerAddress+' '+err,true);
	});
	swarm.on('close',function(wire) {
		console.log('connection close '+wire.peerAddress,true);
	});
	if (leveltest==='level1') {
		var table=dht({debug:false,freerider:false,bootstrap:false});
		nodeId=table.nodeId.toString('hex');
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
			//console.log('listening on port '+port,true);
		});
		table.on('peer',function(addr,hash,_addr) {
			console.log('testing level 2 spy TCP '+addr+' sent by '+_addr,true);
			test_connect.call(addr);
		});
		table.on('ready',function() {
			console.log('testing level 1 spies',true);
			console.log(sp[0],true);
			sendgetpeer(sp.shift());
		});
	};
};

var comparef=function(file1,file2) {
	var tmp1=fs.readFileSync(file1).toString('utf8');
	var tmp2=fs.readFileSync(file2).toString('utf8');
	var arr1,arr2,res;
	if (file1==='exit.js') {
		arr1=JSON.parse(tmp1);
		arr1=arr1.map(function(val) {return val.split('-')[1]});
	} else {
		arr1=JSON.parse(tmp1);
	};
	arr2=JSON.parse(tmp2);
	console.log('file1 length '+arr1.length,true);
	console.log('file2 length '+arr2.length,true);
	var count=0;
	var res=[];
	//arr1=arr1.map(function(addr) {return addr.split(':')[0]});
	arr2=arr2.map(function(addr) {return addr.split(':')[0]});
	arr1.forEach(function(addr) {
		var ip=addr.split(':')[0];
		if (arr2.indexOf(ip)!==-1) {
			count++;
			res.push(ip);
			console.log(addr,true);
		};
	});
	console.log('ip in common: '+count,true);
	res=JSON.stringify(res);
	fs.writeFileSync('./common.txt',res);
};

var isIP=function(ip) {
	var boo=0;
	ip=ip.split('.');
	if (ip.length===4) {
		ip.forEach(function(val) {
			if (val&&(!isNaN(val))) {
				var tmp=parseInt(val);
				if ((tmp==val)&&(tmp>=0)&&(tmp<=255)) { //intentional ==
					boo++;
				};
			};
		});
	};
	return boo===4?true:false;
};

var isPort=function(port) {
	if (port&&(!isNaN(port))) {
		var tmp=parseInt(port);
		if ((tmp==port)&&(tmp>0)&&(tmp<=65535)) { //intentional ==
			return true;
		};
	};
	return false;
};

var distance=function (firstId,secondId) {
	var max=Math.max(firstId.length,secondId.length);
	var accumulator='';
	for (var i=0;i<max;i++) {
		var maxDistance=(firstId[i]===undefined||secondId[i]===undefined);
		if (maxDistance) {
			accumulator+=(255).toString(16);
		} else {
			accumulator+=(firstId[i]^secondId[i]).toString(16);
		};
	};
	return parseInt(accumulator,16);
};

var prefix=function(node,info) {
	var n=0;
	var tmp=false;
	var i=0;
	while (!tmp) {
		tmp=(parseInt(node.substr(i,1),16))^(parseInt(info.substr(i,1),16));
		if (!tmp) {
			n+=4;
		};
		i++;
	};
	while (tmp<8) {
		tmp=tmp<<1;
		n++;
	};
	return n;
};

var testblocklist=function() {
	var count=0;
	var list=[];
	var lev1='';
	var lev2='';
	var p2p;
	var tmp='';
	save++;
	Object.keys(Testblocklist).forEach(function(n) {
		list.push(n+':'+Testblocklist[n].port+(Testblocklist[n].port?(Testblocklist[n].info?(':'+Testblocklist[n].info):''):''));
		count++;
	});
	nb_blocklist=count;
	p2p=list.map(function(val) {var r=val.split(':')[0];return ':'+r+'-'+r});
	try {fs.renameSync('./spies.txt','./spiesprev.txt');} catch(ee){};
	if (mille) {
		console.log('Number of spies alive in blocklist: '+nb_blocklist+' vs total discovered '+Arrayblocklist.length+' - spies level 1: '+nbspy_1+' - total of known spies encountered :'+knownspies.length,true);
		try {fs.renameSync('./spieslevel1.txt','./spieslevel1prev.txt');} catch(ee){};
		try {fs.renameSync('./spieslevel2.txt','./spieslevel2prev.txt');} catch(ee){};
		list=JSON.stringify(list);
		lev1=JSON.stringify(Arrayblocklist1);
		lev2=JSON.stringify(Arrayblocklist);
		writeFile('./spies-'+((new Date().toLocaleString()).replace('/','','g').split(' ').join('').split(':')[0])+'.txt',list);
		writeFile('./spieslevel1-'+((new Date().toLocaleString()).replace('/','','g').split(' ').join('').split(':')[0])+'.txt',lev1);
		writeFile('./spieslevel2-'+((new Date().toLocaleString()).replace('/','','g').split(' ').join('').split(':')[0])+'.txt',lev2);
		writeFile('./spieslevel1.txt',lev1);
		writeFile('./spieslevel2.txt',lev2);
	};
	if (findspiesonly) {
		p2p.forEach(function(val) {tmp+=val+'\r\n'});
		writeFile('./spies.p2p',tmp);
		writeFile('./spies.txt',list);
	} else {
		//TODO get the dynamic blocklist
		console.log('Number of spies alive in blocklist: '+nb_blocklist,true);
	};
};

var get_extension=function(name) {
	if (name) {
		var ext=name.split('.');
		if (ext.length) {
			ext=ext[ext.length-1];
		} else {
			ext='';
		};
		return ext;
	};
};

var writeFile=function(filename,data) {
	var buff=new Buffer(data,'utf8');
	try {
		var fd=fs.openSync(filename,'w');
		try {
			fs.writeSync(fd,buff,0,buff.length,0);
		} finally {
			fs.closeSync(fd);
		};
	} catch(ee) {
		console.log('error writefile');
		clearInterval(test);
		test=setInterval(testblocklist,QUERY_BLOCKLIST);
	};
};

//modification of http://www.shamasis.net/2009/09/fast-algorithm-to-find-unique-items-in-javascript-array/
var unique=function() {
	var o={};
	var l=this.length;
	var r=[];
	this.forEach(function(val,i) {o[val]=i});
	Object.keys(o).forEach(function(i) {r.push(i)});
	o=null;
	return r;
};

var init=function() {
	var spies,spiesprev,spieslevel1,spieslevel1prev,spieslevel2,spieslevel2prev;
	try {
		spies=fs.readFileSync('spies.txt').toString('utf8');
	} catch(ee) {
		spies='[]';
	};
	try {
		spiesprev=fs.readFileSync('spiesprev.txt').toString('utf8');
	} catch(ee) {
		spiesprev='[]';
	};
	//spies=spies.length<0.8*spiesprev.length?spiesprev:spies;
	try {
		spieslevel1=fs.readFileSync('spieslevel1.txt').toString('utf8');
	} catch(ee) {
		spieslevel1='[]';
	};
	try {
		spieslevel1prev=fs.readFileSync('spieslevel1prev.txt').toString('utf8');
	} catch(ee) {
		spieslevel1prev='[]';
	};
	spieslevel1=spieslevel1.length<spieslevel1prev.length?spieslevel1prev:spieslevel1;
	try {
		spieslevel2=fs.readFileSync('spieslevel2.txt').toString('utf8');
	} catch(ee) {
		spieslevel2='[]';
	};
	try {
		spieslevel2prev=fs.readFileSync('spieslevel2prev.txt').toString('utf8');
	} catch(ee) {
		spieslevel2prev='[]';
	};
	spieslevel2=spieslevel2.length<spieslevel2prev.length?spieslevel2prev:spieslevel2;
	Arrayblocklist=JSON.parse(spieslevel2);
	var tmp=JSON.parse(spies);
	tmp.forEach(function(val) {
		var arr=val.split(':');
		Testblocklist[arr[0]]={port:arr[1],info:(arr.length>2?arr[2]:'')};
		if (Testblocklist[arr[0]].port) {
			Iniblocklist[arr[0]]=Testblocklist[arr[0]];
		};
		Arrayblocklist.push(arr[0]);
	});
	Arrayblocklist=unique.call(Arrayblocklist);
	blocked=blocklist(Arrayblocklist);
	Arrayblocklist1=JSON.parse(spieslevel1);
	nbspy_1=Arrayblocklist1.length;
	blocked_1=blocklist(Arrayblocklist1);
	console.log('Alive spies: '+tmp.length,true);
	//START=Arrayblocklist.length?(30*1000):(5*60*1000);
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
			unleash();
		});
		res.on('error',function() {
			unleash();
		});
	});
	req.on('error', function(e) {
		unleash();
	});
	req.end();
};

var t=Date.now();

var spiesfile='spies-'+t+'.txt';

var geoipfile='geoip-'+t+'.csv';

var streamlog=fs.createWriteStream('log-'+t+'.txt');

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
	} else if (testproxy) {
		proxytest();
	} else if (compare) {
		comparef(file1,file2);
	} else {
		init();
	};
});

var unleash=function() {
	console.log('myip: '+myip,true);
	if (magnets) {
		if (magnets.indexOf('mille')===-1) {
			magnets=magnets.split('-');
			magnets.forEach(function(val,i) {
				console.log('launching torrent-live for infohash '+val,true);
				torrent_live(val,i===0?true:false);
			});
		};
	};
};
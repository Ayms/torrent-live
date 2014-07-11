/*Copyright (C) 2014 Aymeric Vitte

	With modifications of https://github.com/mafintosh/torrent-stream:
	
	Copyright (C) 2014 Mathias Buus Madsen <mathiasbuus@gmail.com>

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var bittorrent=require('./index.js'),
	magnet,
	path,
	MB=1048576
	SPEED=100000;

/*
Use:
node freerider.js [infohash]
node freerider.js [magnet]
node freerider.js [magnet] [path]
*/

if (process.argv) {
	if (process.argv.length>1) {
		var args=process.argv.splice(2);
		if (args.length) {
			if (args.length>1) {
				magnet=args[0];
				path=args[1];
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

var torrent=bittorrent(magnet,{connections:100,path:path,verify:true,dht:true,debug:false,freerider:true});

torrent.on('ready',function() {
    torrent.files.forEach(function(file) {
        console.log('filename:',file.name);
        var stream = file.createReadStream();
		var inc=0;
		var t0=Date.now();
		var l=file.length;
		var name=file.name;
		var speed,time,nbwires,onbwires;
		stream.on('data',function(chunk) {
			inc +=chunk.length;
			speed=(chunk.length)*8/(Date.now()-t0);
			time=((l-inc)*8/(speed*1000*3600)).toFixed(2).split('.');
			time[1]=parseInt(time[1]*60/100);
			time[1]=(time[1]<10)?('0'+time[1]):time[1];
			console.log('got for torrent '+name+' size '+(l/MB).toFixed(2)+' MB '+chunk.length+' bytes of data - offset '+stream._piece+' - remaining '+((l-inc)/MB).toFixed(2)+' MB - speed: '+((speed<SPEED)?(parseInt(speed)+' kbps - time left: '+time[0]+'h'+time[1]):'already downloaded')+' - nb peers: '+torrent.swarm.wires.length);
			t0=Date.now();
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
});
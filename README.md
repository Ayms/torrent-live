torrent-live
===

Download and stream live (while the download is in progress) torrents with your browser, send it to your TV, as a total freerider minimize what you are unvealing to the outside regarding your activities, real-time, easy to install, easy to use.

Avoid spies and people that are tracking you with the 'findspies' option.

## Presentation

This is based on the excellent [torrent-stream](https://github.com/mafintosh/torrent-stream) and [bittorrent-dht](https://github.com/feross/bittorrent-dht) modules and is somewhere related to [torrent-mount](https://github.com/mafintosh/torrent-mount) but in a more simple way we believe.

You just have to initiate a download (magnet:?xt=urn:btih:ef330b39f4801d25b4245212e75a38634bfc856e corresponding to myvideo.mp4) and open your browser on the file that is being downloaded (typically with an URL like <b>file:///D:/torrent/torrent-live/store/myvideo.mp4</b>)

The streaming will start while the file is being downloaded.

If you are not using the 'findspies' option and you have already created a blocklist using the 'findspies' or 'findspiesonly' options previously or if you have created it by yourself, then it will systematically be used to block the related IP addresses, please see the 'Findspies' section below for more details.

If you have something like Chromecast you can use the Chrome browser and the Cast extension (https://chrome.google.com/webstore/detail/google-cast/boadgeojelhgndaghljhdicfkmllpafd) to send it to your TV.

![torrent1](https://raw.github.com/Ayms/torrent-live/master/torrent1.png)
![torrent2](https://raw.github.com/Ayms/torrent-live/master/torrent2.png)
![torrent3](https://raw.github.com/Ayms/torrent-live/master/torrent3.png)

## Supported formats

All usual audio/video formats are supported inside browsers (h264/mp4, webm, avi, mkv, etc), depending on what you are using you might encounter some issues while sending the flow to your TV (like Chromecast apparently not supporting the avi format), if the browser can not play a file it's probably because it does not support the codecs used for this file.

If you need to convert some files, please see the 'File conversion' section below.

## Installation and use (Windows, Mac, Linux)

Install nodejs v0.11.9 for your platform (http://nodejs.org/dist/v0.11.9/) or the official nodejs release (http://nodejs.org/download/)

For those who are not familiar with nodejs, on windows for example:

	With your browser download:

http://nodejs.org/dist/v0.11.9/node-v0.11.9-x86.msi
	
	or for a 64 bits conf:

http://nodejs.org/dist/v0.11.9/x64/node-v0.11.9-x64.msi

Then execute the files, this will install node.

To install torrent-live:

Download http://www.peersm.com/torrent-live.zip
	
	Create for example a 'torrent' directory and unzip torrent-live.zip
	
To use it:

	Open the command line console (on Windows, type 'cmd' in the search/find input in the start menu
	or in the find icon that appears on windows 8 when you pass the mouse at the right of the screen)

	Go in torrent/torrent-live directory (example: cd D:\torrent\torrent-live)
	
	Run from the command line:
	
	node freerider.js [infohash]
	
	or
	
	node freerider.js [magnet]
	
	or
	
	node freerider.js [magnet] [path]
	
The file being downloaded will appear in the 'store' directory (or in the path directory that you have specified) or in a new folder in this directory if there are several files.

Wait (looking at the messages "got for torrent myvideo.mp4 of size 1 GB 220 kBytes of data - Piece number x - remaining y MB - speed: z kbps - time left: 0h15 - number of peers: n")
that some MBytes have been downloaded and open your browser with an url pointing to your store/myvideo.mp4 directory (ie <b>file:///D:/torrent/torrent-live/store/myvideo.mp4</b>)

The default path is the 'store' directory in the 'torrent-live' directory, this is where the files will be stored if you don't specify the path parameter.
	
	Examples:
	
	node freerider.js ef330b39f4801d25b4245212e75a38634bfc856e
	
	node freerider.js magnet:?xt=urn:btih:ef330b39f4801d25b4245212e75a38634bfc856e
	
	node freerider.js magnet:?xt=urn:btih:ef330b39f4801d25b4245212e75a38634bfc856e 'D:/myvideos'

## Freerider

torrent-live does behave like a total freerider, so unlike usual bittorrent clients, you minimize the visibility of your activities and you are not participating to the torrents.

In addition if the option is set, torrent-live does detect the spies while you are downloading/streaming a torrent, please see the "Find spies" section below.

It is of course not using trackers, only magnet links and the bittorrent Distributed Hash Table (DHT).

The only ones who know something about you are those you are connected to, you can see their IP addresses on the console, in most cases it's unlikely that these ones, which are sharing the content, are tracking you.

So you just retrieve the pieces, do not advertise yourself and do not share anything, therefore your activity is difficult (but not impossible) to detect.

The messages on the console inform you about what torrent-live is doing and progress status.

You can keep or remove the file(s) at the end of the download, in any case you are never seeding/sending to others what you have downloaded.

Data are not retrieved sequentially but are stored sequentially, you can stop/resume a download/streaming at any time.

If for any reasons the player stops inside the browser (or bug) then refresh the page and restart the video where it stopped.

If you want more advanced security/anonymity features you can checkout [Peersm](http://www.peersm.com) and [try it](http://peersm.com/peersm), see [node-Tor](https://github.com/Ayms/node-Tor) for the technical details.

## No Freerider

If you don't like to be a freerider, then deactivate the option and seed the downloaded/streamed files with another bittorrent client when you are finished.

## Findspies

To enable this option:

	node freerider.js ef330b39f4801d25b4245212e75a38634bfc856e findspies
	
	node freerider.js magnet:?xt=urn:btih:ef330b39f4801d25b4245212e75a38634bfc856e findspies
	
	node freerider.js magnet:?xt=urn:btih:ef330b39f4801d25b4245212e75a38634bfc856e 'D:/myvideos' findspies
	
This will block already known spies and discover new ones while your are downloading/streaming, the real torrent will start after 5mn.

![torrent1](https://raw.github.com/Ayms/torrent-live/master/spies.png)
	
The IP addresses are stored in the 'spies.txt' file, the format is simply: "IP address1","IP address2",...,"IP addressN", (do not forget the last comma if you create it manually or import it)
	
This is still experimental and subject to change, some ideas were inspired from this interesting thread: [P2P-hackers How do BitTorrent block lists get created?](http://lists.zooko.com/pipermail/p2p-hackers/2014-May/003236.html), for now the methodology is the following:

- set a fake infohash close to the real one
- announce yourself with the fake infohash, respond to queries (freerider option set to false here)
- walk the DHT periodically looking for the fake infohash
- change your nodeID at each new walk with a random one, so you change your path in the DHT
- register the spies found in a blocklist, register them in a file, no difference is made for Tor exit nodes or VPNs, they will be blocked too 
- start the real torrent after 5mn, use the closest nodes (not in the blocklist) found for the fake infohash to retrieve the peers for the real one, this prevents you from walking the DHT again saying to everybody what you are really looking for.(TODO, not implemented yet)
- connect to the first 20 ones not in the blocklist
- maintain a swarm of 20 peers, if one disconnects, replace it by another one in the peer list not contained in the blocklist
- freerider option to true: do not advertise yourself, do not answer to queries. Due to this some peers might disconnect but the main seeders usually don't, so the swarm will oscillate around 20 peers and stabilize after some time with supposedly good seeders (ie not spies)
- the periodical check of the DHT still runs while the torrent is downloaded/streamed to remove real-time the new spies found and increment the blocklist

<b>This does ensure that for sure the spies found are real spies.</b> Because they did announce themselves for a torrent that does not exist or that you are the only one to have (remember, torrent-live is not using trackers, only the DHT, so the only means for the spies to watch you is to detect what you are asking for when you walk the DHT to find the closest nodes and to register as having it, then wait for you to connect to them).

A side effect is that you might block regular peers that are trying to anonymize themselves via a network like Tor or a VPN (in case the spies are doing the same), but that's not very important and marginal given the size of the bittorrent network. And anyway you don't hurt anybody since you are using your blocklist for your personal use.

It does not insure 100% that you will not connect to a spy but it seems to minimize a lot this risk, so what you are doing is difficult to detect.

The spies might change their IP addresses among their service provider pool of addresses, therefore you could keep in the blocklist some addresses that do not correspond any longer to spies, again it does not seem to be a huge issue since torrent-live is updating the list real-time (TODO remove IP addresses not appearing as spies since some time in the blocklist).

Apparently, for a new fake infohash the spies are slow to arrive at the begining, but arrive massively after some time.

So you can learn about the spies without starting the torrent while running during a certain period:

	node freerider.js ef330b39f4801d25b4245212e75a38634bfc856e findspiesonly
	
	node freerider.js magnet:?xt=urn:btih:ef330b39f4801d25b4245212e75a38634bfc856e findspiesonly
	
	node freerider.js magnet:?xt=urn:btih:ef330b39f4801d25b4245212e75a38634bfc856e 'D:/myvideos' findspiesonly

## File conversion

If you need to convert a file you can use applications like VLC, but the converted file might be broken, we usually follow what is indicated in the Links section of [Peersm](http://www.peersm.com), 'Adding and audio/video - simple way' and run the specified 'very intuitive' command to convert into a webm format. Another advantage of doing this is that the file will be formatted for adaptive streaming and if it is seeded people will be able to download and stream it anonymously using [Peersm application](http://www.peersm.com)

## Tips/Recommendations

Just use simple magnet links formatted as the above examples with the infohash information only ('ef330b39f4801d25b4245212e75a38634bfc856e' here), do not use other formats, it's easy to retrieve the infohash information on the internet or to deduct it from trackers links.

The formats that work better are mp4 and webm, please try to find the corresponding magnet links, an option is being thought to be able to include and choose the subtitles if any. 

Do not use trackers sites and do not follow their wrong and insecure recommendations, like not using the DHT.

Using the DHT, there are no requirements that you must share what you download, which as a freerider you are not doing, and ratio enforcement stories.

If for a given infohash the download does not start, then it probably means that nobody is serving this file, or that there is a bug somewhere, please advise if you are suspecting the later.

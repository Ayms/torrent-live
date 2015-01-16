torrent-live - a new bittorrent client for live streaming that protects privacy and block the monitoring spies
===

Download and stream live (while the download is in progress) torrents with your browser, send it to your TV.

Torrent-live is a new open source bittorrent client which detects, blocks and follows the monitoring spies, making your use of the bittorrent network much more private and safe, do not say to everybody what you are really looking for and minimize your visibility, ultimately activate the optional total freerider option, easy to install and use.

Torrent-live is not using unsafe trackers and client/peer exchanges mechanisms, only the bittorrent DHT (Distributed Hash Table).

## Presentation

This is based on the excellent [torrent-stream](https://github.com/mafintosh/torrent-stream) and [bittorrent-dht](https://github.com/feross/bittorrent-dht) modules.

You just have to initiate a download (magnet:?xt=urn:btih:ef330b39f4801d25b4245212e75a38634bfc856e corresponding to myvideo.mp4) and open your browser on the file that is being downloaded (typically with an URL like <b>file:///D:/torrent/torrent-live/store/myvideo.mp4</b>)

The streaming will start while the file is being downloaded.

If you have already created a blocklist using the 'findspies' or 'findspiesonly' options previously or if you have created it by yourself or if you are using our dynamic blocklist, then it will systematically be used to block the related IP addresses, as well as the method to protect your privacy and detect/block the monitoring spies, please see the 'Findspies' section below for more details.

If you have something like Chromecast you can use the Chrome browser and the Cast extension (https://chrome.google.com/webstore/detail/google-cast/boadgeojelhgndaghljhdicfkmllpafd) to send it to your TV.

![torrent1](https://raw.github.com/Ayms/torrent-live/master/torrent1.png)
![torrent2](https://raw.github.com/Ayms/torrent-live/master/torrent2.png)
![torrent3](https://raw.github.com/Ayms/torrent-live/master/torrent3.png)

## Supported formats

All usual audio/video formats are supported inside browsers (h264/mp4, webm, avi, mkv, etc).

Please see the 'Transcoding - File conversion' section below.

## Installation and use (Windows, Mac, Linux)

Install nodejs v0.11.9 for your platform (http://nodejs.org/dist/v0.11.9/) or the official nodejs release (http://nodejs.org/download/)

To install torrent-live:

Download http://www.peersm.com/torrent-live.zip
	
	Create for example a 'torrent' directory and unzip torrent-live.zip

For those who are not familiar with nodejs, on windows for example:

	With your browser download:

http://nodejs.org/dist/v0.11.9/node-v0.11.9-x86.msi
	
	or for a 64 bits conf:

http://nodejs.org/dist/v0.11.9/x64/node-v0.11.9-x64.msi

Then execute the files, this will install node.
	
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
	
	or to download several torrents:
	
	node freerider.js ef330b39f4801d25b4245212e75a38634bfc856e-fa260b39a6627d0326a05efb5698c556b272679d-...
	
	node freerider.js magnet:?xt=urn:btih:ef330b39f4801d25b4245212e75a38634bfc856e
	
	node freerider.js magnet:?xt=urn:btih:ef330b39f4801d25b4245212e75a38634bfc856e 'D:/myvideos'

## Streaming

Data are not retrieved sequentially but are stored sequentially, you can stop/resume a download/streaming at any time.

If for any reasons the player stops inside the browser (or bug) then refresh the page and restart the video where it stopped.

If you want more advanced security/anonymity features you can checkout [Peersm](http://www.peersm.com) and [try it](http://peersm.com/peersm), see [node-Tor](https://github.com/Ayms/node-Tor) for the technical details.

## Do not say to the "world" what you are really looking for

Please see the method explained in the Findspies section below, torrent-live does change the real infohash for another one close to it, then retrieves the peers that are closest to it, eliminates the spies and finally requests the real infohash to them, then connects to the non spies (limited to 20) among the returned peers.

This does prevent to say to everybody what you are really looking for, spies are eliminated not only during the final phase but all along the process of discovering the peers that have the requested content.

The spies are not the only ones you should protect from, anybody can track you and register/make public your torrenting history:

![normal user](https://raw.github.com/Ayms/torrent-live/master/t4.png)

![abnormal user](https://raw.github.com/Ayms/torrent-live/master/t5.png)

## Freerider option

torrent-live can behave like a total freerider, so unlike usual bittorrent clients, you minimize the visibility of your activities and you are not participating to the torrents.

The only ones who know something about you are those you are connected to, you can see their IP addresses on the console, following the method defined in the 'findspies' section below it's unlikely that these ones are tracking you.

So you just retrieve the pieces, do not advertise yourself, do not share anything and do not answer to anything, therefore your activity is even more difficult (but not impossible) to detect than with the findspies option and/or the blocklist.

This is currently the default, you do not accept any incoming connection and do not participate to anything neither seed anything.

Unlike the other privacy features, it would highly disturb the network if a lot of people were using it, you can deactivate it if you don't like it.

The question remains if it has to stay the default but another question is why the bittorrent clients do nothing to protect you and do implement the known method to defeat most of the spies for other services (like chat) but not in the bittorrent network?

You can keep or remove the file(s) at the end of the download, in any case you are never seeding/sending to others what you have downloaded.

## Findspies

![spies](https://raw.github.com/Ayms/torrent-live/master/spies.png)
	
The IP addresses are stored in the 'spies.txt' file (["IP address1","IP address2",...,"IP addressN"]) and 'spies.p2p' which is compatible with usual clients blocklists.

The method to detect, block and follow the spies is derived from the study "Monitoring and blocking the bittorrent monitoring spies", which is for now undisclosed, the abstract and the beginning of the study can be read here: [Monitoring and blocking the bittorrent monitoring spies](https://gist.github.com/Ayms/077b114a27450f773939)

The study does define the method and explain how to build/maintain a dynamic blocklist.

The below graph does summarize the behavior of the spies, while the number of discovered spies constantly increases, the number of active spies, which are the dangerous ones, does stabilize:

![blocked](https://raw.github.com/Ayms/torrent-live/master/t3.png)

The methodology is the following (please see at the end what we call 'prefix' in what follows), this is a subset of the general method defined in the study to detect, track and block the dangerous spies:

- set a random fake infohash abnormally close to the real one, 'abnormally' means more than 30 bits in common in prefix with the real infohash, choose it randomely so you don't interfer with other torrent-live users
- walk the DHT periodically looking for the fake infohash, respond to queries (findspiesonly option set to true)
- change your nodeID at each new walk with a random one, so you change your path in the DHT and continue looking for spies after you have started the torrent (findspiesonly option set to true)
- ignore the peers returned as "values" until you reach the 40th closest peers for the first walk, add the values received in the blocklist and register as spies those who sent them
- for each infohash, set a nodeID close to the infohash (20-24 bits in common) and launch a process crawling the DHT with this nodeID
- when you reach the 40th closest nodes, ignore those that have a nodeID not in the range of 20 to 24 bits in prefix (if applicable) in common with the fake infohash and those that you have registered as spies
- ignore those that are listed SBL (spam source) or XBL (infected) using DNSBL (DNS Blacklist)
- ignore those that are appearing several time with the same IP address but different ports
- query them with different infohashes abnormally close again from the real infohash, ignore those that are answering with values (ie those pretending to know some peers that are supposed to have something that does not exist)
- start the torrent: ask to the remaining closest nodes the real infohash
- if there are more than 20 results, ignore those that are appearing several time with the same IP address but different ports
- block the known spies (from the blocklist and real-time discovery steps explained above) and ignore the first peers returned (the spies do position themselves to show up first), choose among the remaining peers 20 random peers that do not appear in an abnormal number of torrents (there are different ways to check this, one being to register the peers that are sending an abnormal number of get_peers/announce_peer requests to torrent-live crawlers set in step 5)
- maintain a swarm of 20 peers, if one disconnects, replace it by another one in the list of peers matching the above criteria.
- freerider option to true: do not advertise yourself, do not answer to queries. Due to this some peers might disconnect but the main seeders usually don't, so the swarm will oscillate around 20 peers and stabilize after some time
- the periodical check of the DHT still runs while the torrent is downloaded/streamed to remove real-time the new spies found and increment the blocklist (findspiesonly option set to true)
- test periodically the spies starting with them the bittorrent handshake with the fake infohash and remove those that do not answer any longer (findspiesonly option set to true)
- of course, trackers and the peer exchange protocol/client exchange are not used

Prefix: this is the begining of the nodeID or infohash, the more a nodeID and an infohash or a nodeID have bits in common in their prefix, the closest they are, knowing that up to a certain number of bits in common it becomes unlikely that the peers are real ones (example: infohash 'aabbccffff...' and nodeID 'aabbcc0000...' have aabbcc in common, so 24 bits).

In this process the "spies" are the peers that are pretending to have the fake infohash and those that are sending them, their goal being that you connect to them to detect what you are doing.

In addition, torrent-live will block the peers that seem not to behave normally, like peers not answering to pieces requests or with abnormal delays, or wrongly.

Torrent-live might by mistake block some good peers (for example the VPN peers) but this is marginal given the number of peers.

![blocked](https://raw.github.com/Ayms/torrent-live/master/blocked.png)

The method does not disturb anything in the bittorrent network and the DHT since the 'sybils' are ephemeral and won't be kept in the peers routing tables (except the crawlers, but there is only one per infohash).

Using the method alone is enough to render quasi null the probability to encounter a spy.

Combining it with the dynamic blocklist makes it even stronger, especially to avoid that the monitors connect to you.

One case you could get caught would result from a combination of very bad luck with a spy really looking after you or a targeted torrent with a dedicated unknown/not suspicious IP address behaving normally in a swarm, so participating to the copyright infrigement in order not to be detected, which would be extraordinary.

Another one would be for a spy not detected in the dynamic blocklist to connect to you and request pieces.

Both are possible but not likely at all, this would require some extra efforts from the monitors and quite a lot of IP addresses in order not to be detected by torrent-live, which they don't have.

There is only one situation that nothing can protect you from: a spy behaving normally in a torrent, it's very unlikely that the copyright monitors do so (some monitors are participating in the swarms but their behavior is never normal and is detected by torrent-live), but others can (police, censors, etc), the problem for them being that they would also be infringing the copyright.

That's why you should keep torrent-live's logs and request very precisely how you got detected if you receive a copyright infringement notice, which in most cases will result to: the monitor was infringing the copyright also or what the monitor did was not enough to prove anything (cf the study).

If the infohash is the one of a particularly monitored torrent, a lot of spies are discovered quickly.

So, assuming that this particularly monitored infohash is 'ef330b39f4801d25b4245212e75a38634bfc856e', you can learn about the spies without starting the torrent and before doing it while running during a certain period:

	node freerider.js ef330b39f4801d25b4245212e75a38634bfc856e findspiesonly
	
	node freerider.js magnet:?xt=urn:btih:ef330b39f4801d25b4245212e75a38634bfc856e findspiesonly

Or, more recommended, you can use the dynamic blocklist that we maintain following the method defined in the study, method that is not easy for anybody to continuously run. 
	
## Transcoding and File conversion

If you need to convert a file you can use applications like VLC, but the converted file might be broken, we usually follow what is indicated in the Links section of [Peersm](http://www.peersm.com), 'Adding and audio/video - simple way' and run the specified 'very intuitive' command to convert into a webm format. Another advantage of doing this is that the file will be formatted for adaptive streaming and if it is seeded people will be able to download and stream it anonymously using [Peersm application](http://www.peersm.com)

Torrent-live does allow to transcode a file on the fly, if you are using something like Chromecast it can happen that some formats like avi and mkv do not play, it is recommended to transcode them in mp4 or webm format, you can then stream the file while it is being transcoded:

	node freerider.js ef330b39f4801d25b4245212e75a38634bfc856e mp4/webm
	
	node freerider.js magnet:?xt=urn:btih:ef330b39f4801d25b4245212e75a38634bfc856e mp4/webm
	
	node freerider.js magnet:?xt=urn:btih:ef330b39f4801d25b4245212e75a38634bfc856e 'D:/myvideos' mp4/webm
	
The transcoded file 'example.mp4/webm' is stored progressively in the store directory or 'D:/myvideos', load it as file:///D:/myvideo/example.mp4/webm inside your browser to stream it.

For transcoding you must install ffmpeg that you can find [here](https://www.ffmpeg.org/), the installation is easy, just unzip it, then you must pass to torrent-live the path to ffmpeg.exe:

	node freerider.js ef330b39f4801d25b4245212e75a38634bfc856e mp4/webm 'C:/Program Files/ffmpeg/ffmpeg-20150113-git-b23a866-win32-static/bin/ffmpeg.exe'
	
	node freerider.js magnet:?xt=urn:btih:ef330b39f4801d25b4245212e75a38634bfc856e mp4/webm 'C:/Program Files/ffmpeg/ffmpeg-20150113-git-b23a866-win32-static/bin/ffmpeg.exe'
	
	node freerider.js magnet:?xt=urn:btih:ef330b39f4801d25b4245212e75a38634bfc856e 'D:/myvideos' mp4/webm 'C:/Program Files/ffmpeg/ffmpeg-20150113-git-b23a866-win32-static/bin/ffmpeg.exe'

## Tips/Recommendations

Just use simple magnet links formatted as the above examples with the infohash information only ('ef330b39f4801d25b4245212e75a38634bfc856e' here), do not use other formats, it's easy to retrieve the infohash information on the internet or to deduct it from trackers links. 

Do not use trackers sites and do not follow their wrong and insecure recommendations, like not using the DHT.

Using the DHT, there are no requirements that you must share what you download and ratio enforcement stories.

If for a given infohash the download does not start, then it probably means that nobody is serving this file, or that there is a bug somewhere, please advise if you are suspecting the later.

## To come

More user friendly web based interface.

![user](https://raw.github.com/Ayms/torrent-live/master/t6.png)

## Options summary

	node freerider.js [infohash1-infohash2-...] [mp4/webm] [ffmpeg_path]
	node freerider.js [magnet1-magnet2-...] [mp4/webm] [ffmpeg_path]
	node freerider.js [a1-a2-...] [path] [mp4/webm] [ffmpeg_path]

	node freerider.js [infohash1-infohash2-...] findspiesonly
	node freerider.js [magnet1-magnet2-...] findspiesonly

## Related projects :

* [Ayms/node-Tor](https://github.com/Ayms/node-Tor)
* [Ayms/iAnonym](https://github.com/Ayms/iAnonym)
* [Interception Detector](http://www.ianonym.com/intercept.html)
* [Ayms/abstract-tls](https://github.com/Ayms/abstract-tls)
* [Ayms/websocket](https://github.com/Ayms/websocket)
* [Ayms/node-typedarray](https://github.com/Ayms/node-typedarray)
* [Ayms/node-dom](https://github.com/Ayms/node-dom)
* [Ayms/node-bot](https://github.com/Ayms/node-bot)
* [Ayms/node-gadgets](https://github.com/Ayms/node-gadgets)

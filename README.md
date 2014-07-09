torrent-live
===

Download and stream live (while the download is in progress) torrents with your browser, send it to your TV, as a total freerider do not unveal what you are doing to the outside, easy to use and real time.

## Presentation

This is based on the excellent [torrent-stream](https://github.com/mafintosh/torrent-stream) (and common parts of [webtorrent](https://github.com/feross/webtorrent)) modules and is somewhere related to [torrent-mount](https://github.com/mafintosh/torrent-mount) but in a more simple way we believe.

You just have to initiate a download (magnet:?xt=urn:btih:ef330b39f4801d25b4245212e75a38634bfc856e corresponding to myvideo.mp4) and open your browser on the file that is being downloaded (typically with an URL like file:///D:/torrent/torrent-live/store/myvideo.mp4)

The streaming will start while the file is being downloaded.

If you have something like Chromecast you can use the Chrome browser and the Cast extension (https://chrome.google.com/webstore/detail/google-cast/boadgeojelhgndaghljhdicfkmllpafd) to send it to your TV.

## Freerider

torrent-live does behave like a total freerider, so unlike usual bittorrent clients, nobody can know what you are doing and you are not participating to the torrents.

It is of course not using trackers, only magnet links and the bittorrent Distributed Hash Table (DHT).

The only ones that know something about you are those you are connected to, you can see their IP addresses on the console, it's unlikely that these ones, which are sharing the content, are tracking you.

So you just retrieve the pieces, do not advertise yourself and do not share anything, therefore your activity is difficult to detect.

The messages on the console inform you about what torrent-live is doing and progress status.

You can keep or remove the file(s) at the end of the download, in any case you are never seeding/sending to others what you have downloaded.

If you want more advanced security/anonymity features you can checkout [Peersm](http://www.peersm.com) and [try it](http://peersm.com/peersm), see [node-Tor](https://github.com/Ayms/node-Tor) for the technical details.

## Installation and use (Windows, Mac, Linux):

Install nodejs v0.11.9 for your platform (http://nodejs.org/dist/v0.11.9/) or the official nodejs release (http://nodejs.org/download/)

For those that are not familiar with nodejs, on windows for example:

	With your browser download:

	http://nodejs.org/dist/v0.11.9/node-v0.11.9-x86.msi (5.5 MB)

	or for a 64 bits conf:

	http://nodejs.org/dist/v0.11.9/x64/node-v0.11.9-x64.msi

Then execute the files, this will install node.

For different reasons we don't use npm, so to install torrent-live:

	Download http://www.peersm.com/torrent-live.zip
	
	Create for example a 'torrent' directory and unzip torrent-live.zip
	
To use it:

	Go in torrent/torrent-live directory
	
	Run from the command line:
	
	node freerider.js [magnet] [path]
	
	or
	
	node freerider.js [magnet]
	
The file being downloaded will appear in the 'store' directory (myvideo.mp4) or in a new folder in this directory if there are several files.

Wait (looking at the messages "got for torrent myvideo.mp4 of size 1 GB 220 kBytes of data - Piece number x - remaining y MB - speed: z kbps - time left: 0h15 - number of peers: n")
that some MBytes have been downloaded and open your browser with an url pointing to your store/myvideo.mp4 directory (ie file:///D:/torrent/torrent-live/store/myvideo.mp4)

The default path is the 'store' directory in the 'torrent-live' directory, this is where the files will be stored if you don't specify the path parameter.
	
	Examples:
	
	node freerider.js 'magnet:?xt=urn:btih:ef330b39f4801d25b4245212e75a38634bfc856e'
	
	node freerider.js 'magnet:?xt=urn:btih:ef330b39f4801d25b4245212e75a38634bfc856e' 'D:/myvideos'
	
## Tips/Recommendations:

Just use simple magnet links formatted as the above examples with the infohash information only ('ef330b39f4801d25b4245212e75a38634bfc856e' here), do not use other formats, it's easy to retrieve the infohash information on the internet or to deduct it from trackers links.

Do not use trackers sites and do not follow their wrong and insecure recommendations, like not using the DHT.

Using the DHT, there are no requirements that you must share what you download, which as a freerider you are not doing, and ratio enforcement stories.

If for a given infohash the download does not start, then it probably means that nobody is serving this file, or that there is a bug somewhere, please advise if you are suspecting the later.

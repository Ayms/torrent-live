torrent-live
===

Download and stream live (while the download is in progress) torrents with your browser, send it to your TV, as a total freerider minimize what you are unvealing to the outside regarding your activities, real-time, easy to install, easy to use.

## Presentation

This is based on the excellent [torrent-stream](https://github.com/mafintosh/torrent-stream) (and common parts of [webtorrent](https://github.com/feross/webtorrent)) modules and is somewhere related to [torrent-mount](https://github.com/mafintosh/torrent-mount) but in a more simple way we believe.

You just have to initiate a download (magnet:?xt=urn:btih:ef330b39f4801d25b4245212e75a38634bfc856e corresponding to myvideo.mp4) and open your browser on the file that is being downloaded (typically with an URL like <b>file:///D:/torrent/torrent-live/store/myvideo.mp4</b>)

The streaming will start while the file is being downloaded.

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

## File conversion

If you need to convert a file you can use applications like VLC, but the converted file might be broken, we usually follow what is indicated in Links section of [Peersm](http://www.peersm.com), 'Adding and audio/video - simple way' and run the specified 'very intuitive' command to convert into a webm format. Another advantage of doing this is that the file will be formatted for adaptive streaming and if it is seeded people will be able to download and stream it anonymously using [Peersm application](http://www.peersm.com)

## Tips/Recommendations

Just use simple magnet links formatted as the above examples with the infohash information only ('ef330b39f4801d25b4245212e75a38634bfc856e' here), do not use other formats, it's easy to retrieve the infohash information on the internet or to deduct it from trackers links.

Do not use trackers sites and do not follow their wrong and insecure recommendations, like not using the DHT.

Using the DHT, there are no requirements that you must share what you download, which as a freerider you are not doing, and ratio enforcement stories.

If for a given infohash the download does not start, then it probably means that nobody is serving this file, or that there is a bug somewhere, please advise if you are suspecting the later.

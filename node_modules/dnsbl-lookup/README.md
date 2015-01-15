## Node.js DNSBLs Lookup
Supports IPv4, IPv6 and Domain lookup. Works from command-line.
## Installation
```javascript
npm install dnsbl-lookup -g
var lookup = require('dnsbl-lookup'); // inside module
```    
    
## Usage
#### [DNSBL Lookup](http://en.wikipedia.org/wiki/DNSBL#DNSBL_queries):

##### dnsbl(ip-or-domain,[dnsbl_list],[limit])
Performs DNSBL lookup on the given IP address. If a domain is provided, lookup is performed on it's 'A' records. 

 * `ip-or-domain`: String containing IPv4, IPv6 or domain names
 * `dnsbl_list`: Optional, Array of DNSBL zone names
 * `limit`: Optional, Maximum number of outstanding DNS queries at a time. Defaults to 200.

##### Example:

```javascript
var dnsbl = new lookup.dnsbl('58.97.142.25');

dnsbl.on('error',function(error,blocklist){ ... });
dnsbl.on('data',function(result,blocklist){
  console.log(result.status + ' in ' + blocklist.zone);
});
dnsbl.on('done', function(){ 
  console.log('lookup finished');
});  
```

#### [URI DNSBL Lookup](http://en.wikipedia.org/wiki/DNSBL#URI_DNSBL) :

#####  uribl(domains,[uribl_list],limit)
Performs a URI DNSBL query on the give domain(s). 

 * `domains`: String or Array of domain names
 * `uribl_list`: Optional, Array of URI DNSBL zone names
 * `limit`: Optional, Maximum number of outstanding DNS queries at a time. Defaults to 200.

##### Example:

```javascript
var uribl= new lookup.uribl('gmail.com');

uribl.on('error',function(error,blocklist){ ... });
uribl.on('data',function(result,blocklist){ ... });
uribl.on('done', function(){ ... });  
```

_see more examples in test.js_

### Response:
 * `address`: lookup address
 * `status`: listed / not_listed
 * `A`: 'A' record lookup result only when listed
 * `TXT`: 'TXT' record lookup result if found

```javascript  
//if not listed
{ address:'58.97.142.25', status: 'not_listed' }

//if listed
{ 
  address: '58.97.142.25',
  status: 'listed',
  A: '127.0.0.2',
  TXT: 'Blocked - see http://cbl.abuseat.org/lookup.cgi?ip=58.97.142.25' 
}
```

### Command-line:

```bash     
$ dnsbl-lookup 58.97.142.25
$ dnsbl-lookup 2a01:4f8:140:4222::2
$ dnsbl-lookup gmail.com list.txt // list.txt is line-separated dns zones 
```
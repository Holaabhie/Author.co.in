const dns = require('dns');

dns.reverse('2406:da1c:61c:d601:6720:c66f:beb:64f1', (err, hostnames) => {
  if (err) {
    console.error('Reverse lookup failed:', err.message);
  } else {
    console.log('Hostnames:', hostnames);
  }
});

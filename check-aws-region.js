const https = require('https');

https.get('https://ip-ranges.amazonaws.com/ip-ranges.json', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const json = JSON.parse(data);
    const ip = '2406:da1c:61c:d601:6720:c66f:beb:64f1';
    
    // We want to find which CIDR block contains the prefix 2406:da1c:61c
    // Let's filter prefixes that start with "2406:da1c"
    const matches = json.ipv6_prefixes.filter(p => {
      return p.ipv6_prefix.startsWith('2406:da1c');
    });

    console.log('Matches found for 2406:da1c:');
    matches.forEach(m => {
      console.log(`Prefix: ${m.ipv6_prefix}, Region: ${m.region}, Service: ${m.service}`);
    });
  });
}).on('error', (err) => {
  console.error('Error fetching AWS ranges:', err.message);
});

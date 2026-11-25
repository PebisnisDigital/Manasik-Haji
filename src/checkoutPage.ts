// Compatibility redirect for previously shared referral URLs. All registration is inside the game.
const url=new URL('./index.html',location.href);const ref=new URLSearchParams(location.search).get('ref');if(ref&&/^HJ-[A-Fa-f0-9]{12}$/.test(ref))url.searchParams.set('ref',ref.toUpperCase());location.replace(url.href);

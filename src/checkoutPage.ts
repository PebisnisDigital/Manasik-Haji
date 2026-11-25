import {mountGateRegistration} from './gateRegistration.ts';
mountGateRegistration(document.getElementById('checkoutHost')!,document.getElementById('checkoutNotice')!,()=>location.assign('./index.html'));

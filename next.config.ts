import type { NextConfig } from 'next';
const config:NextConfig={poweredByHeader:false,devIndicators:false,agentRules:false,logging:{serverFunctions:false,browserToTerminal:false},async headers(){return [{source:'/:path*',headers:[{key:'Referrer-Policy',value:'no-referrer'},{key:'X-Content-Type-Options',value:'nosniff'}]}];}};
export default config;

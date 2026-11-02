import { Policy } from '../domain/policy/policy';
const daysAgo=(days:number)=>{const date=new Date();date.setUTCDate(date.getUTCDate()-days);return date.toISOString().slice(0,10)};
export const SEED_POLICIES:Policy[]=[
{id:'POL-1001',policyNumber:'ALPS-1001',customerName:'Alex Morgan',customerEmail:'alex@example.test',product:'standard',sumAssuredPence:25000000,premiumPaidPence:4800,startDate:daysAgo(12),beneficiaries:[{name:'Jamie Morgan',email:'jamie@example.test',sharePercent:100}],inTrust:false,cancelled:false},
{id:'POL-1002',policyNumber:'ALPS-1002',customerName:'Sam Taylor',customerEmail:'sam@example.test',product:'over50',sumAssuredPence:2500000,premiumPaidPence:3200,startDate:daysAgo(90),beneficiaries:[{name:'Robin Taylor',email:'robin@example.test',sharePercent:60},{name:'Casey Taylor',email:'casey@example.test',sharePercent:40}],inTrust:false,cancelled:false}];

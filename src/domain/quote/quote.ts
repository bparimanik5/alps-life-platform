import { randomUUID } from 'node:crypto';
import { monthlyRate } from '../../data/rate-tables';
import { DomainError } from '../shared/errors';
export type Product='standard'|'over50';
export type QuoteStatus='AWAITING_SMOKER_STATUS'|'QUOTED'|'REFERRAL';
export interface QuoteInput { age:number; coverAmount:number; smokerStatus?:boolean; preExistingConditions?:boolean[]; product?:Product; customerEmail?:string }
export interface Quote { id:string; age:number; coverAmount:number; product:Product; smokerStatus:boolean|null; customerEmail?:string; status:QuoteStatus; premiums?:{levelTermPence:number;decreasingTermPence:number}; referralReason?:string; createdAt:string }
const roundHalfUp=(n:number,d:number)=>Math.floor((n+d/2)/d);
function validate(input:QuoteInput,product:Product):void {
 if(!Number.isInteger(input.age)) throw new DomainError('Age must be a whole number');
 if(product==='over50') { if(input.age<50||input.age>80) throw new DomainError('Over-50 product is available to ages 50 to 80'); if(!Number.isInteger(input.coverAmount)||input.coverAmount<1||input.coverAmount>25000) throw new DomainError('Over-50 cover must be between GBP 1 and GBP 25,000'); }
 else { if(input.age<18||input.age>75) throw new DomainError('Standard product is available to ages 18 to 75'); if(!Number.isInteger(input.coverAmount)||input.coverAmount<1||input.coverAmount>500000) throw new DomainError('Standard cover must be between GBP 1 and GBP 500,000'); }
}
function price(age:number,cover:number,smoker:boolean,product:Product) { const rate=monthlyRate(age,smoker,product); const coverPence=cover*100; return {levelTermPence:roundHalfUp(coverPence*rate,100000),decreasingTermPence:roundHalfUp(coverPence*rate*82,10000000)}; }
export function createQuote(input:QuoteInput,id=randomUUID()):Quote {
 const product=input.product??'standard'; validate(input,product); const referral=(input.preExistingConditions??[]).some(Boolean);
 const status:QuoteStatus=referral?'REFERRAL':input.smokerStatus===undefined?'AWAITING_SMOKER_STATUS':'QUOTED';
 return {id,age:input.age,coverAmount:input.coverAmount,product,smokerStatus:input.smokerStatus??null,customerEmail:input.customerEmail,status,...(status==='QUOTED'?{premiums:price(input.age,input.coverAmount,input.smokerStatus as boolean,product)}:{}),...(referral?{referralReason:'A pre-existing condition requires underwriting review'}:{}),createdAt:new Date().toISOString()};
}
export function answerSmokerStatus(quote:Quote,smokerStatus:boolean):Quote {
 if(quote.status==='REFERRAL') throw new DomainError('Referred quotes do not receive an instant price');
 if(quote.status!=='AWAITING_SMOKER_STATUS') throw new DomainError('Smoker status has already been answered');
 return {...quote,smokerStatus,status:'QUOTED',premiums:price(quote.age,quote.coverAmount,smokerStatus,quote.product)};
}

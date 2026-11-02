import { randomUUID } from 'node:crypto';
import { DomainError } from '../shared/errors';
export const CLAIM_HANDLERS=['A. Patel','J. Wilson','M. Chen'] as const;
export const REQUIRED_DOCUMENTS=['death-certificate','claimant-id'] as const;
export type DocumentType=typeof REQUIRED_DOCUMENTS[number]; export type ClaimStatus='PENDING'|'DOCUMENTS_RECEIVED';
export interface ClaimBeneficiary{name:string;email:string} export interface ClaimDocument{type:DocumentType;filename:string;mimeType:string;sizeBytes:number}
export interface Claim{id:string;policyId:string;policyNumber:string;sumAssuredPence:number;policyYearsInForce:number;status:ClaimStatus;handler:string;beneficiaries:ClaimBeneficiary[];documents:ClaimDocument[];createdAt:string}
export interface ClaimInput{policyId:string;policyNumber:string;sumAssuredPence:number;policyYearsInForce?:number;beneficiaries:ClaimBeneficiary[]}
export interface ClaimRepository{get(id:string):Claim|undefined;save(claim:Claim):void}
const roundHalfUp=(n:number,d:number)=>Math.floor((n+d/2)/d);
export class ClaimsService { private cursor=0; constructor(private repository:ClaimRepository,private notify:(claim:Claim,stage:ClaimStatus)=>void){}
 create(input:ClaimInput):Claim { const years=input.policyYearsInForce??0; if(!Number.isInteger(years)||years<0||years>100)throw new DomainError('Policy years in force must be between 0 and 100'); const claim:Claim={id:randomUUID(),policyId:input.policyId,policyNumber:input.policyNumber,sumAssuredPence:input.sumAssuredPence,policyYearsInForce:years,status:'PENDING',handler:CLAIM_HANDLERS[this.cursor%CLAIM_HANDLERS.length],beneficiaries:input.beneficiaries,documents:[],createdAt:new Date().toISOString()}; this.cursor++;this.repository.save(claim);this.notify(claim,claim.status);return claim }
 addDocument(id:string,doc:ClaimDocument):Claim { const claim=this.require(id); if(!new Set(['application/pdf','image/jpeg','image/png']).has(doc.mimeType))throw new DomainError('Documents must be PDF, JPEG, or PNG'); if(doc.sizeBytes<=0||doc.sizeBytes>10*1024*1024)throw new DomainError('Document size must be between 1 byte and 10 MB'); const extensions:Record<string,string[]>={'application/pdf':['.pdf'],'image/jpeg':['.jpg','.jpeg'],'image/png':['.png']}; if(!extensions[doc.mimeType].some(ext=>doc.filename.toLowerCase().endsWith(ext)))throw new DomainError('Filename extension must match the document format'); const docs=[...claim.documents.filter(x=>x.type!==doc.type),doc]; const complete=REQUIRED_DOCUMENTS.every(t=>docs.some(x=>x.type===t)); const updated={...claim,documents:docs,status:complete?'DOCUMENTS_RECEIVED' as const:claim.status};this.repository.save(updated);if(claim.status!==updated.status)this.notify(updated,updated.status);return updated }
 get(id:string){return this.repository.get(id)}
 payout(id:string){const claim=this.require(id);let indexed=claim.sumAssuredPence;for(let year=0;year<claim.policyYearsInForce;year++)indexed=roundHalfUp(indexed*10300,10000);const cap=roundHalfUp(claim.sumAssuredPence*2500,10000);const totalPence=Math.min(indexed,claim.sumAssuredPence+cap);return {sumAssuredPence:claim.sumAssuredPence,indexationUpliftPence:totalPence-claim.sumAssuredPence,totalPence}}
 private require(id:string):Claim{const claim=this.repository.get(id);if(!claim)throw new DomainError('Claim not found',404);return claim}
}

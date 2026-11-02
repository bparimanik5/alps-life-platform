import { Claim, ClaimRepository } from './claims';
export class InMemoryClaimRepository implements ClaimRepository {private items=new Map<string,Claim>();get(id:string){return this.items.get(id)}save(claim:Claim){this.items.set(claim.id,claim)}}

import { Policy, PolicyRepository } from './policy';
export class InMemoryPolicyRepository implements PolicyRepository {private items=new Map<string,Policy>();constructor(seed:Policy[]=[]){for(const p of seed)this.items.set(p.id,p)}get(id:string){return this.items.get(id)}save(policy:Policy){this.items.set(policy.id,policy)}}

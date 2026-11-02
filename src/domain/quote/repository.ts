import { Quote } from './quote';
export interface QuoteRepository { get(id:string):Quote|undefined; save(quote:Quote):void }
export class InMemoryQuoteRepository implements QuoteRepository { private items=new Map<string,Quote>(); get(id:string){return this.items.get(id)} save(quote:Quote){this.items.set(quote.id,quote)} }

export interface EmailMessage{id:string;to:string;subject:string;body:string;sentAt:string}
export interface EmailService{send(to:string,subject:string,body:string):EmailMessage;list():EmailMessage[]}
export class InMemoryEmailService implements EmailService {private outbox:EmailMessage[]=[];send(to:string,subject:string,body:string):EmailMessage{const message={id:`${Date.now()}-${this.outbox.length+1}`,to,subject,body,sentAt:new Date().toISOString()};this.outbox.push(message);return message}list(){return [...this.outbox]}}

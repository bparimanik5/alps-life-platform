import express, {NextFunction,Request,Response} from 'express';
import path from 'node:path';
import {z,ZodError} from 'zod';
import {ClaimsService,ClaimInput,REQUIRED_DOCUMENTS} from './domain/claims/claims';
import {InMemoryClaimRepository} from './domain/claims/repository';
import {DomainError} from './domain/shared/errors';
import {answerSmokerStatus,createQuote,QuoteInput} from './domain/quote/quote';
import {InMemoryQuoteRepository} from './domain/quote/repository';
import {cancelPolicy,createTrustDeed,Policy,switchPolicy,updateBeneficiaries} from './domain/policy/policy';
import {InMemoryPolicyRepository} from './domain/policy/repository';
import {SEED_POLICIES} from './data/seed';
import {EmailService,InMemoryEmailService} from './services/email';
export interface AppServices{quotes:InMemoryQuoteRepository;policies:InMemoryPolicyRepository;claims:ClaimsService;email:EmailService}
export function createDemoServices():AppServices {const email=new InMemoryEmailService();const policies=new InMemoryPolicyRepository(SEED_POLICIES.map(p=>({...p,beneficiaries:[...p.beneficiaries]})));const claims=new ClaimsService(new InMemoryClaimRepository(),(claim,stage)=>{for(const b of claim.beneficiaries)email.send(b.email,`Claim ${claim.policyNumber}: ${stage}`,`Claim ${claim.id} for policy ${claim.policyNumber} is now ${stage}.`)});return {quotes:new InMemoryQuoteRepository(),policies,claims,email}}
const idSchema=z.string().min(1);
const quoteSchema=z.object({age:z.number().int(),coverAmount:z.number().int(),smokerStatus:z.boolean().optional(),preExistingConditions:z.array(z.boolean()).optional(),product:z.enum(['standard','over50']).optional(),customerEmail:z.string().email().optional()});
const beneficiarySchema=z.object({name:z.string().trim().min(1),email:z.string().email(),sharePercent:z.number().int().min(1).max(100)});
const beneficiariesSchema=z.object({beneficiaries:z.array(beneficiarySchema).min(1)});
function getPolicy(services:AppServices,id:string):Policy{const p=services.policies.get(id);if(!p)throw new DomainError('Policy not found',404);return p}
export function createApp(services:AppServices=createDemoServices()){
 const app=express();app.use(express.json({limit:'1mb'}));app.use(express.static(path.join(process.cwd(),'public')));
 app.get('/api/health',(_req,res)=>res.json({status:'ok',service:'ALPS - Aviva Life Platform (mock)'}));app.get('/api/outbox',(_req,res)=>res.json(services.email.list()));
 app.post('/api/quotes',(req,res)=>{const quote=createQuote(quoteSchema.parse(req.body) as QuoteInput);services.quotes.save(quote);res.status(201).json(quote)});
 app.get('/api/quotes/:id',(req,res)=>{const q=services.quotes.get(idSchema.parse(req.params.id));if(!q)throw new DomainError('Quote not found',404);res.json(q)});
 app.patch('/api/quotes/:id/smoker',(req,res)=>{const id=idSchema.parse(req.params.id);const body=z.object({smokerStatus:z.boolean()}).parse(req.body);const q=services.quotes.get(id);if(!q)throw new DomainError('Quote not found',404);const updated=answerSmokerStatus(q,body.smokerStatus);services.quotes.save(updated);res.json(updated)});
 app.post('/api/quotes/:id/email',(req,res)=>{const id=idSchema.parse(req.params.id);const body=z.object({email:z.string().email().optional()}).parse(req.body??{});const q=services.quotes.get(id);if(!q)throw new DomainError('Quote not found',404);if(q.status!=='QUOTED')throw new DomainError('Only priced quotes can be emailed');const to=body.email??q.customerEmail;if(!to)throw new DomainError('Provide an email address for the quote summary');const email=services.email.send(to,`Your ALPS life cover quote ${q.id}`,`Your monthly level term premium is GBP ${(q.premiums!.levelTermPence/100).toFixed(2)} and decreasing term is GBP ${(q.premiums!.decreasingTermPence/100).toFixed(2)}. Resume: /?quote=${q.id}`);res.status(202).json(email)});
 app.post('/api/claims',(req,res)=>{const input=z.object({policyId:z.string().min(1),policyYearsInForce:z.number().int().min(0).max(100).optional()}).parse(req.body);const p=getPolicy(services,input.policyId);const claimInput:ClaimInput={policyId:p.id,policyNumber:p.policyNumber,sumAssuredPence:p.sumAssuredPence,policyYearsInForce:input.policyYearsInForce,beneficiaries:p.beneficiaries.map(({name,email})=>({name,email}))};res.status(201).json(services.claims.create(claimInput))});
 app.post('/api/claims/:id/documents',express.raw({type:['application/pdf','image/jpeg','image/png'],limit:'10mb'}),(req,res)=>{const id=idSchema.parse(req.params.id);const doc=Buffer.isBuffer(req.body)?{type:z.enum(REQUIRED_DOCUMENTS).parse(req.query.type),filename:z.string().min(1).parse(req.query.filename),mimeType:typeof req.headers['content-type']==='string'?req.headers['content-type']:'',sizeBytes:req.body.length}:z.object({type:z.enum(REQUIRED_DOCUMENTS),filename:z.string().min(1),mimeType:z.string(),sizeBytes:z.number().int()}).parse(req.body);res.json(services.claims.addDocument(id,doc))});
 app.get('/api/claims/:id',(req,res)=>{const c=services.claims.get(idSchema.parse(req.params.id));if(!c)throw new DomainError('Claim not found',404);res.json(c)});app.get('/api/claims/:id/payout',(req,res)=>res.json(services.claims.payout(idSchema.parse(req.params.id))));
 app.get('/api/policies/:id',(req,res)=>res.json(getPolicy(services,idSchema.parse(req.params.id))));
 app.put('/api/policies/:id/beneficiaries',(req,res)=>{const id=idSchema.parse(req.params.id);const body=beneficiariesSchema.parse(req.body);const p=updateBeneficiaries(getPolicy(services,id),body.beneficiaries);services.policies.save(p);res.json(p)});
 app.post('/api/policies/:id/trust',(req,res)=>{const id=idSchema.parse(req.params.id);const p=createTrustDeed(getPolicy(services,id));services.policies.save(p);res.json(p)});
 app.post('/api/policies/:id/cancel',(req,res)=>{const id=idSchema.parse(req.params.id);const result=cancelPolicy(getPolicy(services,id));services.policies.save(result.policy);services.email.send(result.policy.customerEmail,`Cancellation confirmed: ${result.policy.policyNumber}`,`Policy ${result.policy.policyNumber} has been cancelled. Refund: GBP ${(result.refundPence/100).toFixed(2)}.`);res.json(result)});
 app.post('/api/policies/:id/switch',(req,res)=>{const id=idSchema.parse(req.params.id);const body=z.object({product:z.enum(['standard','over50'])}).parse(req.body);const result=switchPolicy(getPolicy(services,id),body.product);services.policies.save(result.policy);res.json(result)});
 app.use((err:unknown,_req:Request,res:Response,_next:NextFunction)=>{if(err instanceof ZodError)return res.status(400).json({error:'Validation failed',details:err.issues});if(err instanceof DomainError)return res.status(err.statusCode).json({error:err.message});if(typeof err==='object'&&err!==null&&'status' in err&&typeof err.status==='number')return res.status(err.status).json({error:err.status===413?'Request body too large':'Invalid request body'});console.error(err);return res.status(500).json({error:'Internal server error'})});
 return app;
}

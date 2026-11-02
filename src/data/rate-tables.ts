export type AgeBand = { minAge: number; maxAge: number; monthlyPencePerThousand: number };
export const RATE_TABLES: Record<'standard' | 'over50', Record<'nonSmoker' | 'smoker', AgeBand[]>> = {
  standard: {
    nonSmoker: [{minAge:18,maxAge:30,monthlyPencePerThousand:10},{minAge:31,maxAge:45,monthlyPencePerThousand:15},{minAge:46,maxAge:60,monthlyPencePerThousand:24},{minAge:61,maxAge:75,monthlyPencePerThousand:40}],
    smoker: [{minAge:18,maxAge:30,monthlyPencePerThousand:16},{minAge:31,maxAge:45,monthlyPencePerThousand:24},{minAge:46,maxAge:60,monthlyPencePerThousand:38},{minAge:61,maxAge:75,monthlyPencePerThousand:64}]
  },
  over50: { nonSmoker:[{minAge:50,maxAge:80,monthlyPencePerThousand:22}], smoker:[{minAge:50,maxAge:80,monthlyPencePerThousand:35}] }
};
export function monthlyRate(age:number, smoker:boolean, product:'standard'|'over50'):number {
  const band=RATE_TABLES[product][smoker?'smoker':'nonSmoker'].find(x=>age>=x.minAge&&age<=x.maxAge);
  if(!band) throw new RangeError(`No rate available for age ${age} and product ${product}`);
  return band.monthlyPencePerThousand;
}

import {getClient,isConfigured} from './content-store.mjs';
import {validateMascot} from './mascot-model.mjs';
const unwrap=result=>{if(result.error)throw result.error;return result.data;};
export async function loadMascots({admin=false,preview=false}={}){
  if(preview||!isConfigured()){
    const response=await fetch(new URL('../data/mascots.json',import.meta.url));
    if(!response.ok)throw new Error('Could not load mascot preview.');return response.json();
  }
  const client=await getClient();let query=client.from('portfolio_mascots').select('*').order('sort_order').order('title');
  if(!admin)query=query.eq('published',true);
  return unwrap(await query)||[];
}
export async function saveMascot(value,previous){
  const client=await getClient(),row=validateMascot(value);
  let query=previous?client.from('portfolio_mascots').update(row).eq('id',previous.id).eq('updated_at',previous.updated_at):client.from('portfolio_mascots').insert(row);
  const saved=unwrap(await query.select().maybeSingle());
  if(!saved)throw new Error('This mascot changed in another tab. Reopen it before saving.');return saved;
}
export async function deleteMascot(row){
  const client=await getClient();const data=unwrap(await client.from('portfolio_mascots').delete().eq('id',row.id).eq('updated_at',row.updated_at).select('id'));
  if(!data.length)throw new Error('This mascot changed in another tab. Refresh before deleting.');
}

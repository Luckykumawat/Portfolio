import { CMS_CONFIG } from './config.mjs';
import { validateItem, validateProfile } from './model.mjs';
let clientPromise;
let publicPromise;
export const isConfigured = () => Boolean(CMS_CONFIG.supabaseUrl && CMS_CONFIG.supabasePublishableKey);
export async function getClient() {
  if (!isConfigured()) throw new Error('Supabase is not connected. Configure cms/config.mjs first.');
  if (!clientPromise) clientPromise = import('./vendor/supabase.mjs').then(({createClient}) => createClient(CMS_CONFIG.supabaseUrl, CMS_CONFIG.supabasePublishableKey, {
    auth: {persistSession:true, autoRefreshToken:true, detectSessionInUrl:true, storageKey:'okuma-admin-auth'}
  }));
  return clientPromise;
}
export async function loadSnapshot() {
  const response = await fetch(new URL('../data/portfolio.json', import.meta.url), {cache:'no-cache'});
  if (!response.ok) throw new Error('Could not load the portfolio content snapshot.');
  return response.json();
}
function unwrap(result) { if (result.error) throw result.error; return result.data; }
export function loadPublicContent() {
  if (!publicPromise) publicPromise = (async () => {
    if (!isConfigured()) return loadSnapshot();
    const client = await getClient();
    const [items,profile] = await Promise.all([
      client.from('portfolio_content').select('*').eq('published',true).order('sort_order'),
      client.from('portfolio_profile').select('*').eq('id','main').eq('published',true).maybeSingle()
    ]);
    return {version:1,items:unwrap(items) || [],profile:unwrap(profile)};
  })();
  return publicPromise;
}
export async function isAdmin() {
  const client = await getClient();
  return Boolean(unwrap(await client.rpc('portfolio_is_admin')));
}
export async function loadAdminContent() {
  const client = await getClient();
  if (!await isAdmin()) throw new Error('This account does not have portfolio admin access.');
  const [items,profile] = await Promise.all([
    client.from('portfolio_content').select('*').order('sort_order'),
    client.from('portfolio_profile').select('*').eq('id','main').maybeSingle()
  ]);
  return {items:unwrap(items) || [],profile:unwrap(profile)};
}
export async function saveItem(value, previous = null) {
  const client = await getClient();
  const record = validateItem(value);
  if (previous) {
    // Detect another tab/admin updating the same record before overwriting it.
    const query = client.from('portfolio_content').update(record).eq('id',previous.id);
    if (previous.updated_at) query.eq('updated_at',previous.updated_at);
    const data = unwrap(await query.select().maybeSingle());
    if (!data) throw new Error('This item changed in another tab. Refresh before editing it again.');
    return data;
  }
  return unwrap(await client.from('portfolio_content').insert(record).select().single());
}
export async function deleteItem(id) {
  const client = await getClient();
  const data = unwrap(await client.from('portfolio_content').delete().eq('id',id).select('id'));
  if (!data?.length) throw new Error('The item could not be deleted. Refresh and try again.');
}
export async function saveProfile(value,published,previous = null) {
  const client = await getClient();
  const record = {id:'main',published:published === true,data:validateProfile(value)};
  if (!previous) return unwrap(await client.from('portfolio_profile').insert(record).select().single());
  const query = client.from('portfolio_profile').update(record).eq('id','main');
  if (previous.updated_at) query.eq('updated_at',previous.updated_at);
  const data = unwrap(await query.select().maybeSingle());
  if (!data) throw new Error('Profile changed in another tab. Refresh before saving.');
  return data;
}
export async function importSnapshot() {
  const client = await getClient();
  if (!await isAdmin()) throw new Error('Admin access is required.');
  const snapshot = await loadSnapshot();
  // Stable IDs + ignoreDuplicates make retrying imports safe for existing edits.
  unwrap(await client.from('portfolio_content').upsert(snapshot.items,{onConflict:'id',ignoreDuplicates:true}));
  unwrap(await client.from('portfolio_profile').upsert(snapshot.profile,{onConflict:'id',ignoreDuplicates:true}));
  const mascotResponse = await fetch(new URL('../data/mascots.json', import.meta.url));
  if (!mascotResponse.ok) throw new Error('Could not load the original mascot collection.');
  unwrap(await client.from('portfolio_mascots').upsert(await mascotResponse.json(),{onConflict:'slug',ignoreDuplicates:true}));
}
export async function uploadImage(file) {
  const mimeExtensions = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif','image/gif':'gif'};
  const ext = mimeExtensions[file.type];
  if (!ext) throw new Error('Choose a JPG, PNG, WebP, AVIF or GIF image.');
  if (file.size > 8 * 1024 * 1024) throw new Error('Choose an image smaller than 8 MB.');
  const client = await getClient();
  const user = unwrap(await client.auth.getUser())?.user;
  if (!user) throw new Error('Sign in before uploading.');
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  unwrap(await client.storage.from(CMS_CONFIG.storageBucket).upload(path,file,{upsert:false,contentType:file.type,cacheControl:'3600'}));
  return client.storage.from(CMS_CONFIG.storageBucket).getPublicUrl(path).data.publicUrl;
}

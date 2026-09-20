import { MapPin, Navigation, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Place, PlaceCategory } from '../types'

type OSMResult={place_id:number;display_name:string;name?:string;lat:string;lon:string;type?:string;class?:string;namedetails?:Record<string,string>;address?:Record<string,string>}
const cache=new Map<string,Place[]>()
const SBH_BOX='-62.891,17.873,-62.779,17.974'

function categoryFor(r:OSMResult):PlaceCategory{
 const t=(r.type||'').toLowerCase(),c=(r.class||'').toLowerCase()
 if(c==='tourism'&&['hotel','guest_house','resort','apartment'].some(x=>t.includes(x)))return'Hôtel'
 if(c==='amenity'&&['restaurant','cafe','bar','fast_food','pub'].some(x=>t.includes(x)))return'Restaurant'
 if(t.includes('beach'))return'Plage'
 if(['house','villa','residential','apartments'].some(x=>t.includes(x)))return'Villa'
 if(['suburb','neighbourhood','quarter','hamlet','village','road','street','residential'].some(x=>t.includes(x)))return'Quartier'
 return'Lieu important'
}
function description(r:OSMResult,name:string){
 const a=r.address||{}
 const useful=[a.house_number,a.road,a.neighbourhood,a.suburb,a.village,a.town].filter(Boolean)
 if(useful.length)return[...new Set(useful)].join(' · ')
 return r.display_name.split(',').map(x=>x.trim()).filter(x=>x&&x.toLowerCase()!==name.toLowerCase()).slice(0,3).join(' · ')||'Saint-Barthélemy'
}
function mapResult(r:OSMResult,q:string):Place{
 const name=(r.namedetails?.['name:fr']||r.namedetails?.name||r.name||r.display_name.split(',')[0]||q).trim()
 return{id:`osm-${r.place_id}`,name,description:description(r,name),lat:Number(r.lat),lng:Number(r.lon),category:categoryFor(r)}
}
async function nominatim(q:string,limit='20'){
 const params=new URLSearchParams({q,format:'jsonv2',addressdetails:'1',namedetails:'1',limit,countrycodes:'bl',viewbox:SBH_BOX,bounded:'1',layer:'address,poi'})
 const res=await fetch(`https://nominatim.openstreetmap.org/search?${params}`,{headers:{Accept:'application/json','Accept-Language':'fr'}})
 if(!res.ok)throw new Error('search')
 return await res.json() as OSMResult[]
}

export default function PlacePicker({label,value,places,onChange,type}:{label:string;value?:Place;places:Place[];onChange:(p:Place)=>void;type:'from'|'to'}){
 const[open,setOpen]=useState(false),[query,setQuery]=useState(''),[online,setOnline]=useState<Place[]>([]),[loading,setLoading]=useState(false),[searched,setSearched]=useState(false),[error,setError]=useState('')
 const local=useMemo(()=>{const q=query.toLowerCase().trim();return q?places.filter(p=>(p.name+' '+p.description+' '+p.category).toLowerCase().includes(q)).slice(0,8):places.slice(0,6)},[places,query])
 const results=useMemo(()=>{const seen=new Set<string>();return[...local,...online].filter(p=>{const k=p.name.toLowerCase()+'|'+p.lat.toFixed(4)+'|'+p.lng.toFixed(4);if(seen.has(k))return false;seen.add(k);return true}).slice(0,20)},[local,online])

 async function searchOnline(){
  const q=query.trim();if(q.length<2)return
  setError('');setSearched(true);const key=q.toLowerCase()
  if(cache.has(key)){setOnline(cache.get(key)!);return}
  setLoading(true)
  try{
   // Deliberately submit-only: public Nominatim forbids client-side autocomplete.
   // Try exact SBH query first, then a broader spelling/POI query if necessary.
   let data=await nominatim(q)
   if(data.length<5){
    const more=await nominatim(`${q}, Saint-Barthélemy`)
    const ids=new Set(data.map(x=>x.place_id));data=[...data,...more.filter(x=>!ids.has(x.place_id))]
   }
   const mapped=data.map(r=>mapResult(r,q)).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&p.lat>=17.873&&p.lat<=17.974&&p.lng>=-62.891&&p.lng<=-62.779)
   cache.set(key,mapped);setOnline(mapped)
  }catch{setError('Recherche en ligne indisponible. Réessayez.');setOnline([])}
  finally{setLoading(false)}
 }
 const select=(p:Place)=>{onChange(p);setOpen(false);setQuery('');setOnline([]);setSearched(false);setError('')}
 return <div className="picker"><label>{label}</label>
  <button className="place-input" onClick={()=>setOpen(!open)}><span className={`place-dot ${type}`}>{type==='from'?<Navigation/>:<MapPin/>}</span><span><b>{value?.name||'Choisir un lieu'}</b><small>{value?.description||'Rechercher partout à Saint-Barth'}</small></span><span className="edit">Modifier</span></button>
  {open&&<div className="dropdown">
   <form onSubmit={e=>{e.preventDefault();searchOnline()}} style={{display:'flex',gap:8}}><input autoFocus placeholder="Villa, adresse, rue, resto, hôtel…" value={query} onChange={e=>{setQuery(e.target.value);setOnline([]);setSearched(false);setError('')}}/><button type="submit" aria-label="Rechercher"><Search/></button></form>
   {query&&local.length>0&&<small style={{padding:'8px 12px',display:'block'}}>Lieux SBH enregistrés</small>}
   {results.map(p=><button key={p.id} onClick={()=>select(p)}><MapPin/><span><b>{p.name}</b><small>{p.category} · {p.description}</small></span></button>)}
   {loading&&<small style={{padding:12,display:'block'}}>Recherche des adresses et lieux de Saint-Barth…</small>}
   {!loading&&query.length>=2&&!searched&&<button onClick={searchOnline}><Search/><span><b>Rechercher “{query}” partout à Saint-Barth</b><small>Adresses · rues · quartiers · villas · hôtels · restaurants · commerces</small></span></button>}
   {!loading&&searched&&online.length===0&&!error&&<small style={{padding:12,display:'block'}}>Aucun lieu public correspondant trouvé. Ajoute-le dans SBH Places s’il s’agit d’une villa privée.</small>}
   {error&&<small style={{padding:12,display:'block'}}>{error}</small>}
   <small style={{padding:'8px 12px 12px',display:'block',opacity:.65}}>Recherche cartographique © OpenStreetMap contributors</small>
  </div>}
 </div>
}

import { MapPin, Navigation, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Place, PlaceCategory } from '../types'

type OSMResult = {
  place_id: number
  display_name: string
  name?: string
  lat: string
  lon: string
  type?: string
  class?: string
}

const cache = new Map<string, Place[]>()

function categoryFor(result: OSMResult): PlaceCategory {
  const type = (result.type || '').toLowerCase()
  const cls = (result.class || '').toLowerCase()
  if (type.includes('hotel') || type.includes('guest_house') || type.includes('resort')) return 'Hôtel'
  if (type.includes('restaurant') || type.includes('cafe') || type.includes('bar') || cls === 'amenity') return 'Restaurant'
  if (type.includes('beach')) return 'Plage'
  if (type.includes('house') || type.includes('villa') || type.includes('residential')) return 'Villa'
  if (['suburb','neighbourhood','quarter','hamlet','village','road','street'].some(x => type.includes(x))) return 'Quartier'
  return 'Lieu important'
}

function shortDescription(displayName: string, name: string) {
  const parts = displayName.split(',').map(x => x.trim()).filter(Boolean)
  return parts.filter(x => x.toLowerCase() !== name.toLowerCase()).slice(0, 3).join(' · ') || 'Saint-Barthélemy'
}

export default function PlacePicker({label,value,places,onChange,type}:{label:string;value?:Place;places:Place[];onChange:(p:Place)=>void;type:'from'|'to'}) {
  const [open,setOpen]=useState(false)
  const [query,setQuery]=useState('')
  const [online,setOnline]=useState<Place[]>([])
  const [loading,setLoading]=useState(false)
  const [searched,setSearched]=useState(false)
  const [error,setError]=useState('')

  const local=useMemo(() => places
    .filter(p => (p.name+p.description+p.category).toLowerCase().includes(query.toLowerCase()))
    .slice(0,6), [places,query])

  const results=useMemo(() => {
    const seen = new Set<string>()
    return [...local,...online].filter(p => {
      const key = `${p.name.toLowerCase()}|${p.lat.toFixed(5)}|${p.lng.toFixed(5)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0,10)
  }, [local,online])

  const searchOnline=async () => {
    const q=query.trim()
    if (q.length < 2) return
    setError('')
    setSearched(true)
    const key=q.toLowerCase()
    if (cache.has(key)) { setOnline(cache.get(key)!); return }
    setLoading(true)
    try {
      // Public Nominatim does not allow client-side autocomplete, so online
      // lookup only runs when the user explicitly submits a search.
      const params=new URLSearchParams({
        q:`${q}, Saint-Barthélemy`,
        format:'jsonv2',
        addressdetails:'1',
        namedetails:'1',
        limit:'10',
        countrycodes:'bl',
        viewbox:'-62.89,17.87,-62.78,17.99',
        bounded:'1'
      })
      const response=await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers:{'Accept':'application/json','Accept-Language':'fr'}
      })
      if(!response.ok) throw new Error('search failed')
      const data:OSMResult[]=await response.json()
      const mapped=data.map(r => {
        const name=(r.name || r.display_name.split(',')[0] || q).trim()
        return {
          id:`osm-${r.place_id}`,
          name,
          description:shortDescription(r.display_name,name),
          lat:Number(r.lat),
          lng:Number(r.lon),
          category:categoryFor(r)
        } satisfies Place
      })
      cache.set(key,mapped)
      setOnline(mapped)
    } catch {
      setError('Recherche en ligne indisponible. Réessayez.')
      setOnline([])
    } finally {
      setLoading(false)
    }
  }

  const select=(p:Place) => { onChange(p); setOpen(false); setQuery(''); setOnline([]); setSearched(false); setError('') }

  return <div className="picker">
    <label>{label}</label>
    <button className="place-input" onClick={()=>setOpen(!open)}>
      <span className={`place-dot ${type}`}>{type==='from'?<Navigation/>:<MapPin/>}</span>
      <span><b>{value?.name||'Choisir un lieu'}</b><small>{value?.description||'Rechercher à Saint-Barth'}</small></span>
      <span className="edit">Modifier</span>
    </button>
    {open&&<div className="dropdown">
      <form onSubmit={e=>{e.preventDefault();searchOnline()}} style={{display:'flex',gap:8}}>
        <input autoFocus placeholder="Villa, rue, quartier, hôtel…" value={query} onChange={e=>{setQuery(e.target.value);setOnline([]);setSearched(false);setError('')}}/>
        <button type="submit" aria-label="Rechercher sur la carte" title="Rechercher sur la carte"><Search/></button>
      </form>
      {query && local.length>0 && <small style={{padding:'8px 12px',display:'block'}}>Lieux SBH</small>}
      {results.map(p=><button key={p.id} onClick={()=>select(p)}><MapPin/><span><b>{p.name}</b><small>{p.category} · {p.description}</small></span></button>)}
      {loading&&<small style={{padding:'12px',display:'block'}}>Recherche dans Saint-Barth…</small>}
      {!loading&&query.length>=2&&!searched&&<button onClick={searchOnline}><Search/><span><b>Rechercher “{query}” dans Saint-Barth</b><small>Rues, quartiers, villas et lieux OpenStreetMap</small></span></button>}
      {!loading&&searched&&results.length===0&&!error&&<small style={{padding:'12px',display:'block'}}>Aucun résultat trouvé à Saint-Barth.</small>}
      {error&&<small style={{padding:'12px',display:'block'}}>{error}</small>}
    </div>}
  </div>
}

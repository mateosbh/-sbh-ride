import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import type { Place } from '../types'

const SBH_BOUNDS=L.latLngBounds([17.873,-62.891],[17.974,-62.779])
const pin=(color:string,label:string,active=false)=>L.divIcon({className:`custom-pin${active?' active':''}`,html:`<span style="background:${color}"><b>${label}</b></span>`,iconSize:[48,56],iconAnchor:[24,50]})
const pickupIcon=pin('#102a43','A'),pickupActiveIcon=pin('#168bf2','A',true),destinationIcon=pin('#e59652','B'),destinationActiveIcon=pin('#ff6b35','B',true),carIcon=L.divIcon({className:'car-pin',html:'🚙',iconSize:[36,36],iconAnchor:[18,18]})
const inside=(lat:number,lng:number)=>SBH_BOUNDS.contains([lat,lng])

function Recenter({points,route,disabled}:{points:Place[];route:[number,number][];disabled:boolean}){const map=useMap();useEffect(()=>{if(disabled)return;const pts=route.length?route:points.map(p=>[p.lat,p.lng] as [number,number]);if(pts.length>1)map.fitBounds(L.latLngBounds(pts),{padding:[55,55],maxZoom:16});else if(pts[0])map.flyTo(pts[0],16)},[map,points,route,disabled]);return null}
function IslandGuard(){const map=useMap();useEffect(()=>{map.setMaxBounds(SBH_BOUNDS);map.setMinZoom(13);const keep=()=>{if(!SBH_BOUNDS.contains(map.getCenter()))map.panInsideBounds(SBH_BOUNDS,{animate:false})};map.on('drag',keep);map.on('moveend',keep);return()=>{map.off('drag',keep);map.off('moveend',keep)}},[map]);return null}
async function snapToRoad(lat:number,lng:number){
 if(!inside(lat,lng))return null
 try{
  const r=await fetch(`https://router.project-osrm.org/nearest/v1/driving/${lng},${lat}?number=1`)
  const d=await r.json(),w=d?.waypoints?.[0]
  if(!w?.location||typeof w.distance!=='number'||w.distance>60)return null
  const [roadLng,roadLat]=w.location
  if(!inside(roadLat,roadLng))return null
  // Reject clicks in the sea: the selected point itself must already be very close to a routable road.
  return {lat:roadLat,lng:roadLng}
 }catch{return null}
}
function Clicker({onMove}:{onMove?:(lat:number,lng:number)=>void}){useMapEvents({click:async e=>{const p=await snapToRoad(e.latlng.lat,e.latlng.lng);if(p)onMove?.(p.lat,p.lng)}});return null}

export default function MapView({pickup,destination,driverProgress,onMovePickup,onMoveDestination,onRouteInfo,userLocation,compact=false}:{pickup?:Place;destination?:Place;driverProgress?:number;onMovePickup?:(lat:number,lng:number)=>void;onMoveDestination?:(lat:number,lng:number)=>void;onRouteInfo?:(info:{km:number;min:number}|null)=>void;userLocation?:{lat:number;lng:number};compact?:boolean}){
 const points=useMemo(()=>[pickup,destination].filter(Boolean) as Place[],[pickup,destination])
 const[route,setRoute]=useState<[number,number][]>([]),[routeInfo,setRouteInfo]=useState<{km:number;min:number}|null>(null),[routing,setRouting]=useState(false),[activePoint,setActivePoint]=useState<'A'|'B'>('A'),[draggingPoint,setDraggingPoint]=useState<'A'|'B'|null>(null),[manualMapLock,setManualMapLock]=useState(false),[mapStyle,setMapStyle]=useState<'satellite'|'plan'>(()=>(localStorage.getItem('sbh-map-style') as 'satellite'|'plan')||'satellite')
 const switchMap=()=>setMapStyle(v=>{const next=v==='satellite'?'plan':'satellite';localStorage.setItem('sbh-map-style',next);return next})
 useEffect(()=>{setManualMapLock(false)},[pickup?.id,destination?.id])
 useEffect(()=>{setRoute([]);setRouteInfo(null);onRouteInfo?.(null);if(!pickup||!destination||!inside(pickup.lat,pickup.lng)||!inside(destination.lat,destination.lng))return;const controller=new AbortController();setRouting(true);const url=`https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true&alternatives=false&continue_straight=default&annotations=false`;fetch(url,{signal:controller.signal}).then(r=>r.json()).then(data=>{const r=data?.routes?.[0];if(!r?.geometry?.coordinates)return;const pts=(r.geometry.coordinates as [number,number][]).map(([lng,lat])=>[lat,lng] as [number,number]);if(pts.length>1&&pts.every(([lat,lng])=>inside(lat,lng))){setRoute(pts);const info={km:r.distance/1000,min:r.duration/60};setRouteInfo(info);onRouteInfo?.(info)}}).catch(()=>{}).finally(()=>setRouting(false));return()=>controller.abort()},[pickup?.lat,pickup?.lng,destination?.lat,destination?.lng])
 const car=route.length&&driverProgress!==undefined?route[Math.min(route.length-1,Math.floor(driverProgress*(route.length-1)))]:undefined
 return <div className={`map ${compact?'compact':''} ${draggingPoint?'marker-dragging':''}`}>
  <MapContainer center={[17.905,-62.835]} zoom={13} minZoom={13} maxZoom={17} maxBounds={SBH_BOUNDS} maxBoundsViscosity={1} inertia={false} worldCopyJump={false} zoomControl={false} attributionControl={false}>
   {mapStyle==='satellite'?<TileLayer attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxNativeZoom={17} maxZoom={17}/>:<TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxNativeZoom={17} maxZoom={17}/>}
   <IslandGuard/><Recenter points={points} route={route} disabled={manualMapLock}/><Clicker onMove={activePoint==='A'?onMovePickup:onMoveDestination}/>
   {pickup&&inside(pickup.lat,pickup.lng)&&<Marker position={[pickup.lat,pickup.lng]} icon={activePoint==='A'?pickupActiveIcon:pickupIcon} draggable={!!onMovePickup} eventHandlers={{click:()=>setActivePoint('A'),dragstart:()=>{setActivePoint('A');setDraggingPoint('A');setManualMapLock(true)},dragend:async e=>{const p=e.target.getLatLng();const road=await snapToRoad(p.lat,p.lng);if(road){e.target.setLatLng([road.lat,road.lng]);onMovePickup?.(road.lat,road.lng)}else if(inside(p.lat,p.lng)){onMovePickup?.(p.lat,p.lng)}else e.target.setLatLng([pickup.lat,pickup.lng]);setDraggingPoint(null)}}}><Tooltip>{pickup.name}</Tooltip></Marker>}
   {destination&&inside(destination.lat,destination.lng)&&<Marker position={[destination.lat,destination.lng]} icon={activePoint==='B'?destinationActiveIcon:destinationIcon} draggable={!!onMoveDestination} eventHandlers={{click:()=>setActivePoint('B'),dragstart:()=>{setActivePoint('B');setDraggingPoint('B');setManualMapLock(true)},dragend:async e=>{const p=e.target.getLatLng();const road=await snapToRoad(p.lat,p.lng);if(road){e.target.setLatLng([road.lat,road.lng]);onMoveDestination?.(road.lat,road.lng)}else if(inside(p.lat,p.lng)){onMoveDestination?.(p.lat,p.lng)}else e.target.setLatLng([destination.lat,destination.lng]);setDraggingPoint(null)}}}><Tooltip>{destination.name}</Tooltip></Marker>}
   {pickup&&destination&&route.length>1&&<Polyline positions={route} pathOptions={{color:'#173f5f',weight:5}}/>}
   {userLocation&&inside(userLocation.lat,userLocation.lng)&&<Marker position={[userLocation.lat,userLocation.lng]} icon={L.divIcon({className:'geo-pin',html:'<span></span>',iconSize:[22,22],iconAnchor:[11,11]})}><Tooltip>Votre position</Tooltip></Marker>}{car&&<Marker position={car} icon={carIcon}/>}
  </MapContainer>
  <button type="button" onClick={switchMap} aria-label="Changer le type de carte" style={{position:'absolute',right:14,top:14,zIndex:1000,border:0,borderRadius:12,padding:'10px 12px',background:'rgba(255,255,255,.95)',boxShadow:'0 2px 10px rgba(0,0,0,.22)',fontWeight:700,color:'#173f5f'}}>{mapStyle==='satellite'?'Plan':'Satellite'}</button>
  <div className="map-credit">{mapStyle==='satellite'?'Satellite · Esri World Imagery':'Plan · OpenStreetMap'}{routing?' · Calcul de la route…':routeInfo?` · ${routeInfo.km.toFixed(1)} km · ${Math.round(routeInfo.min)} min`:pickup&&destination?' · Route indisponible':''}</div>
  {(onMovePickup||onMoveDestination)&&<div className={`map-hint ${draggingPoint?'dragging':''}`}>{draggingPoint?<>Point {draggingPoint} · glissez puis relâchez pour le placer sur la route</>:<>Point actif : {activePoint} · maintenez A ou B puis faites-le glisser</>}</div>}
 </div>
}

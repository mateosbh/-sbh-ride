import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import type { Place } from '../types'

const SBH_BOUNDS=L.latLngBounds([17.873,-62.891],[17.974,-62.779])
const pin=(color:string,label:string)=>L.divIcon({className:'custom-pin',html:`<span style="background:${color}">${label}</span>`,iconSize:[34,42],iconAnchor:[17,38]})
const pickupIcon=pin('#102a43','A'),pickupActiveIcon=pin('#168bf2','A'),destinationIcon=pin('#e59652','B'),destinationActiveIcon=pin('#ff6b35','B'),carIcon=L.divIcon({className:'car-pin',html:'🚙',iconSize:[36,36],iconAnchor:[18,18]})
const inside=(lat:number,lng:number)=>SBH_BOUNDS.contains([lat,lng])

function Recenter({points,route}:{points:Place[];route:[number,number][]}){const map=useMap();useEffect(()=>{const pts=route.length?route:points.map(p=>[p.lat,p.lng] as [number,number]);if(pts.length>1)map.fitBounds(L.latLngBounds(pts),{padding:[55,55],maxZoom:16});else if(pts[0])map.flyTo(pts[0],16)},[map,points,route]);return null}
function IslandGuard(){const map=useMap();useEffect(()=>{map.setMaxBounds(SBH_BOUNDS);map.setMinZoom(13);const keep=()=>{if(!SBH_BOUNDS.contains(map.getCenter()))map.panInsideBounds(SBH_BOUNDS,{animate:false})};map.on('drag',keep);map.on('moveend',keep);return()=>{map.off('drag',keep);map.off('moveend',keep)}},[map]);return null}
async function snapToRoad(lat:number,lng:number){
 if(!inside(lat,lng))return null
 try{
  const r=await fetch(`https://router.project-osrm.org/nearest/v1/driving/${lng},${lat}?number=1`)
  const d=await r.json(),w=d?.waypoints?.[0]
  if(!w?.location||typeof w.distance!=='number'||w.distance>18)return null
  const [roadLng,roadLat]=w.location
  if(!inside(roadLat,roadLng))return null
  // Reject clicks in the sea: the selected point itself must already be very close to a routable road.
  return {lat:roadLat,lng:roadLng}
 }catch{return null}
}
function Clicker({onMove}:{onMove?:(lat:number,lng:number)=>void}){useMapEvents({click:async e=>{const p=await snapToRoad(e.latlng.lat,e.latlng.lng);if(p)onMove?.(p.lat,p.lng)}});return null}

export default function MapView({pickup,destination,driverProgress,onMovePickup,onMoveDestination,userLocation,compact=false}:{pickup?:Place;destination?:Place;driverProgress?:number;onMovePickup?:(lat:number,lng:number)=>void;onMoveDestination?:(lat:number,lng:number)=>void;userLocation?:{lat:number;lng:number};compact?:boolean}){
 const points=useMemo(()=>[pickup,destination].filter(Boolean) as Place[],[pickup,destination])
 const[route,setRoute]=useState<[number,number][]>([]),[routeInfo,setRouteInfo]=useState<{km:number;min:number}|null>(null),[routing,setRouting]=useState(false),[activePoint,setActivePoint]=useState<'A'|'B'>('A')
 useEffect(()=>{setRoute([]);setRouteInfo(null);if(!pickup||!destination||!inside(pickup.lat,pickup.lng)||!inside(destination.lat,destination.lng))return;const controller=new AbortController();setRouting(true);const url=`https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true&alternatives=false&continue_straight=default&annotations=false`;fetch(url,{signal:controller.signal}).then(r=>r.json()).then(data=>{const r=data?.routes?.[0];if(!r?.geometry?.coordinates)return;const pts=(r.geometry.coordinates as [number,number][]).map(([lng,lat])=>[lat,lng] as [number,number]);if(pts.length>1&&pts.every(([lat,lng])=>inside(lat,lng))){setRoute(pts);setRouteInfo({km:r.distance/1000,min:r.duration/60})}}).catch(()=>{}).finally(()=>setRouting(false));return()=>controller.abort()},[pickup?.lat,pickup?.lng,destination?.lat,destination?.lng])
 const car=route.length&&driverProgress!==undefined?route[Math.min(route.length-1,Math.floor(driverProgress*(route.length-1)))]:undefined
 return <div className={`map ${compact?'compact':''}`}>
  <MapContainer center={[17.905,-62.835]} zoom={13} minZoom={13} maxZoom={19} maxBounds={SBH_BOUNDS} maxBoundsViscosity={1} inertia={false} worldCopyJump={false} zoomControl={false} attributionControl={false}>
   <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
   <IslandGuard/><Recenter points={points} route={route}/><Clicker onMove={activePoint==='A'?onMovePickup:onMoveDestination}/>
   {pickup&&inside(pickup.lat,pickup.lng)&&<Marker position={[pickup.lat,pickup.lng]} icon={activePoint==='A'?pickupActiveIcon:pickupIcon} draggable={!!onMovePickup} eventHandlers={{click:()=>setActivePoint('A'),dragstart:()=>setActivePoint('A'),dragend:async e=>{const p=e.target.getLatLng();const road=await snapToRoad(p.lat,p.lng);if(road){e.target.setLatLng([road.lat,road.lng]);onMovePickup?.(road.lat,road.lng)}else e.target.setLatLng([pickup.lat,pickup.lng])}}}><Tooltip>{pickup.name}</Tooltip></Marker>}
   {destination&&inside(destination.lat,destination.lng)&&<Marker position={[destination.lat,destination.lng]} icon={activePoint==='B'?destinationActiveIcon:destinationIcon} draggable={!!onMoveDestination} eventHandlers={{click:()=>setActivePoint('B'),dragstart:()=>setActivePoint('B'),dragend:async e=>{const p=e.target.getLatLng();const road=await snapToRoad(p.lat,p.lng);if(road){e.target.setLatLng([road.lat,road.lng]);onMoveDestination?.(road.lat,road.lng)}else e.target.setLatLng([destination.lat,destination.lng])}}}><Tooltip>{destination.name}</Tooltip></Marker>}
   {pickup&&destination&&route.length>1&&<Polyline positions={route} pathOptions={{color:'#173f5f',weight:5}}/>}
   {userLocation&&inside(userLocation.lat,userLocation.lng)&&<Marker position={[userLocation.lat,userLocation.lng]} icon={L.divIcon({className:'geo-pin',html:'<span></span>',iconSize:[22,22],iconAnchor:[11,11]})}><Tooltip>Votre position</Tooltip></Marker>}{car&&<Marker position={car} icon={carIcon}/>}
  </MapContainer>
  <div className="map-credit">OpenStreetMap{routing?' · Calcul de la route…':routeInfo?` · ${routeInfo.km.toFixed(1)} km · ${Math.round(routeInfo.min)} min`:pickup&&destination?' · Route indisponible':''}</div>
  {(onMovePickup||onMoveDestination)&&<div className="map-hint">Point actif : {activePoint} · touchez A ou B puis déplacez-le sur une route</div>}
 </div>
}

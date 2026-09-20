import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import type { Place } from '../types'

const SBH_BOUNDS=L.latLngBounds([17.87,-62.89],[17.99,-62.78])
const pin=(color:string,label:string)=>L.divIcon({className:'custom-pin',html:`<span style="background:${color}">${label}</span>`,iconSize:[34,42],iconAnchor:[17,38]})
const pickupIcon=pin('#102a43','A'),destinationIcon=pin('#e59652','B'),carIcon=L.divIcon({className:'car-pin',html:'🚙',iconSize:[36,36],iconAnchor:[18,18]})
const inside=(lat:number,lng:number)=>SBH_BOUNDS.contains([lat,lng])
function Recenter({points,route}:{points:Place[];route:[number,number][]}){const map=useMap();useEffect(()=>{const pts=route.length?route:points.map(p=>[p.lat,p.lng] as [number,number]);if(pts.length>1)map.fitBounds(L.latLngBounds(pts),{padding:[55,55],maxZoom:15});else if(pts[0])map.flyTo(pts[0],15)},[map,points,route]);return null}
function Clicker({onMove}:{onMove?:(lat:number,lng:number)=>void}){useMapEvents({click:e=>{if(inside(e.latlng.lat,e.latlng.lng))onMove?.(e.latlng.lat,e.latlng.lng)}});return null}

export default function MapView({pickup,destination,driverProgress,onMovePickup,compact=false}:{pickup?:Place;destination?:Place;driverProgress?:number;onMovePickup?:(lat:number,lng:number)=>void;compact?:boolean}){
 const points=useMemo(()=>[pickup,destination].filter(Boolean) as Place[],[pickup,destination])
 const[route,setRoute]=useState<[number,number][]>([]),[routeInfo,setRouteInfo]=useState<{km:number;min:number}|null>(null)
 useEffect(()=>{if(!pickup||!destination){setRoute([]);setRouteInfo(null);return}const controller=new AbortController();const url=`https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=false`;fetch(url,{signal:controller.signal}).then(r=>r.json()).then(data=>{const r=data?.routes?.[0];if(!r?.geometry?.coordinates)return;const pts=(r.geometry.coordinates as [number,number][]).map(([lng,lat])=>[lat,lng] as [number,number]).filter(([lat,lng])=>inside(lat,lng));if(pts.length>1){setRoute(pts);setRouteInfo({km:r.distance/1000,min:r.duration/60})}}).catch(()=>{});return()=>controller.abort()},[pickup?.lat,pickup?.lng,destination?.lat,destination?.lng])
 const car=route.length&&driverProgress!==undefined?route[Math.min(route.length-1,Math.floor(driverProgress*(route.length-1)))]:undefined
 return <div className={`map ${compact?'compact':''}`}>
  <MapContainer center={[17.9,-62.835]} zoom={13} minZoom={12} maxBounds={SBH_BOUNDS.pad(.08)} maxBoundsViscosity={1} zoomControl={false} attributionControl={false}>
   <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
   <Recenter points={points} route={route}/><Clicker onMove={onMovePickup}/>
   {pickup&&<Marker position={[pickup.lat,pickup.lng]} icon={pickupIcon} draggable={!!onMovePickup} eventHandlers={{dragend:e=>{const p=e.target.getLatLng();if(inside(p.lat,p.lng))onMovePickup?.(p.lat,p.lng)}}}><Tooltip>{pickup.name}</Tooltip></Marker>}
   {destination&&<Marker position={[destination.lat,destination.lng]} icon={destinationIcon}><Tooltip>{destination.name}</Tooltip></Marker>}
   {pickup&&destination&&<Polyline positions={route.length?route:[[pickup.lat,pickup.lng],[destination.lat,destination.lng]]} pathOptions={{color:'#173f5f',weight:5,dashArray:route.length?undefined:'7 9'}}/>}
   {car&&<Marker position={car} icon={carIcon}/>}
  </MapContainer>
  <div className="map-credit">OpenStreetMap{routeInfo?` · Route ${routeInfo.km.toFixed(1)} km · ${Math.round(routeInfo.min)} min`:''}</div>
  {onMovePickup&&<div className="map-hint">Déplacez A uniquement sur Saint-Barth</div>}
 </div>
}

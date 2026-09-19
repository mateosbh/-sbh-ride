import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import type { Place } from '../types'

const pin = (color:string, label:string) => L.divIcon({className:'custom-pin',html:`<span style="background:${color}">${label}</span>`,iconSize:[34,42],iconAnchor:[17,38]})
const pickupIcon=pin('#102a43','A'), destinationIcon=pin('#e59652','B'), carIcon=L.divIcon({className:'car-pin',html:'🚙',iconSize:[36,36],iconAnchor:[18,18]})
function Recenter({points}:{points:Place[]}) { const map=useMap(); useEffect(()=>{ if(points.length>1) map.fitBounds(L.latLngBounds(points.map(p=>[p.lat,p.lng])),{padding:[55,55],maxZoom:14}); else if(points[0]) map.flyTo([points[0].lat,points[0].lng],14) },[map,points]); return null }
function Clicker({onMove}:{onMove?:(lat:number,lng:number)=>void}) { useMapEvents({click:e=>onMove?.(e.latlng.lat,e.latlng.lng)}); return null }
export default function MapView({pickup,destination,driverProgress,onMovePickup,compact=false}:{pickup?:Place;destination?:Place;driverProgress?:number;onMovePickup?:(lat:number,lng:number)=>void;compact?:boolean}) {
 const points=[pickup,destination].filter(Boolean) as Place[]
 const car=pickup&&destination&&driverProgress!==undefined?{lat:pickup.lat+(destination.lat-pickup.lat)*driverProgress,lng:pickup.lng+(destination.lng-pickup.lng)*driverProgress}:undefined
 return <div className={`map ${compact?'compact':''}`}>
  <MapContainer center={[17.9,-62.835]} zoom={13} zoomControl={false} attributionControl={false}>
   <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
   <Recenter points={points}/><Clicker onMove={onMovePickup}/>
   {pickup&&<Marker position={[pickup.lat,pickup.lng]} icon={pickupIcon} draggable={!!onMovePickup} eventHandlers={{dragend:e=>{const p=e.target.getLatLng();onMovePickup?.(p.lat,p.lng)}}}><Tooltip>{pickup.name}</Tooltip></Marker>}
   {destination&&<Marker position={[destination.lat,destination.lng]} icon={destinationIcon}><Tooltip>{destination.name}</Tooltip></Marker>}
   {pickup&&destination&&<Polyline positions={[[pickup.lat,pickup.lng],[destination.lat,destination.lng]]} pathOptions={{color:'#173f5f',weight:4,dashArray:'7 9'}}/>}
   {car&&<Marker position={[car.lat,car.lng]} icon={carIcon}/>} 
  </MapContainer>
  <div className="map-credit">OpenStreetMap</div>{onMovePickup&&<div className="map-hint">Touchez la carte pour déplacer le départ</div>}
 </div>
}

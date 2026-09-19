export type PlaceCategory = 'Quartier' | 'Plage' | 'Hôtel' | 'Restaurant' | 'Lieu important' | 'Villa'
export interface Place { id:string; name:string; description:string; lat:number; lng:number; category:PlaceCategory }
export type RideStatus = 'idle'|'searching'|'accepted'|'arriving'|'arrived'|'onboard'|'completed'
export interface Driver { id:string; name:string; vehicle:string; plate:string; status:'Disponible'|'Occupé'|'Hors ligne'; suspended:boolean; rating:number }
export interface Ride { id:string; pickup:Place; destination:Place; status:RideStatus; driverId?:string; price:number; date:string }

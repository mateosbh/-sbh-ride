import type { Driver, Place, Ride } from './types'
export const initialPlaces: Place[] = [
 {id:'airport',name:'Aéroport Rémy de Haenen',description:'Saint-Jean — terminal principal',lat:17.9044,lng:-62.8439,category:'Lieu important'},
 {id:'gustavia',name:'Gustavia',description:'Port et centre-ville',lat:17.8962,lng:-62.8498,category:'Quartier'},
 {id:'stjean',name:'Plage de Saint-Jean',description:'Baie de Saint-Jean',lat:17.9023,lng:-62.8376,category:'Plage'},
 {id:'saline',name:'Plage de Saline',description:'Anse de Grande Saline',lat:17.8846,lng:-62.8234,category:'Plage'},
 {id:'colombier',name:'Plage de Colombier',description:'Anse de Colombier',lat:17.9265,lng:-62.8697,category:'Plage'},
 {id:'eden',name:'Eden Rock',description:'Hôtel, Baie de Saint-Jean',lat:17.9032,lng:-62.8352,category:'Hôtel'},
 {id:'manapany',name:'Hôtel Manapany',description:'Anse des Cayes — hôtel',lat:17.9107,lng:-62.8521,category:'Hôtel'},
 {id:'cheval',name:'Cheval Blanc',description:'Hôtel, Baie des Flamands',lat:17.9182,lng:-62.8582,category:'Hôtel'},
 {id:'bonito',name:'Bonito Saint Barth',description:'Restaurant, Gustavia',lat:17.8953,lng:-62.8504,category:'Restaurant'},
 {id:'tamarin',name:'Tamarin',description:'Restaurant, Grande Saline',lat:17.8905,lng:-62.8247,category:'Restaurant'},
 {id:'lorient',name:'Lorient',description:'Village et plage',lat:17.9066,lng:-62.8196,category:'Quartier'},
 {id:'villa',name:'Villa Palm Springs',description:'Pointe Milou — villa privée',lat:17.9182,lng:-62.8075,category:'Villa'}
]
export const initialDrivers: Driver[] = [
 {id:'d1',name:'Thomas',vehicle:'Mercedes Classe V noire',plate:'SBH 971',status:'Disponible',suspended:false,rating:4.9},
 {id:'d2',name:'Léo',vehicle:'Range Rover blanc',plate:'SBH 214',status:'Occupé',suspended:false,rating:4.8},
 {id:'d3',name:'Marie',vehicle:'BMW iX bleue',plate:'SBH 508',status:'Hors ligne',suspended:false,rating:5.0},
 {id:'d4',name:'Alex',vehicle:'Audi Q7 noir',plate:'SBH 733',status:'Hors ligne',suspended:true,rating:4.7}
]
export const history: Ride[] = [
 {id:'SBH-1038',pickup:initialPlaces[0],destination:initialPlaces[1],status:'completed',driverId:'d2',price:24,date:'18 sept. · 19:42'},
 {id:'SBH-1037',pickup:initialPlaces[2],destination:initialPlaces[6],status:'completed',driverId:'d1',price:31,date:'18 sept. · 17:10'},
 {id:'SBH-1036',pickup:initialPlaces[1],destination:initialPlaces[8],status:'completed',driverId:'d3',price:28,date:'17 sept. · 21:05'}
]

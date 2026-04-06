'use client'

import dynamic from 'next/dynamic'
import WeatherWidget from '../widgets/WeatherWidget'
import MusicWidget from '../widgets/MusicWidget'
import CabinWidget from '../widgets/CabinWidget'
import SportsWidget from '../widgets/SportsWidget'
import StocksWidget from '../widgets/StocksWidget'
import DeparturesWidget from '../widgets/DeparturesWidget'
import EventsWidget from '../widgets/EventsWidget'

const MapWidget = dynamic(() => import('../widgets/MapWidget'), { ssr: false })

export default function Dashboard() {
  return (
    <main className="dashboard">
      <div className="bento-grid">
        <div className="bento-map"><MapWidget /></div>
        <div className="bento-weather"><WeatherWidget /></div>
        <div className="bento-music"><MusicWidget /></div>
        <div className="bento-cabin"><CabinWidget /></div>
        <div className="bento-sports"><SportsWidget /></div>
        <div className="bento-depart"><DeparturesWidget /></div>
        <div className="bento-stocks"><StocksWidget /></div>
        <div className="bento-events"><EventsWidget /></div>
      </div>
    </main>
  )
}

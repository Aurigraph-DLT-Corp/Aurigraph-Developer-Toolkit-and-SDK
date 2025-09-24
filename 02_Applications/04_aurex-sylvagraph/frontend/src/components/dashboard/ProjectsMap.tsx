import React from 'react'
import { MapPin } from 'lucide-react'

export function ProjectsMap() {
  return (
    <div className="h-80 bg-forest-50 dark:bg-forest-800 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <MapPin className="h-12 w-12 text-forest-400 mx-auto mb-4" />
        <p className="text-forest-600 dark:text-forest-400">Interactive map will be displayed here</p>
        <p className="text-sm text-forest-500 dark:text-forest-500">Leaflet/OpenStreetMap integration</p>
      </div>
    </div>
  )
}
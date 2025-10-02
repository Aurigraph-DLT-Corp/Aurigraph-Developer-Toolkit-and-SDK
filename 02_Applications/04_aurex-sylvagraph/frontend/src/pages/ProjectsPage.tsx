import React from 'react'
import { Plus, Search, Filter, TreePine } from 'lucide-react'

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-forest-900 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-forest-900 dark:text-forest-100">Projects</h1>
            <p className="text-forest-600 dark:text-forest-400 mt-2">Manage your agroforestry projects</p>
          </div>
          <button className="bg-forest-600 hover:bg-forest-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-4 mt-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-forest-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search projects..."
              className="pl-10 pr-4 py-2 bg-forest-50/50 dark:bg-forest-800/50 border border-forest-200 dark:border-forest-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 w-full"
            />
          </div>
          <button className="p-2 border border-forest-200 dark:border-forest-700 rounded-lg hover:bg-forest-50 dark:hover:bg-forest-800">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="bg-white dark:bg-forest-900 rounded-lg p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <TreePine className="h-8 w-8 text-forest-600" />
              <div>
                <h3 className="font-semibold text-forest-900 dark:text-forest-100">Project {i + 1}</h3>
                <p className="text-sm text-forest-600 dark:text-forest-400">Brazil</p>
              </div>
            </div>
            <p className="text-forest-600 dark:text-forest-400 text-sm mb-4">1,250 hectares • 15,000 trees</p>
            <div className="flex justify-between items-center">
              <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-full">
                Active
              </span>
              <span className="text-forest-900 dark:text-forest-100 font-semibold">2,450 tCO₂e</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
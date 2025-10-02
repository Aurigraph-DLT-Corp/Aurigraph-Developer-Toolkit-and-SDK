import React, { useState, useEffect } from 'react';

interface EmissionData {
  scope1: {
    fuelCombustion: number;
    processEmissions: number;
    fugitiveEmissions: number;
  };
  scope2: {
    electricity: number;
    steam: number;
    heating: number;
    cooling: number;
  };
  scope3: {
    purchasedGoods: number;
    capitalGoods: number;
    fuelEnergyActivities: number;
    upstreamTransportation: number;
    wasteGenerated: number;
    businessTravel: number;
    employeeCommuting: number;
    upstreamLeasedAssets: number;
    downstreamTransportation: number;
    processingProducts: number;
    useOfProducts: number;
    endOfLifeTreatment: number;
    downstreamLeasedAssets: number;
    franchises: number;
    investments: number;
  };
}

interface CalculatorProps {
  onComplete: (data: EmissionData & { totalEmissions: number; readinessScore: number }) => void;
  onClose: () => void;
}

const GHGCalculator: React.FC<CalculatorProps> = ({ onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [emissionData, setEmissionData] = useState<EmissionData>({
    scope1: {
      fuelCombustion: 0,
      processEmissions: 0,
      fugitiveEmissions: 0,
    },
    scope2: {
      electricity: 0,
      steam: 0,
      heating: 0,
      cooling: 0,
    },
    scope3: {
      purchasedGoods: 0,
      capitalGoods: 0,
      fuelEnergyActivities: 0,
      upstreamTransportation: 0,
      wasteGenerated: 0,
      businessTravel: 0,
      employeeCommuting: 0,
      upstreamLeasedAssets: 0,
      downstreamTransportation: 0,
      processingProducts: 0,
      useOfProducts: 0,
      endOfLifeTreatment: 0,
      downstreamLeasedAssets: 0,
      franchises: 0,
      investments: 0,
    },
  });

  const totalSteps = 4;

  const calculateScope1Total = () => {
    const { fuelCombustion, processEmissions, fugitiveEmissions } = emissionData.scope1;
    return fuelCombustion + processEmissions + fugitiveEmissions;
  };

  const calculateScope2Total = () => {
    const { electricity, steam, heating, cooling } = emissionData.scope2;
    return electricity + steam + heating + cooling;
  };

  const calculateScope3Total = () => {
    return Object.values(emissionData.scope3).reduce((sum, value) => sum + value, 0);
  };

  const calculateTotalEmissions = () => {
    return calculateScope1Total() + calculateScope2Total() + calculateScope3Total();
  };

  const calculateReadinessScore = () => {
    let score = 0;
    const scope1Count = Object.values(emissionData.scope1).filter(v => v > 0).length;
    const scope2Count = Object.values(emissionData.scope2).filter(v => v > 0).length;
    const scope3Count = Object.values(emissionData.scope3).filter(v => v > 0).length;
    
    // Scoring based on data completeness
    score += (scope1Count / 3) * 30; // Scope 1 worth 30%
    score += (scope2Count / 4) * 30; // Scope 2 worth 30%
    score += (scope3Count / 15) * 40; // Scope 3 worth 40%
    
    return Math.round(score);
  };

  const handleInputChange = (scope: keyof EmissionData, field: string, value: number) => {
    setEmissionData(prev => ({
      ...prev,
      [scope]: {
        ...prev[scope],
        [field]: value
      }
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const totalEmissions = calculateTotalEmissions();
    const readinessScore = calculateReadinessScore();
    onComplete({
      ...emissionData,
      totalEmissions,
      readinessScore
    });
  };

  const renderScope1Form = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Scope 1: Direct Emissions</h3>
        <p className="text-gray-600">Enter your direct greenhouse gas emissions from owned or controlled sources</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fuel Combustion (tCO2e/year)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={emissionData.scope1.fuelCombustion}
            onChange={(e) => handleInputChange('scope1', 'fuelCombustion', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g., 1250.5"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Process Emissions (tCO2e/year)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={emissionData.scope1.processEmissions}
            onChange={(e) => handleInputChange('scope1', 'processEmissions', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g., 850.2"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fugitive Emissions (tCO2e/year)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={emissionData.scope1.fugitiveEmissions}
            onChange={(e) => handleInputChange('scope1', 'fugitiveEmissions', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g., 125.7"
          />
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <span className="text-blue-600 font-medium">Scope 1 Total:</span>
          <span className="ml-2 text-xl font-bold text-blue-800">{calculateScope1Total().toFixed(2)} tCO2e</span>
        </div>
        <p className="text-sm text-blue-600">Direct emissions from sources you own or control</p>
      </div>
    </div>
  );

  const renderScope2Form = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Scope 2: Indirect Energy Emissions</h3>
        <p className="text-gray-600">Enter emissions from purchased electricity, steam, heating and cooling</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Purchased Electricity (tCO2e/year)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={emissionData.scope2.electricity}
            onChange={(e) => handleInputChange('scope2', 'electricity', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g., 2500.0"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Purchased Steam (tCO2e/year)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={emissionData.scope2.steam}
            onChange={(e) => handleInputChange('scope2', 'steam', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g., 150.5"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Purchased Heating (tCO2e/year)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={emissionData.scope2.heating}
            onChange={(e) => handleInputChange('scope2', 'heating', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g., 75.2"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Purchased Cooling (tCO2e/year)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={emissionData.scope2.cooling}
            onChange={(e) => handleInputChange('scope2', 'cooling', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g., 45.8"
          />
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <span className="text-blue-600 font-medium">Scope 2 Total:</span>
          <span className="ml-2 text-xl font-bold text-blue-800">{calculateScope2Total().toFixed(2)} tCO2e</span>
        </div>
        <p className="text-sm text-blue-600">Indirect emissions from purchased energy</p>
      </div>
    </div>
  );

  const renderScope3Form = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Scope 3: Other Indirect Emissions</h3>
        <p className="text-gray-600">Enter emissions from your value chain activities</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upstream Activities */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-3">📈 Upstream Activities</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Purchased Goods & Services</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={emissionData.scope3.purchasedGoods}
                onChange={(e) => handleInputChange('scope3', 'purchasedGoods', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                placeholder="tCO2e"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Capital Goods</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={emissionData.scope3.capitalGoods}
                onChange={(e) => handleInputChange('scope3', 'capitalGoods', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                placeholder="tCO2e"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fuel & Energy Activities</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={emissionData.scope3.fuelEnergyActivities}
                onChange={(e) => handleInputChange('scope3', 'fuelEnergyActivities', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                placeholder="tCO2e"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Upstream Transportation</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={emissionData.scope3.upstreamTransportation}
                onChange={(e) => handleInputChange('scope3', 'upstreamTransportation', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                placeholder="tCO2e"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Waste Generated</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={emissionData.scope3.wasteGenerated}
                onChange={(e) => handleInputChange('scope3', 'wasteGenerated', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                placeholder="tCO2e"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Business Travel</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={emissionData.scope3.businessTravel}
                onChange={(e) => handleInputChange('scope3', 'businessTravel', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                placeholder="tCO2e"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Employee Commuting</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={emissionData.scope3.employeeCommuting}
                onChange={(e) => handleInputChange('scope3', 'employeeCommuting', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                placeholder="tCO2e"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Upstream Leased Assets</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={emissionData.scope3.upstreamLeasedAssets}
                onChange={(e) => handleInputChange('scope3', 'upstreamLeasedAssets', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                placeholder="tCO2e"
              />
            </div>
          </div>
        </div>

        {/* Downstream Activities */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-3">📉 Downstream Activities</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Downstream Transportation</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={emissionData.scope3.downstreamTransportation}
                onChange={(e) => handleInputChange('scope3', 'downstreamTransportation', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                placeholder="tCO2e"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Processing of Products</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={emissionData.scope3.processingProducts}
                onChange={(e) => handleInputChange('scope3', 'processingProducts', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                placeholder="tCO2e"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Use of Sold Products</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={emissionData.scope3.useOfProducts}
                onChange={(e) => handleInputChange('scope3', 'useOfProducts', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                placeholder="tCO2e"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End-of-Life Treatment</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={emissionData.scope3.endOfLifeTreatment}
                onChange={(e) => handleInputChange('scope3', 'endOfLifeTreatment', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                placeholder="tCO2e"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Downstream Leased Assets</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={emissionData.scope3.downstreamLeasedAssets}
                onChange={(e) => handleInputChange('scope3', 'downstreamLeasedAssets', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                placeholder="tCO2e"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Franchises</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={emissionData.scope3.franchises}
                onChange={(e) => handleInputChange('scope3', 'franchises', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                placeholder="tCO2e"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Investments</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={emissionData.scope3.investments}
                onChange={(e) => handleInputChange('scope3', 'investments', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                placeholder="tCO2e"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <span className="text-purple-600 font-medium">Scope 3 Total:</span>
          <span className="ml-2 text-xl font-bold text-purple-800">{calculateScope3Total().toFixed(2)} tCO2e</span>
        </div>
        <p className="text-sm text-purple-600">All other indirect emissions from your value chain</p>
      </div>
    </div>
  );

  const renderSummary = () => {
    const scope1Total = calculateScope1Total();
    const scope2Total = calculateScope2Total();
    const scope3Total = calculateScope3Total();
    const totalEmissions = calculateTotalEmissions();
    const readinessScore = calculateReadinessScore();

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Assessment Complete!</h3>
          <p className="text-gray-600">Here's your comprehensive GHG emissions summary</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">📊 Emissions Breakdown</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Scope 1 (Direct)</span>
                <span className="font-medium">{scope1Total.toFixed(2)} tCO2e</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Scope 2 (Energy)</span>
                <span className="font-medium">{scope2Total.toFixed(2)} tCO2e</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Scope 3 (Indirect)</span>
                <span className="font-medium">{scope3Total.toFixed(2)} tCO2e</span>
              </div>
              <hr className="border-gray-300" />
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Emissions</span>
                <span className="text-green-600">{totalEmissions.toFixed(2)} tCO2e</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">🎯 Readiness Score</h4>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">{readinessScore}%</div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${readinessScore}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                {readinessScore >= 80 ? '🌟 Excellent! Your data quality is audit-ready.' :
                 readinessScore >= 60 ? '✅ Good! Minor gaps need addressing.' :
                 readinessScore >= 40 ? '⚠️ Fair. Significant data gaps identified.' :
                 '🚨 Needs improvement. Major data collection required.'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-yellow-800 mb-3">📋 Next Steps</h4>
          <ul className="space-y-2 text-sm text-yellow-700">
            {readinessScore < 40 && <li>• Focus on collecting basic emissions data across all scopes</li>}
            {readinessScore < 60 && <li>• Improve data quality and coverage in Scope 3 categories</li>}
            {readinessScore < 80 && <li>• Implement data collection systems for missing categories</li>}
            <li>• Consider engaging with suppliers for better Scope 3 data</li>
            <li>• Prepare for third-party verification if planning ISO 14064-1 certification</li>
            <li>• Set science-based targets aligned with 1.5°C pathway</li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">GHG Assessment Calculator</h2>
              <p className="text-gray-600">Step {currentStep} of {totalSteps}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Form Content */}
          <div className="mb-8">
            {currentStep === 1 && renderScope1Form()}
            {currentStep === 2 && renderScope2Form()}
            {currentStep === 3 && renderScope3Form()}
            {currentStep === 4 && renderSummary()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
              >
                Complete Assessment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GHGCalculator;
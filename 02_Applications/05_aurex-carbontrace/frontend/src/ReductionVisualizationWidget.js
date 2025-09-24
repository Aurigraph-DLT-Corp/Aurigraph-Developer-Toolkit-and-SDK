import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- Mock Data Fetching ---
// In a real app, this would be a fetch call to the backend API.
const mockApiData = {
  "data": [
    {"date": "2023-01-31", "scope1": 120.5, "scope2": 340.2, "scope3": 50.0, "total": 510.7},
    {"date": "2023-02-28", "scope1": 118.2, "scope2": 335.0, "scope3": 48.5, "total": 501.7},
    {"date": "2023-03-31", "scope1": 115.0, "scope2": 330.1, "scope3": 51.2, "total": 496.3},
    {"date": "2023-04-30", "scope1": 112.8, "scope2": 325.5, "scope3": 52.0, "total": 490.3},
    {"date": "2023-05-31", "scope1": 110.1, "scope2": 320.0, "scope3": 53.5, "total": 483.6},
    {"date": "2023-06-30", "scope1": 108.3, "scope2": 315.7, "scope3": 55.1, "total": 479.1},
    {"date": "2023-07-31", "scope1": 106.5, "scope2": 310.2, "scope3": 56.8, "total": 473.5},
    {"date": "2023-08-31", "scope1": 104.9, "scope2": 305.0, "scope3": 58.2, "total": 468.1},
    {"date": "2023-09-30", "scope1": 102.7, "scope2": 300.3, "scope3": 59.9, "total": 462.9},
    {"date": "2023-10-31", "scope1": 100.4, "scope2": 295.8, "scope3": 61.5, "total": 457.7},
    {"date": "2023-11-30", "scope1": 98.2, "scope2": 290.1, "scope3": 63.1, "total": 451.4},
    {"date": "2023-12-31", "scope1": 96.0, "scope2": 285.4, "scope3": 64.8, "total": 446.2}
  ],
  "summary": {"start_date": "2023-01-01", "end_date": "2023-12-31", "total_emissions": 5720.8, "scopes_included": ["1", "2", "3"]}
};

const useEmissionsData = (filters) => {
  const [data, setData] = useState({ data: [], summary: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      // In a real app, you'd use the filters to query the API:
      // fetch(`/api/v1/emissions/visualization?start_date=${filters.startDate}...`)
      console.log("Fetching data with filters:", filters);
      setData(mockApiData);
      setLoading(false);
    }, 500);
  }, [filters]);

  return { data, loading };
};


// --- Target Settings Modal Component (CARB-104) ---
const TargetSettingsModal = ({ isOpen, onClose, onApply, settings }) => {
    const [localSettings, setLocalSettings] = useState(settings);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    if (!isOpen) return null;

    const handleApply = () => {
        onApply(localSettings);
        onClose();
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <h2>Target Settings</h2>
                <div style={styles.formGroup}>
                    <label>Baseline Year:</label>
                    <select value={localSettings.baselineYear} onChange={e => setLocalSettings({...localSettings, baselineYear: e.target.value})}>
                        {[2022, 2023, 2024].map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                </div>
                <div style={styles.formGroup}>
                    <label>Target Year:</label>
                    <select value={localSettings.targetYear} onChange={e => setLocalSettings({...localSettings, targetYear: e.target.value})}>
                        {[2030, 2040, 2050].map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                </div>
                <div style={styles.formGroup}>
                    <label>Reduction Target (%):</label>
                    <input type="number" value={localSettings.reductionTarget} onChange={e => setLocalSettings({...localSettings, reductionTarget: e.target.value})} />
                </div>
                <div style={styles.modalActions}>
                    <button onClick={onClose}>Cancel</button>
                    <button onClick={handleApply}>Apply</button>
                </div>
            </div>
        </div>
    );
};


// --- Main Widget Component (CARB-103 & CARB-105) ---
const ReductionVisualizationWidget = () => {
  const chartRef = useRef();
  const [filters, setFilters] = useState({ dateRange: '3y', scopes: ['total'] });
  const { data, loading } = useEmissionsData(filters);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetSettings, setTargetSettings] = useState({
      baselineYear: '2023',
      targetYear: '2030',
      reductionTarget: 30,
  });

  const handleExport = (format) => {
    if (chartRef.current) {
      html2canvas(chartRef.current).then(canvas => {
        if (format === 'png') {
          const imgData = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = imgData;
          link.download = 'emissions-chart.png';
          link.click();
        } else if (format === 'pdf') {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('landscape');
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save('emissions-report.pdf');
        }
      });
    }
  };
  
  const chartData = data.data.map(d => ({
      ...d,
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }));

  return (
    <div style={styles.widgetContainer} ref={chartRef}>
      <div style={styles.header}>
        <h3>Carbon Footprint Reduction Progress</h3>
        <div style={styles.controls}>
            {/* Filters would be implemented here */}
            <button onClick={() => setIsModalOpen(true)}>Options</button>
            <button onClick={() => handleExport('png')}>Export PNG</button>
            <button onClick={() => handleExport('pdf')}>Export PDF</button>
        </div>
      </div>
      {loading ? <p>Loading chart data...</p> : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis label={{ value: 'tCO2e', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total Emissions" />
            {/* Baseline and Target lines would be calculated and rendered here based on targetSettings */}
          </LineChart>
        </ResponsiveContainer>
      )}
      <TargetSettingsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onApply={setTargetSettings}
        settings={targetSettings}
      />
    </div>
  );
};

// --- Basic Styling ---
const styles = {
    widgetContainer: { border: '1px solid #ccc', borderRadius: '8px', padding: '16px', backgroundColor: '#fff' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    controls: { display: 'flex', gap: '8px' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', minWidth: '300px' },
    formGroup: { marginBottom: '12px' },
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }
};

export default ReductionVisualizationWidget;

import React from 'react';
import { ProjectRegistrationWizard } from './ProjectRegistrationWizard';

interface ProjectFormData {
  name: string;
  description?: string;
  state: string;
  districts: string[];
  acreageTarget: number;
  farmerTarget: number;
  methodologyType: string;
  methodologyVersion: string;
  vvbId?: string;
  startDate: Date;
  endDate: Date;
  season?: string;
}

export const ProjectRegistrationPage: React.FC = () => {
  const handleSubmit = async (data: ProjectFormData) => {
    try {
      const response = await fetch('/api/v1/projects/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...data,
          regions: [], // Will be populated from district selection
          methodologies: []
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const project = await response.json();
      console.log('Project created:', project);
      
      // Redirect to project details or list
      window.location.href = `/projects/${project.id}`;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  const handleSaveDraft = async (data: Partial<ProjectFormData>) => {
    try {
      // Save to local storage or send to API draft endpoint
      localStorage.setItem('project_draft', JSON.stringify(data));
      console.log('Draft saved:', data);
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  // Load draft data if available
  const initialData = React.useMemo(() => {
    try {
      const saved = localStorage.getItem('project_draft');
      return saved ? JSON.parse(saved) : undefined;
    } catch {
      return undefined;
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <ProjectRegistrationWizard
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        initialData={initialData}
      />
    </div>
  );
};
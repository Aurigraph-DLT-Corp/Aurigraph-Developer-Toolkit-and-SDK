import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GHGReadinessAssessment = ({ onComplete, onClose }) => {
    const [assessment, setAssessment] = useState(null);
    const [answers, setAnswers] = useState({});
    const [currentSection, setCurrentSection] = useState(0);

    useEffect(() => {
        const startAssessment = async () => {
            try {
                const response = await axios.post('/api/ghg-readiness/start');
                setAssessment(response.data);
            } catch (error) {
                console.error("Failed to start assessment", error);
            }
        };
        startAssessment();
    }, []);

    const handleAnswer = (questionId, answer) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleSubmit = async () => {
        try {
            // In a real app, you'd loop through answers and post them.
            const response = await axios.get(`/api/ghg-readiness/${assessment.id}/results`);
            onComplete(response.data);
        } catch (error) {
            console.error("Failed to get assessment results", error);
        }
    };

    if (!assessment) {
        return <div>Loading...</div>;
    }

    const section = assessment.sections[currentSection];

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-1/2 shadow-lg rounded-md bg-white">
                <h3 className="text-lg font-medium text-gray-900">{section.title}</h3>
                <div className="mt-2">
                    {section.questions.map(q => (
                        <div key={q.id} className="my-4">
                            <p className="font-semibold">{q.text}</p>
                            {q.options.map(opt => (
                                <label key={opt} className="block">
                                    <input
                                        type="radio"
                                        name={q.id}
                                        value={opt}
                                        onChange={() => handleAnswer(q.id, opt)}
                                    /> {opt}
                                </label>
                            ))}
                        </div>
                    ))}
                </div>
                <div className="items-center px-4 py-3">
                    {currentSection < assessment.sections.length - 1 && (
                        <button onClick={() => setCurrentSection(currentSection + 1)}>Next</button>
                    )}
                    {currentSection === assessment.sections.length - 1 && (
                        <button onClick={handleSubmit}>Submit</button>
                    )}
                    <button onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default GHGReadinessAssessment;
'use client';

import React, { useState } from 'react';
import { FaEye, FaCheck, FaTimes, FaRedo } from 'react-icons/fa';

const ISHIHARA_PLATES = [
  {
    id: 1,
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Ishihara_9.png', // Plate showing "74"
    answer: '74'
  },
  {
    id: 2,
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Ishihara_11.PNG', // Plate showing "6"
    answer: '6'
  },
  {
    id: 3,
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Ishihara_23.PNG/300px-Ishihara_23.PNG', // Plate showing "42" (often confused)
    answer: '42'
  }
];

export default function EyeTestPage() {
  const [currentPlate, setCurrentPlate] = useState(0);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [testFinished, setTestFinished] = useState(false);
  const [testStarted, setTestStarted] = useState(false);

  const handleNext = () => {
    if (input.trim() === ISHIHARA_PLATES[currentPlate].answer) {
      setScore(s => s + 1);
    }
    
    if (currentPlate < ISHIHARA_PLATES.length - 1) {
      setCurrentPlate(c => c + 1);
      setInput('');
    } else {
      setTestFinished(true);
    }
  };

  const restart = () => {
    setCurrentPlate(0);
    setInput('');
    setScore(0);
    setTestFinished(false);
    setTestStarted(false);
  };

  if (!testStarted) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-6 mt-10">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <FaEye size={32} />
        </div>
        <h1 className="text-3xl font-bold font-poppins">Eye Test</h1>
        <p className="text-slate-600">
          This is a Color Blindness (Ishihara) test. You will be shown a series of colored plates containing numbers.
          Enter the number you see to verify your color vision required for a driving license.
        </p>
        <button 
          onClick={() => setTestStarted(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-8 rounded-full transition-colors w-full"
        >
          Begin Test
        </button>
      </div>
    );
  }

  if (testFinished) {
    const passed = score === ISHIHARA_PLATES.length;
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-6 mt-10">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto text-white ${passed ? 'bg-green-500' : 'bg-red-500'}`}>
          {passed ? <FaCheck size={48} /> : <FaTimes size={48} />}
        </div>
        <h1 className="text-3xl font-bold font-poppins">
          {passed ? 'Vision Test Passed!' : 'Vision Test Failed'}
        </h1>
        <p className="text-xl">
          You scored <span className="font-bold">{score}</span> out of {ISHIHARA_PLATES.length}.
        </p>
        {!passed && (
          <p className="text-red-600">
            You might have color vision deficiency. It is recommended to consult an eye specialist.
          </p>
        )}
        <button 
          onClick={restart}
          className="bg-slate-200 text-slate-800 hover:bg-slate-300 font-semibold py-3 px-8 rounded-full mt-4 inline-flex items-center gap-2"
        >
          <FaRedo /> Retake Test
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-8 flex flex-col items-center">
      <header className="w-full">
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm w-full">
          <div className="font-semibold text-slate-500">
            Plate {currentPlate + 1} of {ISHIHARA_PLATES.length}
          </div>
        </div>
      </header>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center w-full">
        <p className="text-slate-600 mb-6 font-medium text-center">What number do you see in the circle?</p>
        
        <div className="w-64 h-64 md:w-80 md:h-80 bg-slate-100 rounded-full overflow-hidden mb-8 shadow-inner flex items-center justify-center">
          <img 
            src={ISHIHARA_PLATES[currentPlate].url} 
            alt="Ishihara Plate" 
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback if wikipedia image fails to load
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-slate-400 p-4 text-center">Image failed to load.<br/>Assume you see the number '+ISHIHARA_PLATES[currentPlate].answer+'</div>';
            }}
          />
        </div>

        <div className="w-full max-w-xs space-y-4">
          <input
            type="number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && input && handleNext()}
            className="w-full text-center text-3xl p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-emerald-500 transition-colors"
            placeholder="?"
            autoFocus
          />
          <button
            onClick={handleNext}
            disabled={!input}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-colors text-lg"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

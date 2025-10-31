import React from 'react';
import Calendar from './components/Calendar';

const App: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-gray-900 mb-8 sm:mb-12">
        Prosty Kalendarz
      </h1>
      <Calendar />
    </div>
  );
};

export default App;
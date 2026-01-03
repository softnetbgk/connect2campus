import React from 'react';
import { Smartphone } from 'lucide-react';

const SplashScreen = () => {
    return (
        <div className="fixed inset-0 bg-indigo-600 flex flex-col items-center justify-center z-50">
            <div className="bg-white p-4 rounded-full shadow-xl mb-4 animate-bounce">
                <Smartphone size={48} className="text-indigo-600" />
            </div>
            <h1 className="text-white text-2xl font-bold tracking-wider animate-pulse">
                SCHOOL APP
            </h1>
        </div>
    );
};

export default SplashScreen;

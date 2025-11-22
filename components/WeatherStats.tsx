import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { WeatherData, MandalaConfig } from '../types';

interface Props {
  weather: WeatherData;
  mandala: MandalaConfig;
}

export const WeatherStats: React.FC<Props> = ({ weather, mandala }) => {
  const data = [
    { name: 'Temp', value: weather.temperature, max: 50 },
    { name: 'Viento', value: weather.windSpeed, max: 100 },
    { name: 'Humedad', value: weather.humidity, max: 100 },
  ];

  return (
    <div className="w-full flex flex-col gap-0.5">
      <div className="flex justify-between items-start">
        <div className="overflow-hidden">
            <h3 className="text-xs font-bold text-white drop-shadow-md truncate">{weather.locationName}</h3>
            <p className="text-[9px] text-gray-300 italic drop-shadow-sm leading-tight truncate opacity-90">{weather.description}</p>
        </div>
        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-white/20 backdrop-blur-sm border border-white/30 shrink-0 ml-2 h-fit">
            {weather.condition}
        </span>
      </div>
      
      <div className="h-10 w-full mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 5, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis 
                dataKey="name" 
                type="category" 
                width={40} 
                tick={{ fill: '#eee', fontSize: 8 }} 
                axisLine={false}
                tickLine={false}
            />
            <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: 'none', borderRadius: '4px', fontSize: '9px', padding: '2px 4px' }}
                itemStyle={{ color: '#fff' }}
            />
            <Bar dataKey="value" radius={[0, 2, 2, 0]} barSize={4} background={{ fill: 'rgba(255,255,255,0.1)' }}>
               {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={mandala.colors[index % mandala.colors.length]} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
'use client';
import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface LeadsMapProps {
  locationData: { location: string; count: number }[];
}

const nameMap: { [key: string]: string } = {
  "USA": "United States of America",
  "UK": "United Kingdom",
  "Germany": "Germany",
  "France": "France",
  "Ukraine": "Ukraine"
};

export default function LeadsMap({ locationData }: LeadsMapProps) {
  const [tooltipContent, setTooltipContent] = useState("");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const maxCount = Math.max(...locationData.map(d => d.count), 1);
  
  const colorScale = scaleLinear<string>()
    .domain([0, maxCount])
    .range(["#1e293b", "#6366f1"]); 

  const handleMouseMove = (event: React.MouseEvent) => {
    // Получаем координаты относительно контейнера
    const rect = event.currentTarget.getBoundingClientRect();
    setMousePos({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
  };

  return (
    <div 
      className="bg-[#1e293b]/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-6 text-slate-100 flex flex-col items-center relative min-h-[450px] overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      <style jsx global>{`
        .recharts-surface:focus, .recharts-wrapper:focus, .rsm-geography:focus {
          outline: none !important;
        }
      `}</style>

      <div className="w-full flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold tracking-tight">Global Leads Distribution</h2>
      </div>
      
      {/* Кастомный Tooltip, следующий за курсором */}
      {tooltipContent && (
        <div 
          className="pointer-events-none absolute z-[100] bg-slate-900 border border-slate-700/50 px-3 py-2 rounded-xl text-xs font-bold shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-150"
          style={{ 
            left: mousePos.x + 15, 
            top: mousePos.y + 15,
            whiteSpace: 'nowrap'
          }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider">Location</span>
            <span className="text-slate-100">{tooltipContent}</span>
          </div>
        </div>
      )}
      
      <div className="w-full h-full flex-grow">
        <ComposableMap projectionConfig={{ scale: 147 }}>
            <Geographies geography={geoUrl}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => {
                  const countryName = geo.properties.name;
                  const data = locationData.find(d => 
                    nameMap[d.location] === countryName || d.location === countryName
                  );
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => {
                        if (data) {
                          setTooltipContent(`${countryName}: ${data.count} leads`);
                        } else {
                          setTooltipContent(`${countryName}: No data`);
                        }
                      }}
                      onMouseLeave={() => {
                        setTooltipContent("");
                      }}
                      style={{
                        default: {
                          fill: data ? colorScale(data.count) : "#1e293b",
                          stroke: "#334155",
                          strokeWidth: 0.5,
                          outline: "none",
                        },
                        hover: {
                          fill: data ? "#818cf8" : "#334155",
                          stroke: "#6366f1",
                          strokeWidth: 1,
                          outline: "none",
                          cursor: "pointer"
                        },
                        pressed: {
                          fill: "#4f46e5",
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
        </ComposableMap>
      </div>

      <div className="w-full mt-4 flex justify-between items-center text-[10px] text-slate-400 font-medium uppercase tracking-widest border-t border-slate-700/30 pt-4">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-800"></div>
            <span>Min Leads</span>
        </div>
        <div className="h-1 flex-grow mx-6 rounded-full bg-gradient-to-r from-slate-800 via-indigo-900 to-indigo-500"></div>
        <div className="flex items-center gap-2">
            <span>Max Leads</span>
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
        </div>
      </div>
    </div>
  );
}

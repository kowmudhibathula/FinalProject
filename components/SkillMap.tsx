
import React, { useMemo } from 'react';
import { Progress, Topic } from '../types';
import { TOPICS } from '../constants';

interface SkillMapProps {
  progress: Progress;
}

const SkillMap: React.FC<SkillMapProps> = ({ progress }) => {
  const nodes = useMemo(() => {
    return TOPICS.map((topic, index) => {
      const angle = (index / TOPICS.length) * 2 * Math.PI;
      const radius = 120;
      const x = 150 + radius * Math.cos(angle);
      const y = 150 + radius * Math.sin(angle);
      const isCompleted = progress.completedTopics.includes(topic.id);
      const skillLevel = progress.skillLevels[topic.id] || 0;
      
      return { ...topic, x, y, isCompleted, skillLevel };
    });
  }, [progress]);

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      <h3 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
        <span className="text-2xl">🗺️</span> Mastery Skill Map
      </h3>
      <div className="relative w-full aspect-square max-w-[400px] mx-auto">
        <svg viewBox="0 0 300 300" className="w-full h-full">
          {/* Connections */}
          {nodes.map((node, i) => (
            <line
              key={`line-${i}`}
              x1="150"
              y1="150"
              x2={node.x}
              y2={node.y}
              stroke="#e2e8f0"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          ))}
          
          {/* Center Hub */}
          <circle cx="150" cy="150" r="20" fill="#6366f1" className="animate-pulse" />
          <text x="150" y="154" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">YOU</text>

          {/* Nodes */}
          {nodes.map((node) => (
            <g key={node.id} className="cursor-pointer group">
              <circle
                cx={node.x}
                cy={node.y}
                r="18"
                fill={node.isCompleted ? '#10b981' : '#f1f5f9'}
                stroke={node.isCompleted ? '#059669' : '#cbd5e1'}
                strokeWidth="2"
                className="transition-all duration-300 group-hover:r-22"
              />
              <text
                x={node.x}
                y={node.y + 35}
                textAnchor="middle"
                fontSize="8"
                fontWeight="600"
                className="fill-slate-600"
              >
                {node.name}
              </text>
              <text
                x={node.x}
                y={node.y + 5}
                textAnchor="middle"
                fontSize="12"
              >
                {node.icon}
              </text>
              {/* Tooltip Simulation */}
              <title>{node.name}: {node.skillLevel}% Mastery</title>
            </g>
          ))}
        </svg>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Total Experience</p>
          <p className="text-2xl font-bold text-indigo-900">{progress.points} XP</p>
        </div>
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
          <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Topics Mastered</p>
          <p className="text-2xl font-bold text-emerald-900">{progress.completedTopics.length} / {TOPICS.length}</p>
        </div>
      </div>
    </div>
  );
};

export default SkillMap;

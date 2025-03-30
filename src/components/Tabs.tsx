
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type TabsProps = {
  tabs: string[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
};

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onSelectTab }) => {
  return (
    <div className="flex items-center bg-sidebar border-b border-border">
      <button className="px-1 py-1 text-slate-400 hover:text-white">
        <ChevronLeft size={18} />
      </button>
      <button className="px-1 py-1 text-slate-400 hover:text-white">
        <ChevronRight size={18} />
      </button>
      <div className="flex">
        {tabs.map((tab) => (
          <div
            key={tab}
            className={`px-4 py-1 cursor-pointer border-r border-border ${
              activeTab === tab ? 'bg-tab-active text-white' : 'bg-tab-inactive text-slate-400'
            }`}
            onClick={() => onSelectTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tabs;

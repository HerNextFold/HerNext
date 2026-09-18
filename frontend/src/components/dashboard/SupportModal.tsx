import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Send, 
  Bot
} from 'lucide-react';
import { useUserContext } from '../../context/UserContext';

interface SupportModalProps {
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ onClose }) => {
  const { user, onboarding } = useUserContext();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: `Hi ${user.fullName}! I'm your HerNext AI Career Concierge. How can I assist you with your ${onboarding.currentRole} skills discovery, portfolio mapping, or target roadmap today?`
    }
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userText = query;
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setQuery('');

    setTimeout(() => {
      let reply = "I've reviewed your question. Based on your validated UI/UX background and current 82% AI readiness score, focusing on Strategic Product Thinking will give you the highest career leverage for 2026 roles!";
      if (userText.toLowerCase().includes('roadmap')) {
        reply = "You can add any discovered competency directly to your roadmap by clicking 'Add to My Roadmap'. We automatically calculate the estimated completion trajectory.";
      } else if (userText.toLowerCase().includes('mentor') || userText.toLowerCase().includes('human')) {
        reply = "As a HerNext member, you can also book a 1-on-1 session with female tech leaders in our executive network. Would you like me to connect you with an AI Design Director?";
      }
      setMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
    }, 800);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-purple-100 overflow-hidden flex flex-col h-[520px]"
      >
        <div className="bg-[#261338] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#F05A7E] to-[#9B51E0] flex items-center justify-center text-white shadow-md">
              <Bot size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">HerNext AI Support & Advisory</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[10px] text-purple-200/70">Instant Career Guidance & Platform Help</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white p-1.5 rounded-full hover:bg-white/10 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gradient-to-b from-gray-50/60 to-white">
          {messages.map((m, i) => (
            <div 
              key={i} 
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-[#2D1B4E] text-white rounded-tr-none'
                    : 'bg-purple-50 text-purple-950 border border-purple-100/80 rounded-tl-none'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Suggestions */}
        <div className="px-4 py-2 bg-gray-50/80 border-t border-gray-100 flex gap-1.5 overflow-x-auto no-scrollbar">
          {['How are my skills scored?', 'Explain AI Product Thinking', 'Connect with Mentor'].map((q) => (
            <button
              key={q}
              onClick={() => {
                setQuery(q);
              }}
              className="text-[10px] bg-white border border-purple-100 hover:border-purple-300 text-purple-900 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
          <input 
            type="text" 
            placeholder="Ask anything about your skills or career path..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-[#8C3F96] outline-none"
          />
          <button 
            type="submit"
            className="bg-[#8C3F96] hover:bg-[#722e7b] text-white p-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Send size={15} />
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default SupportModal;

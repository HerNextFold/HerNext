import React from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Sparkles, 
  ArrowRight, 
  Lightbulb 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SkillTransferModalProps {
  skillName: string;
  onClose: () => void;
}

export const SkillTransferModal: React.FC<SkillTransferModalProps> = ({
  skillName,
  onClose
}) => {
  const navigate = useNavigate();

  // Mapping dictionary for skills
  const transferMap: Record<string, {
    traditional: string;
    aiApplication: string;
    tools: string[];
    transferRating: number;
    tip: string;
  }> = {
    'Figma & Design Tools': {
      traditional: 'Crafting static vectors, UI auto-layout, and high-fidelity screen specs.',
      aiApplication: 'Using AI Figma plugins (Relume, Genius, Galileo) to generate base UI structures and variable token models in seconds.',
      tools: ['Figma AI', 'Galileo AI', 'Relume AI'],
      transferRating: 95,
      tip: 'Your mastery of Figma variables translates directly to AI design token schema configuration!'
    },
    'Wireframing': {
      traditional: 'Creating low-fidelity layout blueprints and structural user flows.',
      aiApplication: 'Prompt-driven wireframing via V0, Claude Artifacts, and Framer AI for instant responsive layout iteration.',
      tools: ['V0.dev', 'Framer AI', 'Claude Artifacts'],
      transferRating: 90,
      tip: 'AI speeds up wireframing 10x, letting you focus on prompt logic and edge-case user states.'
    },
    'Usability Testing': {
      traditional: 'Moderating user sessions, observing task completion, and noting friction.',
      aiApplication: 'Testing non-deterministic AI chat/copilot interactions, measuring intent accuracy, and evaluating fallback UI.',
      tools: ['Synthetic User AI', 'Maze', 'Hotjar Telemetry'],
      transferRating: 88,
      tip: 'AI systems produce unexpected responses; testing user trust during AI errors is high-demand!'
    },
    'Design Systems': {
      traditional: 'Managing token libraries, component variants, and accessibility standards.',
      aiApplication: 'Building automated AI design governance systems that auto-generate WCAG compliant component variants.',
      tools: ['Design Tokens Studio', 'Storybook AI', 'Zeroheight'],
      transferRating: 92,
      tip: 'Design System leads who integrate AI token automation command top executive salaries in 2026.'
    },
    'Agile Methodologies': {
      traditional: 'Participating in sprints, user stories, and cross-functional standups.',
      aiApplication: 'Prompt engineering story specs, rapid AI prototyping spikes, and continuous feedback loops with ML engineers.',
      tools: ['Jira AI', 'Linear', 'Notion AI'],
      transferRating: 85,
      tip: 'Agile design spikes now take hours instead of weeks thanks to AI UI prototyping.'
    },
    'Cross-functional Collaboration': {
      traditional: 'Aligning product managers, frontend engineers, and business stakeholders.',
      aiApplication: 'Bridging data scientists and ML engineers with human-centered product vision.',
      tools: ['Slack AI', 'Miro AI', 'FigJam Copilot'],
      transferRating: 94,
      tip: 'Tech companies desperately need designers who can translate ML jargon into human empathy.'
    },
    'Visual Hierarchy': {
      traditional: 'Structuring visual weight, typography scale, and color harmony.',
      aiApplication: 'Designing streaming text UI, typewriter loading states, and dynamic AI confidence badges.',
      tools: ['Tailwind CSS', 'Figma Variables', 'Motion'],
      transferRating: 91,
      tip: 'Visual hierarchy guides user attention when streaming AI responses in real-time.'
    }
  };

  const details = transferMap[skillName] || {
    traditional: `Traditional experience in ${skillName}.`,
    aiApplication: `Directly transfers to AI workflows by accelerating ideation and intent alignment.`,
    tools: ['Figma AI', 'V0', 'Claude'],
    transferRating: 88,
    tip: `This core competency provides strong leverage for your AI career transition.`
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-purple-100 overflow-hidden my-6 text-gray-800"
      >
        <div className="bg-[#261338] text-white p-5 relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 p-1.5 rounded-full cursor-pointer"
          >
            <X size={18} />
          </button>
          <div className="inline-flex items-center gap-1.5 bg-[#F05A7E]/20 text-[#F05A7E] border border-[#F05A7E]/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles size={11} />
            Transferable Skill Analysis
          </div>
          <h3 className="text-xl font-bold text-white mb-1">
            {skillName}
          </h3>
          <div className="flex items-center gap-2 text-xs text-purple-200/80">
            <span>Transferability Index:</span>
            <span className="font-bold text-emerald-400">{details.transferRating}% Direct Transfer</span>
          </div>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="space-y-2">
            <h4 className="font-bold text-[#2D1B4E] uppercase tracking-wider text-[10px] text-gray-500">
              Traditional UX Workflow vs AI Upgrade
            </h4>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Where you come from:</span>
              <p className="text-gray-700">{details.traditional}</p>
            </div>

            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 space-y-1">
              <span className="text-[10px] font-bold text-[#8C3F96] uppercase block">Where it takes you in AI:</span>
              <p className="text-purple-950 font-medium">{details.aiApplication}</p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-[#2D1B4E] uppercase tracking-wider text-[10px] text-gray-500 mb-2">
              Next-Gen Tool Ecosystem
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {details.tools.map((t, idx) => (
                <span key={idx} className="bg-gray-100 text-gray-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-gray-200">
                  ⚡ {t}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-start gap-2.5 text-amber-900">
            <Lightbulb size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>HerNext Career Tip:</strong> {details.tip}
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded-xl cursor-pointer"
          >
            Close
          </button>
          <button 
            onClick={() => {
              onClose();
              navigate('/dashboard/skills');
            }}
            className="bg-[#2D1B4E] hover:bg-[#431F69] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>View in My Skills</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SkillTransferModal;

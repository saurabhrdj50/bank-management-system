import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiX, FiSend } from 'react-icons/fi';

const BOT_RESPONSES = {
  balance: (data) => `Your total balance is ₹${data?.totalBalance?.toLocaleString() || '0'}. Would you like to see a breakdown by account?`,
  transactions: () => "I can show your recent transactions. Head to the Transactions page for a detailed view with filters and export options.",
  transfer: () => "To make a transfer, go to Transactions > Transfer. You'll need the recipient's account number and the amount.",
  loan: () => "We offer Personal (8.5%), Home (6.5%), Auto (7.5%), and Business (9.5%) loans. Visit the Loans page to apply with our real-time EMI calculator!",
  help: () => "I can help you with: \n• Check balance \n• Recent transactions \n• Transfer money \n• Loan information \n• Account details",
  hello: () => "Hello! Welcome to FinBank. How can I assist you today?",
  hi: () => "Hi there! I'm your FinBank assistant. What can I help you with?",
  thanks: () => "You're welcome! Is there anything else I can help you with?",
  atm: () => "Our ATM simulator lets you practice withdrawals. Visit the ATM page to try quick cash withdrawals of ₹1,000, ₹2,000, ₹5,000, or ₹10,000.",
  default: () => "I'm not sure I understand. Try asking about your balance, transactions, transfers, or loans. Type 'help' for more options.",
};

const getBotResponse = (message, data) => {
  const lower = message.toLowerCase();
  if (lower.includes('balance') || lower.includes('money') || lower.includes('how much'))
    return BOT_RESPONSES.balance(data);
  if (lower.includes('transaction') || lower.includes('history') || lower.includes('statement'))
    return BOT_RESPONSES.transactions();
  if (lower.includes('transfer') || lower.includes('send'))
    return BOT_RESPONSES.transfer();
  if (lower.includes('loan') || lower.includes('borrow') || lower.includes('emi'))
    return BOT_RESPONSES.loan();
  if (lower.includes('help') || lower.includes('what can'))
    return BOT_RESPONSES.help();
  if (lower.includes('hello') || lower.includes('hey'))
    return BOT_RESPONSES.hello();
  if (lower.includes('hi'))
    return BOT_RESPONSES.hi();
  if (lower.includes('thank') || lower.includes('bye'))
    return BOT_RESPONSES.thanks();
  if (lower.includes('atm'))
    return BOT_RESPONSES.atm();
  return BOT_RESPONSES.default();
};

const Chatbot = ({ userData = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm FinBot, your banking assistant. How can I help you today?", sender: 'bot', time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), text: input, sender: 'user', time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getBotResponse(input, userData);
      const botMsg = { id: Date.now() + 1, text: response, sender: 'bot', time: new Date() };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center hover:shadow-indigo-500/50 transition-shadow"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <FiX size={22} />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <FiMessageCircle size={22} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] glass-card overflow-hidden flex flex-col"
            style={{ height: '480px' }}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-700/30 bg-gradient-to-r from-indigo-600/20 to-purple-600/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  FB
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">FinBot Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-xs text-emerald-400">Online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400 text-xs font-bold mr-2 flex-shrink-0 mt-1">
                      FB
                    </div>
                  )}
                  <div className={msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}>
                    <p className="text-sm whitespace-pre-line">{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-500'}`}>
                      {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400 text-xs font-bold">
                    FB
                  </div>
                  <div className="chat-bubble-bot">
                    <div className="loading-dots flex gap-1">
                      <span className="w-2 h-2 bg-slate-400 rounded-full" />
                      <span className="w-2 h-2 bg-slate-400 rounded-full" />
                      <span className="w-2 h-2 bg-slate-400 rounded-full" />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 flex gap-2 overflow-x-auto border-t border-slate-700/20">
              {['Balance', 'Loans', 'Transfer', 'Help'].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q.toLowerCase()); }}
                  className="px-3 py-1 rounded-lg bg-slate-800/50 text-slate-400 text-xs font-medium hover:bg-indigo-500/15 hover:text-indigo-300 transition-colors whitespace-nowrap"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-700/30">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="glass-input flex-1 px-4 py-2.5 text-sm"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white disabled:opacity-40 transition-opacity"
                >
                  <FiSend size={16} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;

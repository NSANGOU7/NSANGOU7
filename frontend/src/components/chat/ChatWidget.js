import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ChatWidget = () => {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [started, setStarted] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages
  useEffect(() => {
    if (!chatId || !isOpen) return;
    
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_URL}/api/chat/${chatId}`);
        setMessages(response.data.messages || []);
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [chatId, isOpen]);

  const startChat = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/chat/start`, {
        name,
        email
      });
      setChatId(response.data.id);
      setStarted(true);
      
      // Welcome message
      setMessages([{
        sender: 'admin',
        sender_name: 'Expert AutoParts',
        content: `Bonjour ${name} ! Comment puis-je vous aider aujourd'hui ?`,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !chatId) return;

    const messageContent = input;
    setInput('');

    try {
      await axios.post(`${API_URL}/api/chat/${chatId}/message`, {
        content: messageContent,
        sender: 'customer',
        sender_name: name
      });
      
      // Add message locally
      setMessages(prev => [...prev, {
        sender: 'customer',
        sender_name: name,
        content: messageContent,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-[#3B5BFF] hover:bg-[#2d48d9] text-white p-4 rounded-full shadow-2xl shadow-blue-300 z-50 transition-all hover:scale-110 active:scale-95"
          data-testid="chat-widget-open"
        >
          <MessageCircle size={24} />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[90vw] sm:w-96 h-[500px] bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col z-50 border border-slate-200" data-testid="chat-widget">
          {/* Header */}
          <div className="bg-[#3B5BFF] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User size={20} />
              </div>
              <div>
                <p className="font-semibold">Contactez un expert</p>
                <p className="text-xs opacity-90 flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                  En ligne
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-full"
              data-testid="chat-widget-close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
            {!started ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl">
                  <p className="text-sm text-slate-700 mb-3">
                    👋 Bonjour ! Renseignez vos informations pour commencer à discuter avec notre expert.
                  </p>
                </div>
                <form onSubmit={startChat} className="space-y-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Votre nom"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#3B5BFF] outline-none"
                    required
                    data-testid="chat-name-input"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Votre email"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#3B5BFF] outline-none"
                    required
                    data-testid="chat-email-input"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#3B5BFF] hover:bg-[#2d48d9] text-white py-3 rounded-xl font-medium transition-colors"
                    data-testid="chat-start-btn"
                  >
                    {loading ? 'Connexion...' : 'Démarrer la discussion'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                        msg.sender === 'customer'
                          ? 'bg-[#3B5BFF] text-white rounded-tr-sm'
                          : 'bg-white text-slate-800 rounded-tl-sm border border-slate-200'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.sender === 'customer' ? 'text-blue-100' : 'text-slate-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          {started && (
            <form onSubmit={sendMessage} className="p-3 border-t border-slate-200 bg-white flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Écrivez votre message..."
                className="flex-1 px-4 py-2 rounded-full border border-slate-200 focus:border-[#3B5BFF] outline-none text-sm"
                data-testid="chat-message-input"
              />
              <button
                type="submit"
                className="bg-[#3B5BFF] hover:bg-[#2d48d9] text-white p-2 rounded-full transition-colors disabled:opacity-50"
                disabled={!input.trim()}
                data-testid="chat-send-btn"
              >
                <Send size={18} />
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
};

export default ChatWidget;

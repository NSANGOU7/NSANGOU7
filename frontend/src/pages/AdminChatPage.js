import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageCircle, Send, User, Circle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminChatPage = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/');
      return;
    }
    fetchChats();
    
    // Poll for new chats/messages every 3 seconds
    const interval = setInterval(fetchChats, 3000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChat?.messages]);

  const fetchChats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/chats`, { withCredentials: true });
      setChats(response.data);
      
      // Update selected chat if exists
      if (selectedChat) {
        const updated = response.data.find(c => c.id === selectedChat.id);
        if (updated) setSelectedChat(updated);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedChat) return;

    const content = input;
    setInput('');

    try {
      await axios.post(`${API_URL}/api/chat/${selectedChat.id}/message`, {
        content,
        sender: 'admin',
        sender_name: 'Expert AutoParts'
      });
      
      // Update locally
      setSelectedChat(prev => ({
        ...prev,
        messages: [...(prev.messages || []), {
          sender: 'admin',
          sender_name: 'Expert AutoParts',
          content,
          timestamp: new Date().toISOString()
        }]
      }));
      
      fetchChats();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100" data-testid="admin-chat-page">
      {/* Header */}
      <div className="bg-[#0A0F1C] text-white py-4">
        <div className="px-6 md:px-12 lg:px-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-slate-400 hover:text-white">
              <ChevronLeft size={20} />
            </Link>
            <div>
              <Link to="/" className="text-xl font-bold">
                AUTO<span className="text-[#FF3333]">PARTS</span>
              </Link>
              <span className="ml-4 text-sm text-slate-400">Chat en direct</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-8">
        <div className="bg-white border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-220px)]">
          {/* Chat List */}
          <div className="border-r border-slate-200 overflow-y-auto">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h2 className="font-semibold flex items-center gap-2">
                <MessageCircle size={18} />
                Conversations ({chats.length})
              </h2>
            </div>
            {loading ? (
              <div className="p-4 text-center text-slate-500">Chargement...</div>
            ) : chats.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">Aucune conversation</p>
              </div>
            ) : (
              <div>
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                      selectedChat?.id === chat.id ? 'bg-blue-50 border-l-4 border-l-[#3B5BFF]' : ''
                    }`}
                    data-testid={`chat-item-${chat.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={20} className="text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{chat.customer_name}</p>
                          <Circle size={8} fill="#10B981" className="text-emerald-500" />
                        </div>
                        <p className="text-xs text-slate-500 truncate">{chat.customer_email}</p>
                        {chat.messages?.length > 0 && (
                          <p className="text-xs text-slate-400 truncate mt-1">
                            {chat.messages[chat.messages.length - 1].content}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(chat.updated_at).toLocaleString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chat Messages */}
          <div className="md:col-span-2 flex flex-col">
            {!selectedChat ? (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <MessageCircle size={64} className="mx-auto mb-4 text-slate-300" />
                  <p>Sélectionnez une conversation pour commencer</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-semibold">{selectedChat.customer_name}</p>
                    <p className="text-xs text-slate-500">{selectedChat.customer_email}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                  {selectedChat.messages?.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                          msg.sender === 'admin'
                            ? 'bg-[#3B5BFF] text-white rounded-tr-sm'
                            : 'bg-white text-slate-800 rounded-tl-sm border border-slate-200'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${msg.sender === 'admin' ? 'text-blue-100' : 'text-slate-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={sendMessage} className="p-3 border-t border-slate-200 flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Répondre au client..."
                    className="flex-1 px-4 py-2 rounded-full border border-slate-200 focus:border-[#3B5BFF] outline-none text-sm"
                    data-testid="admin-chat-input"
                  />
                  <Button 
                    type="submit" 
                    disabled={!input.trim()}
                    className="bg-[#3B5BFF] hover:bg-[#2d48d9] rounded-full"
                    data-testid="admin-chat-send"
                  >
                    <Send size={18} />
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChatPage;

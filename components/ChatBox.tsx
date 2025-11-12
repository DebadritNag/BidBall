import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';

interface ChatBoxProps {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    username: string;
    isDisabled: boolean;
}

const ChatBox: React.FC<ChatBoxProps> = ({ messages, onSendMessage, username, isDisabled }) => {
    const [chatInput, setChatInput] = useState('');
    const chatContainerRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (chatInput.trim() === '' || isDisabled) return;
        onSendMessage(chatInput.trim());
        setChatInput('');
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl shadow-inner h-full border border-yellow-500/20 flex flex-col">
            <h3 className="text-xl font-bold text-center text-yellow-400 mb-4 flex-shrink-0">Auction Chat</h3>
            <ul ref={chatContainerRef} className="flex-grow space-y-3 overflow-y-auto pr-2">
                {messages.map((msg, index) => (
                    <li key={index} className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                        {!msg.isUser && <span className={`text-xs px-2 ${msg.sender === 'System' ? 'text-gray-400' : 'text-yellow-300'}`}>{msg.sender}</span>}
                        <div className={`max-w-xs text-sm p-3 rounded-xl ${
                            msg.sender === 'System' 
                            ? 'bg-gray-600/50 w-full text-center italic' 
                            : msg.isUser 
                            ? 'bg-green-600/50 rounded-br-none' 
                            : 'bg-gray-700/50 rounded-bl-none'
                        }`}>
                            {msg.text}
                        </div>
                    </li>
                ))}
            </ul>
            <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 flex-shrink-0">
                <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={isDisabled ? "Chat disabled" : "Type a message..."}
                    className="flex-grow bg-gray-700/50 text-white border-2 border-gray-600 rounded-lg py-2 px-3 focus:outline-none focus:border-yellow-500 transition-colors duration-300 text-sm disabled:cursor-not-allowed"
                    autoComplete="off"
                    disabled={isDisabled}
                />
                <button 
                  type="submit" 
                  className="bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-yellow-400 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                  disabled={isDisabled}
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default ChatBox;

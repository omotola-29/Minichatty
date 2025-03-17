import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import MessageInput from './MessageInput';

const ENDPOINT = 'http://localhost:4000';

const Chat = ({ username }) => {
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  // Scroll to bottom whenever messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(ENDPOINT);
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      setSocket(newSocket);
      
      // Join chat room after connection is established
      newSocket.emit('joinRoom', username);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Clean up on component unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [username]);

  // Fetch messages when component mounts
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${ENDPOINT}/api/messages`);
        if (res.data && Array.isArray(res.data)) {
          setMessages(res.data);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };
    
    fetchMessages();
  }, []);

  // Set up socket event listeners after socket is connected
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for messages
    const messageHandler = (message) => {
      if (message && message.text !== undefined) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    };
    
    socket.on('message', messageHandler);

    // Handle typing indicators
    socket.on('typing', (data) => {
      if (data && data.username && data.username !== username && !typingUsers.includes(data.username)) {
        setTypingUsers(prev => [...prev, data.username]);
      }
    });

    socket.on('stop typing', (data) => {
      if (data && data.username) {
        setTypingUsers(prev => prev.filter(user => user !== data.username));
      }
    });

    return () => {
      socket.off('message', messageHandler);
      socket.off('typing');
      socket.off('stop typing');
    };
  }, [socket, isConnected, username, typingUsers]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = (text) => {
    if (socket && isConnected) {
      socket.emit('chatMessage', text);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format typing indicator text
  const getTypingText = () => {
    if (typingUsers.length === 0) return '';
    if (typingUsers.length === 1) return `${typingUsers[0]} is typing...`;
    if (typingUsers.length === 2) return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    return 'Several people are typing...';
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h1>Mini Chat App</h1>
        <div>Welcome, {username}!</div>
        <div className="connection-status">
          {isConnected ? '🟢 Connected' : '🔴 Connecting...'}
        </div>
      </header>
      <main className="chat-messages">
        {messages && Array.isArray(messages) ? messages.map((message, index) => (
          <div 
            className="message" 
            key={index}
            style={{
              backgroundColor: message.username === username ? '#dcf8c6' : '#f1f0f0',
              alignSelf: message.username === username ? 'flex-end' : 'flex-start'
            }}
          >
            <div className="meta">
              {message.username || 'Unknown'} <span>{formatTime(message.time)}</span>
            </div>
            <p className="text">{message.text || ''}</p>
          </div>
        )) : <div>Loading messages...</div>}
        <div ref={messagesEndRef} />
      </main>
      <div className="typing-indicator">
        {getTypingText()}
      </div>
      <div className="form-container">
        <MessageInput onSendMessage={sendMessage} socket={socket} isConnected={isConnected} />
      </div>
    </div>
  );
};

export default Chat;

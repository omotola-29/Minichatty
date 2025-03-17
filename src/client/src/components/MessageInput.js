import React, { useState, useEffect, useRef } from 'react';

const MessageInput = ({ onSendMessage, socket, isConnected }) => {
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef(null);

  // Function to handle typing event with debounce
  const handleTyping = () => {
    if (socket && isConnected) {
      try {
        socket.emit('typing');
        
        // Clear previous timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Set new timeout for "stop typing" event
        typingTimeoutRef.current = setTimeout(() => {
          if (socket && socket.connected) {
            socket.emit('stop typing');
          }
        }, 2000); // Stop typing after 2 seconds of inactivity
      } catch (error) {
        console.error("Error handling typing event:", error);
      }
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      
      // Stop typing when message is sent
      if (socket && isConnected) {
        try {
          socket.emit('stop typing');
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
        } catch (error) {
          console.error("Error stopping typing event:", error);
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="chat-form">
      <input
        type="text"
        placeholder={isConnected ? "Type a message..." : "Connecting..."}
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          handleTyping();
        }}
        required
        autoComplete="off"
        disabled={!isConnected}
      />
      <button type="submit" disabled={!isConnected}>Send</button>
    </form>
  );
};

export default MessageInput;

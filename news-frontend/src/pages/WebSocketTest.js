import {Client} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useState, useEffect, useRef } from 'react';
const WebSocketTest = () => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [isConnected, setConnected] = useState(false);
    const clientRef = useRef(null);
    useEffect(() => {
        const connect = ()=>{
            const socket = new SockJS('http://localhost:8080/ws');
            const client = new Client({
                webSocketFactory: () => socket,
                debug: () => {},

            });
            client.onConnect = () => {
                console.log('✅ Đã kết nối WebSocket');
                setConnected(true);
                client.subscribe('/topic/test', (frame) => {
                    const messageContent = JSON.parse(frame.body);
                    setMessages(prev => [...prev, messageContent]);
                });

            };
            client.onStompError = (err) =>{
                setConnected(false);
                console.error('❌ Lỗi kết nối WebSocket:', err);
            }
            client.onWebSocketError = (err) =>{
                setConnected(false);
                console.error('❌ Lỗi WebSocket:', err);
            }
            client.activate();
            clientRef.current = client
            
        };
        connect();
        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
        
    },[]); 
    const sendMessage = () => {
        if (!isConnected) {
            alert('Chưa kết nối WebSocket!');
            return;
          }
          
          if (!clientRef.current) {
            alert('STOMP client chưa sẵn sàng!');
            return;
          }
        const payload = {
            content: message,
            timestamp: new Date().toISOString(),
        };
        if (!clientRef.current.connected) {   
            alert('STOMP connection đã bị ngắt!');
            return;
          }
        clientRef.current.publish({
            destination: '/app/test',
            body: JSON.stringify(payload),
        });
        console.log('📤 Đã gửi tin nhắn:', payload);

        setMessage('');
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h2>WebSocket Test</h2>
            
            {/* Trạng thái kết nối */}
            <div style={{ marginBottom: '20px' }}>
                <span style={{ 
                    color: isConnected ? 'green' : 'red',
                    fontWeight: 'bold'
                    }}>
                    {isConnected ? '🟢 Đã kết nối' : '🔴 Chưa kết nối'}
                </span>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <input type="text" value={message} 
                onChange={(e) => setMessage(e.target.value)} />
                <button onClick={sendMessage}>Send Message</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h3>Messages:</h3>
                <ul>
                    {messages.map((msg, index) => (
                        <li key={index}>{msg.content}</li>
                    ))}
                </ul>
            </div>
    
        </div>
    );
    
};
export default WebSocketTest;
import { useEffect, useRef, useState } from 'react';
import { useToast } from './use-toast';

type Notification = {
  type: string;
  message: string;
};

export function useNotifications() {
  const { toast } = useToast();
  const socketRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Get the current host from window.location
    const host = window.location.host;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${host}/ws`;

    console.log('Attempting to connect to WebSocket:', wsUrl);

    // Create WebSocket connection
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.addEventListener('open', () => {
      console.log('WebSocket connection established');
      setConnected(true);
    });

    socket.addEventListener('message', (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);
        console.log('Received notification:', notification);

        if (notification.type === 'upcoming-meeting') {
          toast({
            title: "Upcoming Meeting",
            description: notification.message,
          });
        }
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    });

    socket.addEventListener('close', () => {
      console.log('WebSocket connection closed');
      setConnected(false);
    });

    socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [toast]);

  return { connected };
}
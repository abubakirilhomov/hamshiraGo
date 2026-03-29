/**
 * SocketContext — provides a single shared Socket.IO connection
 * for the entire medic app. Connects when token is available,
 * reconnects if token changes, disconnects on logout.
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, connected: false });

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      // No token — disconnect existing socket if any
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 15,
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSharedSocket(): SocketContextType {
  return useContext(SocketContext);
}

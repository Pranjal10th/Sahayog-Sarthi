// frontend/src/pages/bookings/[id].js me inject karne ke liye updated template code:
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import io from 'socket.io-client';
import axios from 'axios';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then((mod) => mod.Polyline), { ssr: false });
const useMap = dynamic(() => import('react-leaflet').then((mod) => mod.useMap), { ssr: false });

let socket;

function LeafletStyles() {
  return (
    <Head>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    </Head>
  );
}

function ChangeMapView({ center }) {
  const map = useMap();
  if (center[0] && center[1]) map.setView(center, map.getZoom());
  return null;
}

export default function BookingTracker() {
  const router = useRouter();
  const { id } = router.query;
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customerLocation] = useState([26.8467, 80.9462]);
  const [workerLocation, setWorkerLocation] = useState({ lat: null, lng: null });
  const [eta, setEta] = useState('Calculating...');

  // --- NEW CHAT STATES ---
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  const chatEndRef = useRef(null);
  const currentCustomerId = "6a2c1a295ca7ff1dfef3dbcf"; // Mock sandbox user string

  // Scroll chats down automatically on incoming broadcast tokens
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 1. Fetch Booking and Historic Chat Logs
  useEffect(() => {
    if (!id) return;

    const syncCurrentBookingState = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/v1/bookings/${id}`).catch(() => null);
        if (response && response.data?.booking) {
          setBooking(response.data.booking);
          if (response.data.booking.workerId?.location?.coordinates) {
            setWorkerLocation({
              lng: response.data.booking.workerId.location.coordinates[0],
              lat: response.data.booking.workerId.location.coordinates[1]
            });
          }
        } else {
          setBooking({ _id: id, serviceType: "Carpenter", customerAddress: "101, Tiwari Ganj, Lucknow", amount: 250, status: "pending" });
        }

        // FETCH MOUNTED CHAT LOG HISTORIES FROM BACKEND PERSISTENCE
        const chatRes = await axios.get(`http://localhost:5000/api/v1/bookings/chats/${id}`).catch(() => null);
        if (chatRes && chatRes.data?.success) {
          setMessages(chatRes.data.messages);
        }
      } catch (err) {
        console.error("Hydration sync error.");
      } finally {
        setLoading(false);
      }
    };

    syncCurrentBookingState();
  }, [id]);

  // 2. Network Handshaking WebSocket bindings
  useEffect(() => {
    if (!id) return;

    socket = io('http://localhost:5000');

    socket.on('connect', () => {
      socket.emit('join_booking_room', { bookingId: id });
    });

    socket.on('booking:accepted', () => {
      setBooking(prev => prev ? { ...prev, status: 'accepted' } : null);
    });

    socket.on('location:broadcast', (telemetryData) => {
      setWorkerLocation({ lat: parseFloat(telemetryData.lat), lng: parseFloat(telemetryData.lng) });
      if (telemetryData.eta) setEta(telemetryData.eta);
    });

    // LISTENER FOR INCOMING MESSAGE CHANNELS BROADCAST PUSH PACKETS
    socket.on('chat:message_broadcast', (msgPacket) => {
      setMessages(prev => [...prev, msgPacket]);
    });

    socket.on('booking:completed', () => {
      setBooking(prev => prev ? { ...prev, status: 'completed' } : null);
      setTimeout(() => { router.push(`/payment/${id}?amount=${booking?.amount || 250}`); }, 1500);
    });

    return () => { if (socket) socket.disconnect(); };
  }, [id, booking?.amount]);

  // 3. Emit Message Function Trigger Setup
  const sendChatMessage = (e) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    socket.emit('chat:message', {
      bookingId: id,
      senderId: currentCustomerId,
      senderModel: 'User',
      message: typedMessage
    });
    setTypedMessage('');
  };

  if (loading || !booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-sans">
        <p className="animate-pulse tracking-wide font-medium">📡 Calibrating real-time telemetry pipelines...</p>
      </div>
    );
  }

  const polylinePath = workerLocation.lat ? [[workerLocation.lat, workerLocation.lng], customerLocation] : [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 p-4 flex items-center justify-center">
      <LeafletStyles />
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-6xl w-full overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[700px]">
        
        {/* LEFT STATUS TRACKER AND CHAT AREA */}
        <div className="md:col-span-1 flex flex-col h-full bg-slate-50/50">
          <div className="bg-slate-900 text-white p-4 relative">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">ID: {id?.slice(-6)}</span>
            <h1 className="text-xl font-black mt-0.5">Live Console Matrix</h1>
            <span className="absolute top-4 right-4 px-2 py-0.5 text-[10px] font-mono rounded-full bg-blue-100 text-blue-700 font-bold uppercase">{booking.status}</span>
          </div>

          {/* DYNAMIC CHAT AREA HOOKED CONTAINER PANEL */}
          <div className="flex-1 p-4 flex flex-col min-h-0 bg-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 border-b pb-1">💬 Active In-App Chat Room</h3>
            
            {/* Message Thread Viewer Grid */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {messages.length === 0 ? (
                <p className="text-center text-slate-400 italic pt-8 font-mono">No network message trace found. Say Hi to Sarthi!</p>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={`flex flex-col ${m.senderModel === 'User' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-2.5 rounded-2xl max-w-[80%] leading-relaxed ${
                      m.senderModel === 'User' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'
                    }`}>
                      {m.message}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5 px-1 font-mono">
                      {m.senderModel === 'User' ? 'You' : 'Sarthi'}
                    </span>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Trigger Operations Controls Row */}
            <form onSubmit={sendChatMessage} className="mt-3 flex gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                placeholder="Type message text payload here..."
                className="flex-1 bg-slate-50 text-xs rounded-xl px-3 py-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button type="submit" className="bg-slate-900 text-white font-bold text-xs px-4 rounded-xl hover:bg-slate-800 transition-colors">
                Send
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT FULL-SCALE GEOSPATIAL MAP VIEWPORT CONTAINER */}
        <div className="md:col-span-2 relative bg-slate-100 h-full">
          {typeof window !== 'undefined' ? (
            <MapContainer center={workerLocation.lat ? [workerLocation.lat, workerLocation.lng] : customerLocation} zoom={14} style={{ width: '100%', height: '100%', zIndex: 1 }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={customerLocation}></Marker>
              {workerLocation.lat && (
                <>
                  <Marker position={[workerLocation.lat, workerLocation.lng]}></Marker>
                  <Polyline positions={polylinePath} color="#2563eb" weight={4} dashArray="5, 10" />
                  <ChangeMapView center={[workerLocation.lat, workerLocation.lng]} />
                </>
              )}
            </MapContainer>
          ) : null}
        </div>

      </div>
    </div>
  );
}
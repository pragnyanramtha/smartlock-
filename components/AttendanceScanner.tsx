import React, { useRef, useEffect, useState } from 'react';
import { createFaceMatcher, detectFaces } from '../services/faceService';
import { saveAttendance, getUsers } from '../services/storageService';
import { CheckCircle2, Scan } from 'lucide-react';
import { Loader } from './Loader';

export const AttendanceScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [lastDetected, setLastDetected] = useState<{name: string, time: number} | null>(null);
  const [matcher, setMatcher] = useState<any>(null);
  const loopRef = useRef<number>(0);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const users = getUsers();
        setActiveUsersCount(users.length);
        
        if (users.length > 0) {
            const faceMatcher = await createFaceMatcher();
            setMatcher(faceMatcher);
            
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: {} });
            setStream(mediaStream);
        }
        
        setIsInitializing(false);
      } catch (e) {
        console.error("Initialization failed", e);
        setIsInitializing(false);
      }
    };
    init();

    return () => {
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
    };
  }, []);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
        }
    };
  }, [stream]);

  // Attach stream to video when elements are ready
  useEffect(() => {
    if (!isInitializing && activeUsersCount > 0 && videoRef.current && stream) {
        videoRef.current.srcObject = stream;
    }
  }, [isInitializing, activeUsersCount, stream]);

  const handleVideoPlay = () => {
    const loop = async () => {
      if (!videoRef.current || !canvasRef.current || !matcher) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const faceapi = window.faceapi;

      if (video.paused || video.ended || video.videoWidth === 0 || video.videoHeight === 0) {
          return setTimeout(() => loop(), 100);
      }

      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      
      // Ensure canvas matches video dimensions
      if (canvas.width !== displaySize.width || canvas.height !== displaySize.height) {
          faceapi.matchDimensions(canvas, displaySize);
      }

      try {
        const detections = await detectFaces(video);
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        // Clear canvas
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);

        if (resizedDetections.length > 0) {
            resizedDetections.forEach((detection: any) => {
            const { descriptor } = detection;
            const match = matcher.findBestMatch(descriptor);
            
            const box = detection.detection.box;
            const drawBox = new faceapi.draw.DrawBox(box, { 
                label: match.toString(),
                boxColor: match.label === 'unknown' ? '#ef4444' : '#22c55e',
                lineWidth: 2
            });
            drawBox.draw(canvas);

            if (match.label !== 'unknown') {
                const users = getUsers();
                const user = users.find((u) => u.id === match.label);
                if (user) {
                // Determine status based on time (Example: Late if after 9:00 AM)
                const now = new Date();
                const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 0);
                
                saveAttendance({
                    id: crypto.randomUUID(),
                    userId: user.id,
                    userName: user.name,
                    timestamp: Date.now(),
                    status: isLate ? 'Late' : 'On Time' // Simple logic
                });
                
                setLastDetected({ name: user.name, time: Date.now() });
                
                // Clear last detected after 3 seconds
                setTimeout(() => {
                    setLastDetected((prev) => (prev && prev.name === user.name && Date.now() - prev.time > 2000) ? null : prev);
                }, 3000);
                }
            }
            });
        }
      } catch (err) {
          console.error("Detection error:", err);
      }

      loopRef.current = requestAnimationFrame(loop);
    };

    loop();
  };

  if (isInitializing) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-900">
        <Loader text="Initializing Neural Networks..." />
      </div>
    );
  }

  if (activeUsersCount === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-8">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
            <Scan className="w-10 h-10 text-slate-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Database Empty</h2>
        <p className="text-slate-400 max-w-md">No users registered yet. Please go to the Registration page to add members before scanning.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-10"></div>
      
      <div className="flex justify-between items-end mb-6">
        <div>
            <h1 className="text-3xl font-bold text-white mb-1">Live Attendance</h1>
            <p className="text-indigo-400 flex items-center text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></span>
                System Active • Monitoring
            </p>
        </div>
        
        {lastDetected && (
            <div className="animate-in slide-in-from-right duration-500 bg-green-500/20 border border-green-500/30 px-6 py-3 rounded-xl flex items-center shadow-lg shadow-green-900/20 backdrop-blur-md">
                <CheckCircle2 className="w-6 h-6 text-green-400 mr-3" />
                <div>
                    <p className="text-green-300 text-xs uppercase tracking-wider font-bold">Checked In</p>
                    <p className="text-white font-bold text-lg">{lastDetected.name}</p>
                </div>
            </div>
        )}
      </div>

      <div className="relative flex-1 rounded-3xl overflow-hidden bg-black shadow-2xl border border-slate-800 group">
        <video
          ref={videoRef}
          onPlay={handleVideoPlay}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full transform scale-x-[-1]"
        />
        
        {/* Overlay Grid */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        <div className="absolute inset-0 border-[0.5px] border-white/5 pointer-events-none grid grid-cols-4 grid-rows-3"></div>
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <p className="text-slate-400 text-xs mb-1">Status</p>
            <p className="text-white font-mono">Running</p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <p className="text-slate-400 text-xs mb-1">Model Accuracy</p>
            <p className="text-indigo-400 font-mono">~98.5%</p>
        </div>
         <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <p className="text-slate-400 text-xs mb-1">Latency</p>
            <p className="text-green-400 font-mono">45ms</p>
        </div>
      </div>
    </div>
  );
};
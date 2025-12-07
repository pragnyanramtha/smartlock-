import React, { useRef, useState, useEffect } from 'react';
import { Camera, Check, RefreshCw, User, X } from 'lucide-react';
import { getFaceDescriptor, detectFaces } from '../services/faceService';
import { saveUser } from '../services/storageService';
import { User as UserType } from '../types';
import { Loader } from './Loader';

export const Registration: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    startVideo();
    return () => stopVideo();
  }, []);

  const startVideo = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError("Camera permission denied.");
    }
  };

  const stopVideo = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoRef.current || !name.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Small delay to ensure video is stable
      await new Promise(r => setTimeout(r, 500));
      
      const descriptor = await getFaceDescriptor(videoRef.current);

      if (descriptor) {
        const newUser: UserType = {
          id: crypto.randomUUID(),
          name: name.trim(),
          role: 'Member',
          descriptor: Array.from(descriptor), // Serialize Float32Array
          registeredAt: Date.now()
        };

        saveUser(newUser);
        setSuccess(`Successfully registered ${newUser.name}!`);
        setName('');
      } else {
        setError("No face detected. Please face the camera clearly.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to process face data. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 max-w-4xl mx-auto">
        <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">New Registration</h1>
            <p className="text-slate-400">Add new members to the attendance database.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            {/* Camera Feed */}
            <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800 aspect-[4/3] lg:aspect-auto lg:h-[500px]">
                 <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]" 
                />
                
                {/* Face Guide Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-80 border-2 border-indigo-500/50 rounded-full border-dashed"></div>
                </div>

                {loading && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10 backdrop-blur-sm">
                        <Loader text="Processing Face Data..." />
                    </div>
                )}
            </div>

            {/* Form */}
            <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 flex flex-col justify-center">
                <form onSubmit={handleRegister} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                                placeholder="John Doe"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center text-red-400 text-sm">
                            <X className="w-5 h-5 mr-3 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center text-green-400 text-sm">
                            <Check className="w-5 h-5 mr-3 flex-shrink-0" />
                            {success}
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading || !name}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center transition-all transform active:scale-95
                                ${!name || loading 
                                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40'
                                }`}
                        >
                            <Camera className="w-5 h-5 mr-2" />
                            Capture & Register
                        </button>
                    </div>
                </form>

                <div className="mt-8 pt-8 border-t border-slate-700 text-center text-slate-500 text-sm">
                    Ensure user is facing the camera directly with good lighting.
                </div>
            </div>
        </div>
    </div>
  );
};
import { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaStop, FaTrash, FaPaperPlane, FaPlay, FaPause } from 'react-icons/fa';
import { toast } from 'react-toastify';

const VoiceRecorder = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [audioUrl]);

  const visualizeAudio = (stream) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevel = () => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(Math.min(100, (average / 255) * 200));
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      }
    };

    updateLevel();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      visualizeAudio(stream);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        stream.getTracks().forEach(track => track.stop());
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob, duration);
    }
  };

  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    onCancel();
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-200 dark:border-slate-700 transform transition-all">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Voice Message
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isRecording ? 'Recording in progress...' : audioBlob ? 'Recording ready' : 'Ready to record'}
          </p>
        </div>

        {/* Main Recording Area */}
        <div className="flex flex-col items-center gap-6 mb-8">
          
          {/* Recording Visualization */}
          {isRecording && (
            <div className="relative">
              {/* Outer Pulse Rings */}
              <div className="absolute inset-0 -m-8">
                <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" 
                     style={{ animationDuration: '2s' }}></div>
                <div className="absolute inset-0 bg-red-500/10 rounded-full animate-ping" 
                     style={{ animationDuration: '3s' }}></div>
              </div>
              
              {/* Main Recording Circle */}
              <div className="relative w-32 h-32 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center shadow-2xl transform transition-all"
                   style={{ 
                     transform: `scale(${1 + audioLevel / 300})`,
                     boxShadow: `0 0 ${40 + audioLevel}px rgba(239, 68, 68, 0.5)`
                   }}>
                <FaMicrophone className="text-white text-4xl drop-shadow-lg" />
              </div>
              
              {/* Waveform Bars */}
              <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex gap-1 items-end h-8">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-gradient-to-t from-red-500 to-pink-500 rounded-full transition-all duration-150"
                    style={{
                      height: `${Math.max(8, (audioLevel * (0.5 + Math.random() * 0.5)) / 3)}px`,
                      opacity: 0.6 + (audioLevel / 200)
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Success State */}
          {audioBlob && !isRecording && (
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}

          {/* Initial State */}
          {!isRecording && !audioBlob && (
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-transform cursor-pointer"
                 onClick={startRecording}>
              <FaMicrophone className="text-white text-4xl" />
            </div>
          )}

          {/* Duration Display */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent font-mono tracking-wider">
              {formatDuration(duration)}
            </div>
            {isRecording && (
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )}
          </div>

          {/* Audio Playback */}
          {audioUrl && !isRecording && (
            <div className="w-full">
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
              <button
                onClick={togglePlayback}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg font-medium"
              >
                {isPlaying ? (
                  <>
                    <FaPause className="text-lg" />
                    <span>Pause Recording</span>
                  </>
                ) : (
                  <>
                    <FaPlay className="text-lg" />
                    <span>Play Recording</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isRecording && !audioBlob && (
            <>
              <button
                onClick={startRecording}
                className="flex-1 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg font-medium"
              >
                <FaMicrophone className="text-lg" />
                <span>Start Recording</span>
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-4 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] font-medium"
              >
                Cancel
              </button>
            </>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="flex-1 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg font-medium"
            >
              <FaStop className="text-lg" />
              <span>Stop Recording</span>
            </button>
          )}

          {audioBlob && !isRecording && (
            <>
              <button
                onClick={handleSend}
                className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg font-medium"
              >
                <FaPaperPlane className="text-lg" />
                <span>Send</span>
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 py-4 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg font-medium"
              >
                <FaTrash className="text-lg" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorder;

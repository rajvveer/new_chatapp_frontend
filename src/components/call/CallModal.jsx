import { useState, useEffect, useRef } from 'react';
import { FaPhone, FaVideo, FaTimes, FaMicrophone, FaMicrophoneSlash, FaVideoSlash } from 'react-icons/fa';
import SimplePeer from 'simple-peer';

const CallModal = ({ isOpen, onClose, callType, otherUser, isIncoming = false, socket, conversationId }) => {
  const [callStatus, setCallStatus] = useState(isIncoming ? 'incoming' : 'connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const [stream, setStream] = useState(null);
  
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerRef = useRef();
  const ringtoneRef = useRef(new Audio('/sounds/ringtone.mp3')); // Add ringtone

  // Play ringtone for incoming calls
  useEffect(() => {
    if (isOpen && callStatus === 'incoming') {
      ringtoneRef.current.loop = true;
      ringtoneRef.current.play().catch(err => console.error('Ringtone play error:', err));
    }

    return () => {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    };
  }, [isOpen, callStatus]);

  // Stop ringtone when call status changes
  useEffect(() => {
    if (callStatus !== 'incoming') {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  }, [callStatus]);

  // Get user media
  useEffect(() => {
    if (!isOpen) return;

    const getMedia = async () => {
      try {
        const constraints = {
          audio: true,
          video: callType === 'video',
        };
        
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
        
        if (localVideoRef.current && callType === 'video') {
          localVideoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
        alert('Failed to access microphone/camera. Please allow permissions.');
      }
    };

    getMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, callType]);

  // WebRTC signal handling
  useEffect(() => {
    if (!socket || !stream) return;

    const handleSignal = ({ signal, from }) => {
      if (from === otherUser._id) {
        if (!peerRef.current) {
          createPeer(false, signal);
        } else {
          peerRef.current.signal(signal);
        }
      }
    };

    socket.on('webrtc:signal', handleSignal);

    return () => {
      socket.off('webrtc:signal', handleSignal);
    };
  }, [socket, stream, otherUser]);

  const createPeer = (initiator, signal = null) => {
    const peer = new SimplePeer({
      initiator,
      trickle: false,
      stream,
    });

    peer.on('signal', (data) => {
      socket.emit('webrtc:signal', {
        signal: data,
        to: otherUser._id,
        from: socket.userId,
        conversationId,
      });
    });

    peer.on('stream', (remoteStream) => {
      console.log('📡 Received remote stream');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
    });

    if (signal) {
      peer.signal(signal);
    }

    peerRef.current = peer;
  };

  useEffect(() => {
    if (!socket) return;

    const handleCallAccepted = () => {
      console.log('✅ Call accepted - establishing WebRTC connection');
      setCallStatus('connected');
      
      if (!isIncoming && stream) {
        createPeer(true);
      }
    };

    socket.on('call:accepted', handleCallAccepted);

    return () => {
      socket.off('call:accepted', handleCallAccepted);
    };
  }, [socket, isIncoming, stream]);

  useEffect(() => {
    if (callStatus === 'connected') {
      const timer = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [callStatus]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAccept = () => {
    console.log('📞 Accepting call...');
    setCallStatus('connected');
    ringtoneRef.current.pause(); // Stop ringtone
    
    if (socket && conversationId) {
      socket.emit('call:accept', {
        conversationId,
        callerId: otherUser._id,
      });
      
      if (stream) {
        createPeer(false);
      }
    }
  };

  const handleReject = () => {
    console.log('❌ Rejecting/Ending call...');
    ringtoneRef.current.pause(); // Stop ringtone
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    
    if (socket && conversationId) {
      if (isIncoming && callStatus === 'incoming') {
        socket.emit('call:reject', {
          conversationId,
          callerId: otherUser._id,
        });
      } else {
        socket.emit('call:end', {
          conversationId,
        });
      }
    }
    onClose();
  };

  const toggleMute = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (stream && callType === 'video') {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-scale-in">
        {/* Video containers */}
        {callType === 'video' && callStatus === 'connected' && (
          <div className="relative bg-black aspect-video">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="absolute bottom-4 right-4 w-32 h-24 rounded-lg border-2 border-white shadow-lg object-cover"
            />
          </div>
        )}

        {/* Call Header */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 text-white text-center relative">
          {/* Ringing animation for incoming calls */}
          {callStatus === 'incoming' && (
            <div className="absolute top-4 left-4 flex gap-1">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}

          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              callStatus === 'connected' ? 'bg-green-500' : 
              callStatus === 'incoming' ? 'bg-yellow-500 animate-pulse' : 'bg-blue-400'
            }`}>
              {callStatus === 'incoming' ? '📞 Incoming' : 
               callStatus === 'connecting' ? 'Connecting' : 'Connected'}
            </span>
          </div>

          <img
            src={otherUser?.avatar}
            alt={otherUser?.username}
            className={`w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-lg ${
              callStatus === 'incoming' ? 'animate-pulse' : ''
            }`}
          />
          <h2 className="text-2xl font-bold mb-2">{otherUser?.username}</h2>
          <p className="text-blue-100 flex items-center justify-center gap-2">
            {callType === 'video' ? <FaVideo /> : <FaPhone />}
            <span>
              {callStatus === 'incoming' && 'Incoming call...'}
              {callStatus === 'connecting' && 'Connecting...'}
              {callStatus === 'connected' && formatDuration(duration)}
            </span>
          </p>
        </div>

        {/* Call Controls */}
        <div className="p-6 bg-white dark:bg-slate-800">
          <div className="flex items-center justify-center gap-4">
            {callStatus === 'incoming' ? (
              <>
                <button
                  onClick={handleAccept}
                  className="p-4 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 animate-pulse"
                  title="Accept Call"
                >
                  {callType === 'video' ? <FaVideo size={24} /> : <FaPhone size={24} />}
                </button>
                <button
                  onClick={handleReject}
                  className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all hover:scale-110 active:scale-95"
                  title="Reject Call"
                >
                  <FaTimes size={24} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={toggleMute}
                  className={`p-3 ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white'} hover:opacity-80 rounded-full transition-all`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
                </button>

                {callType === 'video' && (
                  <button
                    onClick={toggleVideo}
                    className={`p-3 ${isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white'} hover:opacity-80 rounded-full transition-all`}
                    title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
                  >
                    {isVideoOff ? <FaVideoSlash size={20} /> : <FaVideo size={20} />}
                  </button>
                )}

                <button
                  onClick={handleReject}
                  className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all hover:scale-110 active:scale-95"
                  title="End Call"
                >
                  <FaTimes size={24} />
                </button>
              </>
            )}
          </div>
        </div>

        {callType === 'voice' && (
          <audio ref={remoteVideoRef} autoPlay />
        )}
      </div>
    </div>
  );
};

export default CallModal;

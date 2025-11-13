import { useEffect, useRef, useState, useCallback } from "react";
import { useWebSocket } from "./use-websocket";

interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

const defaultConfig: WebRTCConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export interface Call {
  id: string;
  recipientId: string;
  isVideo: boolean;
  status: "initiating" | "ringing" | "active" | "ended";
}

export function useWebRTC() {
  const { sendWebRTCSignal, sendCallAction, ws } = useWebSocket();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingSignalsRef = useRef<Array<{ type: string; data: any }>>([]);

  const cleanup = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    setCurrentCall(null);
  }, [localStream]);

  const createPeerConnection = useCallback((callId: string) => {
    const pc = new RTCPeerConnection(defaultConfig);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendWebRTCSignal({
          callId,
          type: "ice-candidate",
          data: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        cleanup();
      }
    };

    return pc;
  }, [sendWebRTCSignal, cleanup]);

  const startCall = useCallback(async (recipientId: string, isVideo: boolean) => {
    try {
      const callId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });
      
      setLocalStream(stream);
      setCurrentCall({
        id: callId,
        recipientId,
        isVideo,
        status: "initiating",
      });

      const pc = createPeerConnection(callId);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      sendWebRTCSignal({
        callId,
        type: "offer",
        data: offer,
      });

      sendCallAction({
        callId,
        action: "ring",
      });

      setCurrentCall(prev => prev ? { ...prev, status: "ringing" } : null);
    } catch (error) {
      console.error("Failed to start call:", error);
      cleanup();
      throw error;
    }
  }, [createPeerConnection, sendWebRTCSignal, sendCallAction, cleanup]);

  const answerCall = useCallback(async (callId: string, offer: RTCSessionDescriptionInit, isVideo: boolean, recipientId: string) => {
    try {
      setCurrentCall({
        id: callId,
        recipientId,
        isVideo,
        status: "initiating",
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });

      setLocalStream(stream);

      const pc = createPeerConnection(callId);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendWebRTCSignal({
        callId,
        type: "answer",
        data: answer,
      });

      sendCallAction({
        callId,
        action: "answer",
      });

      setCurrentCall({
        id: callId,
        recipientId,
        isVideo,
        status: "active",
      });
    } catch (error) {
      console.error("Failed to answer call:", error);
      cleanup();
      throw error;
    }
  }, [createPeerConnection, sendWebRTCSignal, sendCallAction, cleanup]);

  const endCall = useCallback(() => {
    if (currentCall) {
      sendCallAction({
        callId: currentCall.id,
        action: "end",
      });
    }
    cleanup();
  }, [currentCall, sendCallAction, cleanup]);

  const rejectCall = useCallback((callId: string) => {
    sendCallAction({
      callId,
      action: "reject",
    });
  }, [sendCallAction]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }, [localStream]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }, [localStream]);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "webrtc-signal") {
          const { payload } = message;
          
          if (peerConnectionRef.current) {
            if (payload.type === "answer") {
              peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription(payload.data)
              );
              setCurrentCall(prev => prev ? { ...prev, status: "active" } : null);
            } else if (payload.type === "ice-candidate") {
              peerConnectionRef.current.addIceCandidate(
                new RTCIceCandidate(payload.data)
              );
            }
          } else {
            pendingSignalsRef.current.push({ type: payload.type, data: payload.data });
          }
        } else if (message.type === "call-action") {
          const { payload } = message;
          
          if (payload.action === "answer") {
            setCurrentCall(prev => prev ? { ...prev, status: "active" } : null);
          } else if (payload.action === "reject") {
            cleanup();
          } else if (payload.action === "end") {
            cleanup();
          }
        }
      } catch (error) {
        console.error("Failed to handle WebRTC message:", error);
      }
    };

    ws.addEventListener("message", handleMessage);

    return () => {
      ws.removeEventListener("message", handleMessage);
    };
  }, [ws, cleanup]);

  useEffect(() => {
    if (peerConnectionRef.current && pendingSignalsRef.current.length > 0) {
      const signals = [...pendingSignalsRef.current];
      pendingSignalsRef.current = [];
      
      signals.forEach(({ type, data }) => {
        if (type === "answer") {
          peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(data));
        } else if (type === "ice-candidate") {
          peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    }
  }, [peerConnectionRef.current]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    localStream,
    remoteStream,
    currentCall,
    startCall,
    answerCall,
    endCall,
    rejectCall,
    toggleVideo,
    toggleAudio,
  };
}

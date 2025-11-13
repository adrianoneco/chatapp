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
  recipientName?: string;
  isVideo: boolean;
  status: "initiating" | "ringing" | "active" | "ended";
}

export interface IncomingCall {
  callId: string;
  callerId: string;
  callerName?: string;
  isVideo: boolean;
  offer: RTCSessionDescriptionInit;
}

export function useWebRTC() {
  const { sendWebRTCSignal, sendCallAction, ws } = useWebSocket();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingSignalsRef = useRef<Array<{ type: string; data: any }>>([]);
  const outgoingRingtoneRef = useRef<HTMLAudioElement | null>(null);
  const incomingRingtoneRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // TODO: Add ringtone files to public/ folder
    // outgoingRingtoneRef.current = new Audio("/ringtone-outgoing.mp3");
    // outgoingRingtoneRef.current.loop = true;
    // incomingRingtoneRef.current = new Audio("/ringtone-incoming.mp3");
    // incomingRingtoneRef.current.loop = true;

    return () => {
      outgoingRingtoneRef.current?.pause();
      incomingRingtoneRef.current?.pause();
    };
  }, []);

  const playOutgoingRingtone = useCallback(() => {
    outgoingRingtoneRef.current?.play().catch(err => 
      console.error("Failed to play outgoing ringtone:", err)
    );
  }, []);

  const stopOutgoingRingtone = useCallback(() => {
    if (outgoingRingtoneRef.current) {
      outgoingRingtoneRef.current.pause();
      outgoingRingtoneRef.current.currentTime = 0;
    }
  }, []);

  const playIncomingRingtone = useCallback(() => {
    incomingRingtoneRef.current?.play().catch(err =>
      console.error("Failed to play incoming ringtone:", err)
    );
  }, []);

  const stopIncomingRingtone = useCallback(() => {
    if (incomingRingtoneRef.current) {
      incomingRingtoneRef.current.pause();
      incomingRingtoneRef.current.currentTime = 0;
    }
  }, []);

  const checkMediaPermissions = useCallback(async (isVideo: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error("Media permissions denied:", error);
      return false;
    }
  }, []);

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
    setIncomingCall(null);
    stopOutgoingRingtone();
    stopIncomingRingtone();
  }, [localStream, stopOutgoingRingtone, stopIncomingRingtone]);

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

  const startCall = useCallback(async (recipientId: string, recipientName: string, isVideo: boolean) => {
    try {
      const hasPermissions = await checkMediaPermissions(isVideo);
      if (!hasPermissions) {
        throw new Error("Permissões de mídia negadas");
      }

      const callId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });
      
      setLocalStream(stream);
      setCurrentCall({
        id: callId,
        recipientId,
        recipientName,
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

      setCurrentCall({
        id: callId,
        recipientId,
        recipientName,
        isVideo,
        status: "ringing",
      });
      playOutgoingRingtone();
    } catch (error) {
      console.error("Failed to start call:", error);
      cleanup();
      throw error;
    }
  }, [createPeerConnection, sendWebRTCSignal, sendCallAction, checkMediaPermissions, playOutgoingRingtone, cleanup]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      stopIncomingRingtone();

      const hasPermissions = await checkMediaPermissions(incomingCall.isVideo);
      if (!hasPermissions) {
        throw new Error("Permissões de mídia negadas");
      }

      setCurrentCall({
        id: incomingCall.callId,
        recipientId: incomingCall.callerId,
        recipientName: incomingCall.callerName,
        isVideo: incomingCall.isVideo,
        status: "initiating",
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.isVideo,
      });

      setLocalStream(stream);

      const pc = createPeerConnection(incomingCall.callId);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendWebRTCSignal({
        callId: incomingCall.callId,
        type: "answer",
        data: answer,
      });

      sendCallAction({
        callId: incomingCall.callId,
        action: "answer",
      });

      setCurrentCall({
        id: incomingCall.callId,
        recipientId: incomingCall.callerId,
        recipientName: incomingCall.callerName,
        isVideo: incomingCall.isVideo,
        status: "active",
      });

      setIncomingCall(null);
    } catch (error) {
      console.error("Failed to accept call:", error);
      
      sendCallAction({
        callId: incomingCall.callId,
        action: "reject",
      });
      
      cleanup();
      throw error;
    }
  }, [incomingCall, createPeerConnection, sendWebRTCSignal, sendCallAction, checkMediaPermissions, stopIncomingRingtone, cleanup]);

  const rejectCall = useCallback(() => {
    if (!incomingCall) return;

    sendCallAction({
      callId: incomingCall.callId,
      action: "reject",
    });

    stopIncomingRingtone();
    setIncomingCall(null);
  }, [incomingCall, sendCallAction, stopIncomingRingtone]);

  const endCall = useCallback(() => {
    if (currentCall) {
      sendCallAction({
        callId: currentCall.id,
        action: "end",
      });
    }
    cleanup();
  }, [currentCall, sendCallAction, cleanup]);

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
          
          if (payload.type === "offer") {
            // Ignore if already in a call
            if (currentCall || incomingCall) return;

            setIncomingCall({
              callId: payload.callId,
              callerId: payload.from,
              callerName: payload.callerName,
              isVideo: payload.isVideo || false,
              offer: payload.data,
            });
            playIncomingRingtone();
          } else if (peerConnectionRef.current) {
            if (payload.type === "answer") {
              peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription(payload.data)
              );
              if (currentCall) {
                setCurrentCall({ ...currentCall, status: "active" });
              }
              stopOutgoingRingtone();
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
            if (currentCall) {
              setCurrentCall({ ...currentCall, status: "active" });
            }
            stopOutgoingRingtone();
          } else if (payload.action === "reject") {
            stopOutgoingRingtone();
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
  }, [ws, currentCall, incomingCall, playIncomingRingtone, stopOutgoingRingtone, cleanup]);

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
    incomingCall,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio,
  };
}

// useVoice hook — manages voice recording, STT, and TTS playback
import { useState, useCallback, useRef } from 'react';
import {
    checkMicrophoneAccess,
    createRecorder,
    processVoiceMessage,
    playAudio,
    type VoiceState,
} from '@/services/voiceService';
import type { VoiceResponse } from '@/types/ai';

interface UseVoiceOptions {
    storeId: string;
    sessionId: string;
    conversationId?: string;
    onTranscript?: (transcript: string) => void;
    onResponse?: (response: VoiceResponse) => void;
    onError?: (error: Error) => void;
}

export const useVoice = ({
    storeId,
    sessionId,
    conversationId,
    onTranscript,
    onResponse,
    onError,
}: UseVoiceOptions) => {
    const [state, setState] = useState<VoiceState>('idle');
    const [hasMicAccess, setHasMicAccess] = useState<boolean | null>(null);
    const [transcript, setTranscript] = useState('');
    const [aiResponse, setAiResponse] = useState('');

    const recorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const checkAccess = useCallback(async () => {
        const hasAccess = await checkMicrophoneAccess();
        setHasMicAccess(hasAccess);
        return hasAccess;
    }, []);

    const startRecording = useCallback(async () => {
        try {
            if (hasMicAccess === null) {
                const hasAccess = await checkAccess();
                if (!hasAccess) {
                    onError?.(new Error('Microphone access denied'));
                    return;
                }
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const recorder = createRecorder(stream, async (audioBlob) => {
                setState('processing');
                setTranscript('');
                setAiResponse('');

                try {
                    const response = await processVoiceMessage({
                        store_id: storeId,
                        session_id: sessionId,
                        audio_blob: audioBlob,
                        conversation_id: conversationId,
                    });

                    setTranscript(response.transcript);
                    onTranscript?.(response.transcript);

                    if (response.confidence < 0.7) {
                        setAiResponse("I didn't catch that — could you repeat or type your question?");
                        setState('idle');
                        return;
                    }

                    setAiResponse(response.ai_response);
                    onResponse?.(response);

                    // Play audio response if available
                    if (response.audio_url) {
                        setState('speaking');
                        try {
                            await playAudio(response.audio_url);
                        } catch {
                            // Audio playback failed, text response still shown
                        }
                    }

                    setState('idle');
                } catch (error) {
                    const err = error instanceof Error ? error : new Error('Voice processing failed');
                    onError?.(err);
                    setState('error');
                    setTimeout(() => setState('idle'), 3000);
                }
            });

            recorderRef.current = recorder;
            recorder.start();
            setState('listening');
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Failed to start recording');
            onError?.(err);
            setState('error');
        }
    }, [storeId, sessionId, conversationId, hasMicAccess, checkAccess, onTranscript, onResponse, onError]);

    const stopRecording = useCallback(() => {
        if (recorderRef.current && recorderRef.current.state === 'recording') {
            recorderRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    }, []);

    return {
        state,
        hasMicAccess,
        transcript,
        aiResponse,
        startRecording,
        stopRecording,
        checkAccess,
    };
};

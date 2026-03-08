// Voice service — MediaRecorder, STT transcription, and TTS playback
import type { VoiceRequest, VoiceResponse } from '@/types/ai';

const N8N_VOICE_WEBHOOK = import.meta.env.VITE_N8N_VOICE_WEBHOOK_URL || '';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

/**
 * Check if microphone access is available.
 */
export async function checkMicrophoneAccess(): Promise<boolean> {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        return true;
    } catch {
        return false;
    }
}

/**
 * Create a MediaRecorder instance for audio capture.
 */
export function createRecorder(
    stream: MediaStream,
    onDataAvailable: (blob: Blob) => void
): MediaRecorder {
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            chunks.push(event.data);
        }
    };

    recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: mimeType });
        onDataAvailable(audioBlob);
        chunks.length = 0;
    };

    return recorder;
}

/**
 * Send audio to the voice processing pipeline (n8n).
 * Pipeline: Audio → STT → Chat Pipeline → TTS → Audio response
 */
export async function processVoiceMessage(request: VoiceRequest): Promise<VoiceResponse> {
    const formData = new FormData();
    formData.append('audio', request.audio_blob, 'recording.webm');
    formData.append('store_id', request.store_id);
    formData.append('session_id', request.session_id);
    if (request.conversation_id) {
        formData.append('conversation_id', request.conversation_id);
    }

    const response = await fetch(N8N_VOICE_WEBHOOK, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Voice processing failed: ${response.status}`);
    }

    const data = await response.json();
    return {
        transcript: data.transcript || '',
        ai_response: data.ai_response || data.message || '',
        audio_url: data.audio_url || null,
        conversation_id: data.conversation_id || '',
        confidence: data.confidence || 0,
    };
}

/**
 * Play an audio response from a URL.
 */
export function playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const audio = new Audio(audioUrl);
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error('Audio playback failed'));
        audio.play().catch(reject);
    });
}

/**
 * Play audio from a Blob (for inline TTS responses).
 */
export function playAudioBlob(blob: Blob): Promise<void> {
    const url = URL.createObjectURL(blob);
    return playAudio(url).finally(() => URL.revokeObjectURL(url));
}

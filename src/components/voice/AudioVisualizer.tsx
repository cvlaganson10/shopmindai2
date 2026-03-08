import { useRef, useEffect, useMemo } from "react";

interface AudioVisualizerProps {
    stream: MediaStream | null;
    isActive: boolean;
    color?: string;
    size?: number;
}

const AudioVisualizer = ({ stream, isActive, color = "#6366F1", size = 120 }: AudioVisualizerProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const analyserRef = useRef<AnalyserNode | null>(null);

    useEffect(() => {
        if (!stream || !isActive || !canvasRef.current) {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            return;
        }

        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, size, size);

            const centerX = size / 2;
            const centerY = size / 2;
            const baseRadius = size * 0.25;

            // Draw audio-reactive circle
            const avgVolume = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
            const scale = 1 + (avgVolume / 255) * 0.4;

            ctx.beginPath();
            ctx.arc(centerX, centerY, baseRadius * scale, 0, Math.PI * 2);
            ctx.fillStyle = color + "20";
            ctx.fill();

            ctx.beginPath();
            ctx.arc(centerX, centerY, baseRadius * scale * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = color + "40";
            ctx.fill();

            ctx.beginPath();
            ctx.arc(centerX, centerY, baseRadius * scale * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = color + "80";
            ctx.fill();
        };

        draw();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            audioContext.close();
        };
    }, [stream, isActive, color, size]);

    return (
        <div className="flex items-center justify-center">
            <canvas
                ref={canvasRef}
                width={size}
                height={size}
                className="rounded-full"
                style={{ width: size, height: size }}
            />
        </div>
    );
};

export default AudioVisualizer;

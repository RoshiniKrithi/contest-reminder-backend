import { useRef, useState, MouseEvent, ReactNode } from "react";

interface TiltCardProps {
    children: ReactNode;
    className?: string;
    glowColor?: string;
    maxTilt?: number;
}

export function TiltCard({
    children,
    className = "",
    glowColor = "rgba(59, 130, 246, 0.5)", // blue-500 with opacity
    maxTilt = 10
}: TiltCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState("");
    const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const card = cardRef.current;
        const rect = card.getBoundingClientRect();

        // Calculate mouse position relative to card center
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Calculate rotation angles
        const rotateX = ((y - centerY) / centerY) * -maxTilt;
        const rotateY = ((x - centerX) / centerX) * maxTilt;

        // Calculate glow position as percentage
        const glowX = (x / rect.width) * 100;
        const glowY = (y / rect.height) * 100;

        setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
        setGlowPosition({ x: glowX, y: glowY });
    };

    const handleMouseLeave = () => {
        setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
        setGlowPosition({ x: 50, y: 50 });
    };

    return (
        <div
            ref={cardRef}
            className={`relative transition-all duration-300 ease-out ${className}`}
            style={{
                transform,
                transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Glow effect overlay */}
            <div
                className="absolute inset-0 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                    background: `radial-gradient(circle 200px at ${glowPosition.x}% ${glowPosition.y}%, ${glowColor}, transparent)`,
                    zIndex: 1,
                }}
            />

            {/* Card content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}

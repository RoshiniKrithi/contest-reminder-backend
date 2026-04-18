import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface MagneticElementProps {
    children: React.ReactNode;
    strength?: number; // How strong the magnetic pull is (0-1)
    className?: string;
}

export default function MagneticElement({
    children,
    strength = 0.3,
    className = ""
}: MagneticElementProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Motion values for smooth animation
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Spring configuration for smooth, natural movement
    const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate distance from center
        const distanceX = e.clientX - centerX;
        const distanceY = e.clientY - centerY;

        // Apply magnetic pull with strength multiplier (max 15px movement)
        const maxDistance = 15;
        x.set(Math.max(-maxDistance, Math.min(maxDistance, distanceX * strength)));
        y.set(Math.max(-maxDistance, Math.min(maxDistance, distanceY * strength)));
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        x.set(0);
        y.set(0);
    };

    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                x: springX,
                y: springY,
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

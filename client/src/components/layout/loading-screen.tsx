import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const LoadingScreen = ({ onLoadingComplete }: { onLoadingComplete: () => void }) => {
    const [isVisible, setIsVisible] = useState(true);
    const text = "CODE ARENA";
    const letters = text.split("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 2500); // Adjust duration as needed

        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence onExitComplete={onLoadingComplete}>
            {isVisible && (
                <motion.div
                    key="loader"
                    initial={{ opacity: 1 }}
                    exit={{
                        y: "-100%",
                        transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] }
                    }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900"
                >
                    <div className="overflow-hidden flex">
                        {letters.map((letter, index) => (
                            <motion.span
                                key={index}
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                transition={{
                                    duration: 0.8,
                                    delay: index * 0.05,
                                    ease: [0.33, 1, 0.68, 1],
                                }}
                                className="text-6xl md:text-8xl font-bold text-white inline-block px-1"
                                style={{ fontFamily: "'Inter', sans-serif" }}
                            >
                                {letter === " " ? "\u00A0" : letter}
                            </motion.span>
                        ))}
                    </div>

                    {/* Subtle background wipe effect */}
                    <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 0 }}
                        exit={{ scaleY: 1 }}
                        transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                        className="absolute inset-0 bg-primary/10 origin-bottom"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LoadingScreen;

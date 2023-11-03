import React from "react";
import { motion } from "framer-motion";
import { FaSkull } from "react-icons/fa";

const Loader: React.FC = () => {
  return (
    <>
      <div className="fixed left-1/2 right-1/2 bottom-[20%] flex flex-row items-center justify-center">
        <motion.span
          className=" w-4 h-4 text-red-700 mb-2 mr-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 1,
            yoyo: Infinity,
            ease: "easeInOut",
          }}
        >
          <FaSkull size={24} />
        </motion.span>
        <span className="text-red-700" style={{ fontFamily: "Die" }}>
          Connecting...
        </span>
      </div>
      <audio autoPlay src="assets/sounds/bgm.mp3" />
      <audio autoPlay src="assets/sounds/heartbeat.mp3" />
    </>
  );
};

export default Loader;

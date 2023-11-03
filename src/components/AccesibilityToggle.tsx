import React, { useState } from "react";
import { FaFont } from "react-icons/fa";
import { motion } from "framer-motion";

const AccessibilityToggle = () => {
  const [isSansMode, setIsSansMode] = useState(false);

  const toggleAccessibilityMode = () => {
    setIsSansMode((prevMode) => !prevMode);

    // Toggle the font family based on the current mode
    document.body.style.fontFamily = isSansMode ? "" : "sans-serif";
  };

  return (
    <motion.button
      onClick={toggleAccessibilityMode}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {isSansMode ? (
        <FaFont className="text-red-800 text-2xl rounded-full bg-red-950" />
      ) : (
        <FaFont className="text-red-800 text-2xl" />
      )}
    </motion.button>
  );
};

export default AccessibilityToggle;

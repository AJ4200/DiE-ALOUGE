import { FC, ReactNode, MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const ChatModal: FC<ChatModalProps> = ({ isOpen, onClose, children }) => {
  const handleContentClick = (e: MouseEvent<HTMLDivElement>) => {
    // Stop the click event propagation to prevent closing the modal
    e.stopPropagation();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex text-black items-center justify-center jankyborder"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="fixed inset-0 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            style={{ pointerEvents: "auto" }}
          />

          <motion.div
            className="bg-white p-6 rounded-md relative"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleContentClick}
          >
            <div
              className="absolute top-2 right-2 cursor-pointer"
              onClick={onClose}
            >
              <FaTimes className="text-red-800 text-2xl hover:opacity-50" />
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatModal;

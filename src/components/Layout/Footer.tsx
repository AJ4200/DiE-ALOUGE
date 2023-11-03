import { FC } from "react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { motion } from "framer-motion";

const Footer: FC = () => {
  return (
    <motion.div
      className="flex flex-row justify-center items-center h-[30px] sm:h-[50px] border-t border-red-900 py-2 px-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-red-800 ">
        © 2023 DiE-ALOUGE. All rights reserved.
      </div>

      <div className="flex items-center ml-2 space-x-1">
        <motion.a
          href="https://github.com/yourgithubusername"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1 }}
        >
          <FaGithub className="text-red-800 text-sm hover:opacity-50" />
        </motion.a>

        <motion.a
          href="https://linkedin.com/in/yourlinkedinusername"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1 }}
        >
          <FaLinkedin className="text-red-800 text-sm hover:opacity-50" />
        </motion.a>
      </div>
    </motion.div>
  );
};

export default Footer;

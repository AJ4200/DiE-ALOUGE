import { FC } from "react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { motion } from "framer-motion";

const Navbar: FC = () => {
  return (
    <motion.div
      className="flex h-[50px] sm:h-[60px] border-b border-red-700 py-2 px-2 sm:px-8 items-center justify-between"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="font-bold text-4xl flex items-center">
        <a className="ml-2 text-red-800 hover:opacity-50" href="/">
          DiE-ALOUGE
          <span
            className="font-light text-xs text-red-800"
            style={{ fontFamily: "Die" }}
          >
            Alpha
          </span>
        </a>
      </div>

      <div className="flex items-center space-x-4">
        <motion.a
          href="https://github.com/yourgithubusername"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1 }}
        >
          <FaGithub className="text-red-800 text-2xl hover:opacity-50" />
        </motion.a>

        <motion.a
          href="https://linkedin.com/in/yourlinkedinusername"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1 }}
        >
          <FaLinkedin className="text-red-800 text-2xl hover:opacity-50" />
        </motion.a>
      </div>
    </motion.div>
  );
};

export default Navbar;

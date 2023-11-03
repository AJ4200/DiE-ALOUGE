import { FC } from "react";

export const Navbar: FC = () => {
  return (
    <div className="flex h-[50px] sm:h-[60px] border-b border-red-700 py-2 px-2 sm:px-8 items-center justify-between">
      <div className="font-bold text-4xl flex items-center">
        <a
          className="ml-2 text-red-800 hover:opacity-50"
          href="/"
        >
          DiE-ALOUGE
          <span
            className="font-light text-xs text-red-800"
            style={{ fontFamily: "Die" }}
          >
            Alpha
          </span>
        </a>
      </div>
    </div>
  );
};

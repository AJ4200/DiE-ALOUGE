import classnames from "classnames";
import React, { useEffect, useState } from "react";
import Loader from "./Loader";

const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const Run: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, getRandomInt(5000, 15000)); // Set the visibility to trigger randomly between 5 to 15 seconds

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleButtonClick = () => {
    setIsVisible(true);
  };

  return (
    <>
      {isVisible && (
        <div
          className={classnames(
            "text-red-900 ",
            "fixed left-0 right-0 -top-40 -z-10 morphing"
          )}
        >
          <div className="word">
            <h1 className="glitch">
              <span aria-hidden="true">They</span>
              They
              <span aria-hidden="true">They</span>
            </h1>
          </div>
          <div className="word">
            <h1 className="glitch">
              <span aria-hidden="true">Are</span>
              Are
              <span aria-hidden="true">Are</span>
            </h1>
          </div>
          <div className="word">
            <h1 className="glitch">
              <span aria-hidden="true">Watching</span>
              Watching
              <span aria-hidden="true">Watching</span>
            </h1>
          </div>
          <div className="word">
            <h1 className="glitch">
              <span aria-hidden="true">You</span>
              You
              <span aria-hidden="true">You</span>
            </h1>
          </div>
          <div className="word">
            <h1 className="glitch">
              <span aria-hidden="true">Run!!!</span>
              Run!!!
              <span aria-hidden="true">Run!!!</span>
            </h1>
          </div>
        </div>
      )}
      <Loader />
    </>
  );
};

export default Run;

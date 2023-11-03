import classnames from "classnames";
import React from "react";
import Loader from "./Loader";

const TitleCard: React.FC = () => {

  return (
      <>
          
      <div className={classnames("text-red-900","morphing")}  >
        <div className="word">
          <h1 className="glitch">
            <span aria-hidden="true">Thread</span>
            Thread
            <span aria-hidden="true">Thread</span>
          </h1>
        </div>
        <div className="word">
          <h1 className="glitch">
            <span aria-hidden="true">Survive</span>
            Survive
            <span aria-hidden="true">Survive</span>
          </h1>
        </div>
        <div className="word">
          <h1 className="glitch">
            <span aria-hidden="true">Escape</span>
            Escape
            <span aria-hidden="true">Escape</span>
          </h1>
        </div>
        <div className="word">
          <h1 className="glitch">
            <span aria-hidden="true">Death</span>
            Death
            <span aria-hidden="true">Death</span>
          </h1>
        </div>
        <div className="word">
          <h1 className="glitch">
            <span aria-hidden="true">In</span>
            In
            <span aria-hidden="true">In</span>
          </h1>
        </div>
        <div className="word">
          <h1 className="glitch">
            <span aria-hidden="true">Die-alogue!</span>
            Die-alogue!
            <span aria-hidden="true">Die-alogue!</span>
          </h1>
        </div>
          </div>
         <Loader/> 
    </>
  );
};

export default TitleCard;

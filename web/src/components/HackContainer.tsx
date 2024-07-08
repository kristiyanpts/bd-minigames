import React, { FC, ReactNode, useEffect, useState } from "react";
import classNames from "classnames";
import Button from "./Button";
import useTimeout from "../hooks/useTimeout";
import { useCountdown } from "../hooks/useCountdown";
import Settings from "./Settings";
import gamePad from "../assets/images/gamePad.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import { isEnvBrowser } from "../utils/misc";

interface HackContainerButton {
  label: string;
  color: "purple" | "green";
  callback?: () => void; // TODO: Make callback non-optional
  disabled: boolean;
}

interface HackContainerSettings {
  handleSave: () => void;
  handleReset: () => void;
  children: ReactNode;
}

interface HackContainerProps {
  children: ReactNode;
  title: string;
  description?: string;
  buttons: HackContainerButton[][];
  countdownDuration: number;
  resetCallback: () => void;
  resetDelay: number;
  // frameSpeed: number,
  status: number;
  setStatus: (status: number) => void;
  statusMessage: string;
  settings?: HackContainerSettings;
  score?: number;
  targetScore?: number;

  // props: {[key: string]: any},
  className?: string;
}

const HackContainer: FC<HackContainerProps> = ({
  children,
  title,
  description,
  buttons,
  countdownDuration,
  resetCallback,
  resetDelay,
  status,
  setStatus,
  statusMessage,
  settings,
  score,
  targetScore,
  ...props
}) => {
  const frameSpeed = 1000;

  const resetTimeout = useTimeout(() => {
    resetCallback();
    resetCountdown();
  }, resetDelay);

  useEffect(() => {
    if (status !== 1 && status !== 0) {
      resetTimeout();
    }
  }, [resetTimeout, status]);

  const timerReset = () => {
    setStatus(2);
  };

  const [countdown, resetCountdown, freezeCountdown] = useCountdown(
    timerReset,
    countdownDuration,
    frameSpeed
  );

  useEffect(() => {
    if (status !== 1 && status !== 0) {
      freezeCountdown();
    }
  }, [freezeCountdown, status]);

  const calculateTimerBar = () => {
    let width = 100;
    if (status === 1) {
      // Only move the timer if the game is running
      width -= countdown;
      // We want to anticipate the next tick so the transition will start instantly
      width -= Math.max(Math.min(frameSpeed / countdownDuration, 1), 0) * 100;
      // And clamp that between 0-100
      width = Math.max(Math.min(width, 100), 0);
    }
    return width;
  };

  const [settingsVisible, setSettingsVisible] = useState(false);

  return (
    <>
      {settings && (
        <Settings
          handleReset={settings.handleReset}
          handleSave={settings.handleSave}
          visible={settingsVisible}
          setVisible={setSettingsVisible}
        >
          {settings.children}
        </Settings>
      )}
      <div
        className={classNames(
          `
                    max-h-full max-w-full
                    rounded-lg
                    overflow-hidden
                `,
          props.className
        )}
      >
        <div
          className="
                    max-h-full max-w-full
                    relative
                    p-3
                    flex flex-col justify-center
                    bg-[rgb(7_19_32)]
                "
        >
          {/* Header */}
          <div
            className="
                        grid
                        grid-cols-[auto_min-content]
                        mb-4
                    "
          >
            <div
              className="
                            flex items-center
                            gap-4
                        "
            >
              <img className="w-8 sm:w-10" src={gamePad} />
              <h2
                className="
                                text-lg
                                sm:text-2xl
                                text-spring-green-300
                                [text-shadow:0_0_40px_rgb(162_216_250)]
                            "
              >
                {/*Originally, text shadow was 2.1px, but it looks much bigger on nopixel*/}
                {title}
              </h2>
              <p
                className="
                                text-xs
                                sm:text-base
                                text-[rgb(142_142_142)]"
              >
                {description}
              </p>
            </div>
            {settings && isEnvBrowser() && (
              <div className="h-full flex aspect-square justify-center items-center p-1 mr-7">
                <FontAwesomeIcon
                  icon={faGear}
                  className="
                                    size-full
                                    text-gray-500
                                    hover:rotate-90 hover:scale-110 hover:cursor-pointer
                                    transition-transform
                                "
                  onClick={() => setSettingsVisible(true)}
                  title={"Open Settings"}
                />
              </div>
            )}
            {targetScore && (
              <div
                className="
                                col-span-full
                                text-center
                                text-white
                                text-lg
                            "
              >
                {score}/{targetScore}
              </div>
            )}
          </div>
          {statusMessage !== "" && (
            <div
              className={classNames(
                `
                            gap-2.5
                            absolute
                            text-white
                            rounded
                            flex items-center justify-center
                            w-full h-full left-0 top-0 bg-[rgb(0_0_0/0.7)] z-20
                        `
              )}
            >
              <div
                className={classNames(
                  "flex items-center justify-center rounded-sm px-5 p-2 gap-2 ",
                  status === 2
                    ? "bg-[rgb(56_13_23)]"
                    : status === 3
                    ? "bg-[rgb(23_95_88)]"
                    : status === 4
                    ? "bg-[rgb(118_128_37)]"
                    : "hidden"
                )}
              >
                <i
                  className={classNames(
                    "fa-solid ",
                    status === 2
                      ? "fa-circle-xmark text-[rgb(255_84_84)] text-2xl"
                      : status === 3
                      ? "fa-circle-check text-[rgb(84_255_164)] text-2xl"
                      : status === 0
                      ? "fa-hourglass-start text-[rgb(118_128_37)] text-2xl"
                      : "hidden"
                  )}
                ></i>
                <p className="text-xl font-medium">{statusMessage}</p>
              </div>
            </div>
          )}
          {/* Main puzzle */}
          <div className="w-full pb-2 flex-1">{children}</div>
          {/* Buttons */}
          <div className="flex flex-col w-full gap-1">
            {buttons.map((buttonRow, index) => {
              return (
                <div className="flex gap-1 *:flex-1" key={index}>
                  {buttonRow.map((button, index) => {
                    return (
                      <Button
                        onClick={button.callback}
                        color={button.color}
                        key={index}
                        disabled={button.disabled}
                      >
                        {button.label}
                      </Button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        {/* Timer bar */}
        {/* TODO: Check BG color, before react rewrite was rgb(36 47 59)*/}
        <div className="bg-[rgb(15_27_33)] flex w-full h-2.5">
          <div
            className={classNames(
              "bg-[#38a2e5] w-full h-full [transition:width_linear]"
            )}
            style={{
              transitionDuration: status !== 1 ? "0ms" : `${frameSpeed}ms`,
              // transitionTimingFunction: "cubic-bezier(0.4, 1, 0.7, 0.93)",
              width: `${calculateTimerBar()}%`,
            }}
          ></div>
        </div>
      </div>
    </>
  );
};

export default HackContainer;

"use client";

import { useEffect, useState } from "react";
import classNames from "classnames";
import { useKeyDown } from "../../hooks/useKeyDown";
import { SettingsRange } from "../../components/Settings";
import HackContainer from "../../components/HackContainer";
import useGame from "../../hooks/useGame";
import { useNuiEvent } from "../../hooks/useNuiEvent";
import { Minigame } from "../../types/general";
import { isEnvBrowser, shuffle } from "../../utils/misc";
import { failedPlayer, successPlayer } from "../../assets/audio/AudioManager";
import { finishMinigame } from "../../utils/finishMinigame";
import { useNavigate } from "react-router-dom";

type RingColor = "red" | "yellow" | "blue";

const degInterval = 30;
const positions = 360 / degInterval;
const colors: RingColor[] = ["red", "yellow", "blue"];

// TODO: Should the laundromat have different messages?
const getStatusMessage = (status: number | undefined) => {
  switch (status) {
    case 0:
      return "";
    case 1:
      return "";
    case 2:
      failedPlayer.play();
      return "The lockpick bent out of shape.";
    case 3:
      successPlayer.play();
      return "The lock was picked successfully.";
    case 4:
      return "Reset!";
    default:
      return `Error: Unknown game status ${status}`;
  }
};

const getRandomN = <T,>(array: T[], n: number): T[] => {
  // Shuffle the array
  const result = shuffle(array);

  // Reset the length to n (deletes the rest)
  result.length = n;

  return result;
};

const unsigned = (n: number, size: number = positions) => {
  while (n < 0) {
    n += size;
  }
  return n % size;
};

interface Ring {
  color: RingColor[];
  balls: number[];
  slots: number[];
  rotation: number;
}

const generateRing = (difficulty: "normal" | "hard" = "normal"): Ring => {
  // We want to generate:
  // 1. An array of random colors, one per position
  // 2. An array of random indexes for ball positions, >=5
  // 3. An array of random indexes for slot rings, >=4, <total-4
  // 4. A random index for initial ball rotation

  const initialPositions: number[] = []; // All possible slot indexes
  const resultColors: RingColor[] = [];

  // Generate slot colors and initial indexes array
  for (let i = 0; i < positions; i++) {
    initialPositions.push(i);
    resultColors.push(colors[Math.floor(Math.random() * colors.length)]);
  }

  // Generate indexes
  const amountBalls = Math.floor(Math.random() * (positions + 1 - 5) + 5); // 5 <= i <= max
  const amountSlots = Math.floor(Math.random() * (positions - 4 - 4) + 4); // 4 <= i < max - 4

  let resultBalls: number[];
  let resultSlots: number[];
  const shuffledPositions = shuffle(initialPositions);

  switch (difficulty) {
    case "normal":
      resultBalls = shuffledPositions.slice(0, amountBalls);
      resultSlots = shuffledPositions.slice(0, amountSlots);
      break;

    // I initially misunderstood how these positions should be generated, and this is the first implementation I
    // made. It's not correct, but I thought it was kinda fun, so I added it as a "hard" difficulty.
    // Basically, this version shuffles the balls and slots separately, but they should be shuffled together.
    case "hard":
      resultBalls = getRandomN(initialPositions, amountBalls);
      resultSlots = getRandomN(initialPositions, amountSlots);
      break;
  }

  const resultRotation = Math.floor(Math.random() * positions);

  return {
    color: resultColors,
    balls: resultBalls,
    slots: resultSlots,
    rotation: resultRotation,
  };
};

const maxLevels = 5;
const countdownDuration = 30;

const Lockpick = () => {
  const [title, setTitle] = useState<string>("Lockpick");
  const [levels, setLevels] = useState(maxLevels);
  const [timer, setTimer] = useState(countdownDuration);
  const [rings, setRings] = useState<Ring[]>([]);
  const [rotation, setRotation] = useState<number>(0);
  const [level, setLevel] = useState<number>(0);
  const navigate = useNavigate();
  const [shouldReset, setShouldReset] = useState(false);

  const statusUpdateHandler = (newStatus: number) => {
    const newRings: Ring[] = [];
    switch (newStatus) {
      case 1:
        console.log("Reset game");
        for (let i = 0; i < levels; i++) {
          // TODO: Add config for difficulty
          newRings.push(generateRing());
        }
        setRings(newRings);
        setLevel(0);
        setRotation(newRings[0].rotation);
        break;
    }
  };

  const [gameStatus, setGameStatus] = useGame(
    timer * 1000,
    statusUpdateHandler
  );

  useEffect(() => {
    if (shouldReset) {
      setGameStatus(1);
      setShouldReset(false);
    }
  }, [shouldReset, setGameStatus]);

  useNuiEvent("playMinigame", (minigame: Minigame) => {
    if (minigame.minigame !== "lockpick") return;

    const data = minigame.data as {
      title: string;
      levels: number;
      timer: number;
    };

    setTitle(data.title);
    setLevels(data.levels);
    setTimer(data.timer);
    setShouldReset(true);
  });

  const resetGame = async () => {
    if (isEnvBrowser()) {
      setGameStatus(1);
    } else {
      const result = gameStatus === 3 ? true : false;

      await finishMinigame(result);
      navigate("/");
    }
  };

  const handleWin = async (message: string) => {
    console.log(`Win: ${message}`);

    setGameStatus(3);
  };

  const handleLose = async (message: string) => {
    console.log(`Lose: ${message}`);

    setGameStatus(2);
  };

  const nextLevel = () => {
    if (level >= levels - 1) {
      handleWin("All levels completed");
    } else {
      const newLevel = level + 1;
      setLevel(newLevel);
      setRotation(rings[newLevel].rotation);
    }
  };

  const updateRotation = (shift: number) => {
    const newRotation = rotation + shift;
    setRotation(newRotation);
    const newRings = rings;
    newRings[level].rotation = newRotation;
    setRings(newRings);
  };

  const handleLeft = () => {
    updateRotation(-1);
  };

  const handleRight = () => {
    updateRotation(+1);
  };

  const handleUnlock = () => {
    // Check if the current rotation is a solution

    // Iterate each slot
    for (const slot of rings[level].slots) {
      // Get the position of the current ball
      const ballPosition = unsigned(slot - unsigned(rotation));
      // If there is a ball here
      if (rings[level].balls.includes(ballPosition)) {
        // Fail if the color doesn't match
        if (rings[level].color[ballPosition] !== rings[level].color[slot]) {
          handleLose(
            `Mismatch on level ${level} with rotation ${rotation}. Slot ${slot} (${rings[level].color[slot]}) does not match ball ${ballPosition} (${rings[level].color[ballPosition]})`
          );
          // console.log(rings);
          return;
        }
      }
    }
    nextLevel();
  };

  const handleKeyDown = (callback: () => void) => {
    return () => {
      if (gameStatus === 1) {
        callback();
      }
    };
  };

  useKeyDown(handleKeyDown(handleLeft), ["ArrowLeft", "a", "A"]);
  useKeyDown(handleKeyDown(handleRight), ["ArrowRight", "d", "D"]);
  useKeyDown(handleKeyDown(handleUnlock), ["Enter", " "]);

  const svgSize = 50 * (levels * 2 + 1);

  const [settingsLevels, setSettingsLevels] = useState(levels);
  const [settingsTimer, setSettingsTimer] = useState(timer);

  useEffect(() => {
    setSettingsLevels(levels);
    setSettingsTimer(timer);
  }, [levels, timer, gameStatus]);

  const settings = {
    handleSave: () => {
      setLevels(settingsLevels);
      setTimer(settingsTimer);
      setGameStatus(4);
    },
    handleReset: () => {
      setLevels(maxLevels);
      setTimer(countdownDuration);
      setGameStatus(4);
    },
    children: (
      <>
        <div className={"flex w-full gap-2 *:flex-1 flex-col sm:flex-row"}>
          <SettingsRange
            title={"Levels"}
            value={settingsLevels}
            setValue={setSettingsLevels}
            min={2}
            max={10}
          />
          <SettingsRange
            title={"Timer"}
            value={settingsTimer}
            setValue={setSettingsTimer}
            min={5}
            max={100}
          />
        </div>
      </>
    ),
  };

  return (
    <HackContainer
      title={title}
      description={"Unlock each lock"}
      buttons={[
        [
          {
            label: "Rotate Left",
            color: "purple",
            callback: handleLeft,
            disabled: gameStatus !== 1,
          },
          {
            label: "Rotate Right",
            color: "purple",
            callback: handleRight,
            disabled: gameStatus !== 1,
          },
        ],
        [
          {
            label: "Unlock",
            color: "green",
            callback: handleUnlock,
            disabled: gameStatus !== 1,
          },
        ],
      ]}
      countdownDuration={timer * 1000}
      resetCallback={resetGame}
      resetDelay={3000}
      status={gameStatus}
      setStatus={setGameStatus}
      statusMessage={getStatusMessage(gameStatus)}
      settings={settings}
      // className="h-full"
    >
      <div
        className={classNames(
          `
                    aspect-square
                    max-h-full max-w-full
                    rounded-lg
                    bg-[rgb(22_40_52)]
                    flex items-center justify-center
                    relative
                `,
          gameStatus === 0 || gameStatus === 4 ? "blur" : ""
        )}
        style={{
          // TODO: Refactor the responsive sizing so it doesn't use hardcoded values.

          // Note: These values will need to be updated if the page styles are changed.

          // Total height of the container element is 194px plus a 64px header and 40px padding
          // Total width of the container is 24px plus 40px padding
          maxWidth: `calc(100vh - 298px)`,
          width: `calc(100vw - 64px)`,
        }}
      >
        <div
          className="
                    aspect-square
                    flex items-center justify-center
                    size-full
                    absolute
                "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            version="1.1"
            className="
                            size-full aspect-square

                            *:origin-center

                            data-[stroke=gray]:*:stroke-[rgb(173_173_173)]
                            data-[stroke=fail]:*:stroke-[rgb(255_84_84)]
                            data-[stroke=win]:*:stroke-[rgb(48_221_189/0.816)]

                            *:*:origin-center

                            data-[stroke=blue]:*:*:stroke-[rgb(46_134_213)]
                            data-[stroke=yellow]:*:*:stroke-[rgb(239_181_17)]
                            data-[stroke=red]:*:*:stroke-[rgb(202_39_97)]
                            data-[stroke=fail]:*:*:stroke-[rgb(255_84_84)]
                            data-[stroke=win]:*:*:stroke-[rgb(48_221_189/0.816)]

                            data-[fill=blue]:*:*:fill-[rgb(46_134_213)]
                            data-[fill=yellow]:*:*:fill-[rgb(239_181_17)]
                            data-[fill=red]:*:*:fill-[rgb(202_39_97)]
                            data-[fill=fail]:*:*:fill-[rgb(255_84_84)]
                            data-[fill=win]:*:*:fill-[rgb(48_221_189/0.816)]
                        "
            viewBox={`0 0 ${svgSize} ${svgSize}`}
          >
            <g
              className="
                                    *:stroke-[1.2px] *:origin-center
                                    *:stroke-[rgb(142_142_142)]
                                "
            >
              {[...Array(positions / 2)].map((value, index) => (
                <line
                  key={index}
                  x1={35}
                  x2={svgSize - 35}
                  y1={svgSize / 2}
                  y2={svgSize / 2}
                  transform={`rotate(${index * degInterval})`}
                ></line>
              ))}
            </g>
            {rings.map((ring, ringIndex) => {
              const radius = (ringIndex + 1) * 50 - 10;
              const slotRadius = radius + 15;

              return (
                <>
                  <circle
                    key={ringIndex * 3}
                    className="
                                            fill-none stroke-[3px]
                                        "
                    data-stroke={
                      level > ringIndex || gameStatus === 3
                        ? "win"
                        : gameStatus === 2 && level == ringIndex
                        ? "fail"
                        : "gray"
                    }
                    cx="50%"
                    cy="50%"
                    r={radius}
                  />
                  <g
                    key={ringIndex * 3 + 1}
                    className="
                                            *:ease-in-out *:transition-transform *:duration-200
                                        "
                  >
                    {ring.balls.map((ball, index) => (
                      <circle
                        key={index}
                        style={{
                          transform: `rotate(${
                            (ball + ring.rotation) * 30
                          }deg) translateX(${radius}px)`,
                        }}
                        data-fill={
                          level > ringIndex || gameStatus === 3
                            ? "win"
                            : gameStatus === 2 && level == ringIndex
                            ? "fail"
                            : ring.color[ball]
                        }
                        cx="50%"
                        cy="50%"
                        r="8.5px"
                      />
                    ))}
                  </g>
                  <g
                    key={ringIndex * 3 + 2}
                    className="
                                            *:fill-none *:stroke-[5px]
                                        "
                  >
                    {ring.slots.map((slot, index) => (
                      <circle
                        key={index}
                        data-r-px={slotRadius}
                        cx="50%"
                        cy="50%"
                        r={slotRadius}
                        data-stroke={
                          level > ringIndex || gameStatus === 3
                            ? "win"
                            : gameStatus === 2 && level == ringIndex
                            ? "fail"
                            : ring.color[slot]
                        }
                        style={{
                          transform: `rotate(${-15 + slot * 30}deg)`,
                          strokeDasharray: `${2 * slotRadius * Math.PI}`,
                          strokeDashoffset: `${
                            (11 * (2 * slotRadius * Math.PI)) / 12
                          }`,
                        }}
                      />
                    ))}
                  </g>
                </>
              );
            })}
          </svg>
        </div>
        {/*<div className="overlay hidden absolute"></div>*/}
        {/*<div className="lock-container absolute">*/}
        {/*</div>*/}
      </div>
    </HackContainer>
  );
};

export default Lockpick;

"use client";

import React, { FC, useEffect, useState } from "react";
import classNames from "classnames";
import {
  getCluster,
  handleGravity,
  handleLeftShift,
  SquareColor,
  squareColors,
  SquareValue,
} from "./utils";
import HackContainer from "../../components/HackContainer";
import { SettingsRange } from "../../components/Settings";
import useGame from "../../hooks/useGame";
import { useNuiEvent } from "../../hooks/useNuiEvent";
import { Minigame } from "../../types/general";
import { isEnvBrowser } from "../../utils/misc";
import { finishMinigame } from "../../utils/finishMinigame";
import { useNavigate } from "react-router-dom";
import { failedPlayer, successPlayer } from "../../assets/audio/AudioManager";

const getStatusMessage = (status: number | undefined) => {
  switch (status) {
    case 0:
      return "";
    case 1:
      return "";
    case 2:
      failedPlayer.play();
      return "You suck at this :D";
    case 3:
      successPlayer.play();
      return "Sometimes you win :O";
    case 4:
      return "Reset!";
    default:
      return `Error: Unknown game status ${status}`;
  }
};

const getRandomColor = (): SquareColor => {
  return squareColors[Math.floor(Math.random() * squareColors.length)];
};

const defaultRows = 8;
const defaultColumns = 11;
const defaultDuration = 25;

const RoofRunning: FC = () => {
  const [timer, setTimer] = useState(defaultDuration); // TODO: Get the actual speed
  const [rows, setRows] = useState(defaultRows);
  const [columns, setColumns] = useState(defaultColumns);

  const [board, setBoard] = useState<SquareValue[]>(
    new Array(rows * columns).fill("empty")
  );
  const [shouldReset, setShouldReset] = useState(false);
  const navigate = useNavigate();

  const statusUpdateHandler = (newStatus: number) => {
    switch (newStatus) {
      case 1:
        console.log("Reset game");
        resetBoard();
        break;
    }
  };

  const [gameStatus, setGameStatus] = useGame(
    timer * 1000,
    statusUpdateHandler
  );

  useEffect(() => {
    if (shouldReset) {
      setBoard(new Array(rows * columns).fill("empty"));
      setGameStatus(1);
      setShouldReset(false);
    }
  }, [shouldReset, setGameStatus, rows, columns]);

  useNuiEvent("playMinigame", (minigame: Minigame) => {
    if (minigame.minigame !== "roof-running") return;

    const data = minigame.data as {
      rows: number;
      columns: number;
      timer: number;
    };

    setRows(data.rows);
    setColumns(data.columns);
    setTimer(data.timer);

    setShouldReset(true);
  });

  const resetBoard = () => {
    const newBoard: SquareColor[] = [];
    console.log(`generating new ${rows}x${columns} board`);
    for (let i = 0; i < rows * columns; i++) {
      newBoard.push(getRandomColor());
    }
    setBoard(newBoard);
  };

  const resetGame = async () => {
    if (isEnvBrowser()) {
      setGameStatus(1);
    } else {
      const result = gameStatus === 3 ? true : false;

      await finishMinigame(result);
      navigate("/");
    }
  };

  const handleWin = (message: string) => {
    console.log(`Win: ${message}`);

    setGameStatus(3);
  };

  const handleLose = (message: string) => {
    console.log(`Lose: ${message}`);

    setGameStatus(2);
  };

  const checkStatus = (newBoard: SquareValue[]) => {
    if (newBoard.every((value) => value === "empty")) {
      handleWin("All tiles cleared");
    }

    for (let i = 0; i < squareColors.length; i++) {
      if (newBoard.filter((value) => value === squareColors[i]).length === 1) {
        handleLose(`Unsolvable: 1 ${squareColors[i]} tile remaining`);
      }
    }
  };

  const handleClick = (index: number) => {
    if (gameStatus !== 1) {
      return;
    }
    const cluster = getCluster(board, index, rows, columns);

    // If there is more than one tile
    if (cluster.length > 1) {
      let newBoard = [...board];
      cluster.forEach((i) => {
        newBoard[i] = "empty";
      });
      newBoard = handleGravity(newBoard, rows, columns);
      newBoard = handleLeftShift(newBoard, rows, columns);
      setBoard(newBoard);
      checkStatus(newBoard);
    }
  };

  const [settingsRows, setSettingsRows] = useState(rows);
  const [settingsColumns, setSettingsColumns] = useState(columns);
  const [settingsTimer, setSettingsTimer] = useState(timer);

  useEffect(() => {
    setSettingsRows(rows);
    setSettingsColumns(columns);
    setSettingsTimer(timer);
  }, [rows, columns, timer]);

  const settings = {
    handleSave: () => {
      setRows(settingsRows);
      setColumns(settingsColumns);
      setTimer(settingsTimer);
      setGameStatus(4);
    },
    handleReset: () => {
      setRows(defaultRows);
      setColumns(defaultColumns);
      setTimer(defaultDuration);
      setGameStatus(4);
    },
    children: (
      <div className="flex flex-col items-center">
        <div className={"flex w-full gap-2 *:flex-1 flex-row"}>
          <SettingsRange
            title={"Rows"}
            value={settingsRows}
            setValue={setSettingsRows}
            min={5}
            max={10}
          />
          <SettingsRange
            title={"Columns"}
            value={settingsColumns}
            setValue={setSettingsColumns}
            min={5}
            max={15}
          />
        </div>
        <div
          className="flex items-center justify-center aspect-[15/10] w-[50%] mt-6 h-auto "
          // style={{
          //     height: `${10 * 20}px`,
          //     width: `${15 * 20}px`,
          // }}
        >
          <div
            className="
                            [outline:2px_solid_rgb(94_93_93)]
                            bg-radient-circle-c
                            from-[rgb(22_40_52/0.651)] to-[rgb(22_40_52)]

                            *:whitespace-nowrap
                            *:absolute
                            *:text-base
                            *:text-[rgb(84_255_164)]
                            *:[text-shadow:0_0_2.1px_rgb(127_255_191)]
                        "
            style={{
              height: `${(100 / 10) * settingsRows}%`,
              width: `${(100 / 15) * settingsColumns}%`,
            }}
          >
            <div className="left-1/2 -translate-y-full -translate-x-1/2">
              Columns
            </div>
            <div className="[writing-mode:vertical-lr] top-1/2 -translate-x-full -rotate-180">
              Rows
            </div>
          </div>
        </div>
        <div className={"flex w-full gap-2 *:flex-1 flex-col sm:flex-row"}>
          <SettingsRange
            title={"Timer"}
            value={settingsTimer}
            setValue={setSettingsTimer}
            min={5}
            max={100}
          />
        </div>
      </div>
    ),
  };

  return (
    <HackContainer
      title="Same Game"
      description="Click on matching groups of blocks"
      buttons={[]}
      countdownDuration={timer * 1000}
      resetCallback={resetGame}
      resetDelay={3000}
      status={gameStatus}
      setStatus={setGameStatus}
      statusMessage={getStatusMessage(gameStatus)}
      settings={settings}
    >
      <div
        className={classNames(
          `
                    grid
                    gap-x-0.5 gap-y-1
    
                    mx-auto
    
                    *:aspect-square
                    *:bg-gradient-to-b
    
                    data-[color=red]:*:from-[#f30308]
                    data-[color=red]:*:to-[#92393b]
                    data-[color=red]:*:[box-shadow:0px_5px_0px_#5c2829]
    
                    data-[color=green]:*:from-[#8ab357]
                    data-[color=green]:*:to-[#668a3d]
                    data-[color=green]:*:[box-shadow:0px_5px_0px_#48612f]
    
                    data-[color=blue]:*:from-[#5490b2]
                    data-[color=blue]:*:to-[#3a7494]
                    data-[color=blue]:*:[box-shadow:0px_5px_0px_#345066]
    
                    *:overflow-hidden
    
                    *:*:size-full
                    *:*:opacity-50
                    *:*:overflow-visible
    
                    *:data-[color=empty]:*:hidden
                `,
          gameStatus === 0 || gameStatus === 4 ? "blur" : ""
        )}
        style={{
          // TODO: Refactor the responsive sizing so it doesn't use hardcoded values.

          // Note: These values will need to be updated if the page styles are changed.

          // Total height of the container element is 94px plus a 64px header and 40px padding
          // Total width of the container is 24px plus 40px padding

          // (height - verticalGapSum) / rows * columns + horizontalGapSum
          // (height - {2(rows - 1)}px) / rows * columns + {2(columns - 1)}px
          maxWidth: `calc(calc(calc(calc(calc(100vh - 208px) - ${
            4 * (rows - 1)
          }px) / ${rows}) * ${columns}) + ${2 * (columns - 1)}px)`,
          // maxWidth: `calc(calc(calc(100vh - 208px) / ${rows}) * ${columns})`,  // height / rows * columns

          width: `calc(100vw - 64px)`,
          //     aspectRatio: `${columns}/${rows}`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {/* TODO: Dynamic size */}
        {board.map((color, index) => {
          return (
            <div
              key={index}
              data-color={color}
              onClick={() => handleClick(index)}
            >
              <svg
                viewBox="0 0 100 100"
                style={{
                  padding: "0.5px",
                }}
                // style={{
                //     border: "0.5px solid rgba(255,255,255, 0)"
                // }}
              >
                <rect
                  // x={1} y={1} width={99} height={99}
                  width={100}
                  height={100}
                  style={{
                    fill: "none",
                    stroke: "white",
                    strokeWidth: "2",
                  }}
                />
                <path
                  d="M5 25 V5 H25 M75 5 H95 V25 M95 75 V95 H75 M25 95 H5 V75"
                  style={{
                    fill: "none",
                    stroke: "white",
                    strokeWidth: "1.5",
                  }}
                />
              </svg>
              {/*<div className=""></div>*/}
            </div>
          );
        })}
      </div>
    </HackContainer>
  );
};

export default RoofRunning;

"use client";

import { FC, Fragment, useCallback, useEffect, useState } from "react";
import {
  GridRow,
  initialBoard,
  presets,
  SquareCoord,
  getRandomPiece,
  getRandomSquare,
  Square,
  SquarePiece,
  getStatusMessage,
} from "./utils";

import crossImg from "../../assets/images/thermite/cross.svg";
import backgroundImg from "../../assets/images/thermite/background.svg";

import "./Thermite.css";
import HackContainer from "../../components/HackContainer";
import { SettingsRange } from "../../components/Settings";
import Button from "../../components/Button";
import useGame from "../../hooks/useGame";
import { useNuiEvent } from "../../hooks/useNuiEvent";
import { Minigame } from "../../types/general";
import { useNavigate } from "react-router-dom";
import { finishMinigame } from "../../utils/finishMinigame";
import { isEnvBrowser } from "../../utils/misc";

const Thermite: FC = () => {
  const [board, setBoard] = useState<GridRow[]>(initialBoard);
  const [score, setScore] = useState<number>(0);
  const [comboCounter, setComboCounter] = useState<number>(0);
  const [lastKillTimestamp, setLastKillTimestamp] = useState<number>(-1);
  const [totalCombos, setTotalCombos] = useState<number>(0);
  const [resetAnimation, setResetAnimation] = useState<boolean>(false);
  const [showComboNotice, setShowComboNotice] = useState<boolean>(false);
  const [isOutOfMoves, setOutOfMoves] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [timer, setTimer] = useState(presets[selectedPreset].timer);
  const [targetScore, setTargetScore] = useState(
    presets[selectedPreset].targetScore
  );
  const [rows, setRows] = useState(presets[selectedPreset].rows);
  const [columns, setColumns] = useState(presets[selectedPreset].columns);
  const [shouldReset, setShouldReset] = useState(false);
  const navigate = useNavigate();

  /**
   * Resets the board.
   */

  const resetBoard = useCallback((): void => {
    const newBoard: GridRow[] = [];
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let i = 0; i < columns; i++) {
        row.push(getRandomSquare());
      }
      newBoard.push(row);
    }
    setBoard(newBoard);
    setScore(0);
    setComboCounter(0);
    setLastKillTimestamp(-1);
    setTotalCombos(0);
    setOutOfMoves(false);
  }, [columns, rows]);

  const statusUpdateHandler = useCallback(
    (newStatus: number): void => {
      switch (newStatus) {
        case 1:
          setResetAnimation(false);
          resetBoard();
          break;
        default:
          setResetAnimation(true);
          break;
      }
    },
    [resetBoard]
  );

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
    if (minigame.minigame !== "thermite") return;

    const data = minigame.data as {
      targetScore: number;
      rows: number;
      columns: number;
      timer: number;
    };

    setTargetScore(data.targetScore);
    setRows(data.rows);
    setColumns(data.columns);
    setTimer(data.timer);

    setShouldReset(true);
  });

  /**
   * Handles the game status updating.
   *
   * @param {number} newStatus - New game status.
   */

  /**
   * Resets the game.
   */
  const resetGame = useCallback(async () => {
    if (isEnvBrowser()) {
      setGameStatus(1);
    } else {
      const result = gameStatus === 3 ? true : false;

      await finishMinigame(result);
      navigate("/");
    }
  }, [setGameStatus, gameStatus, navigate]);

  /**
   * Sets a square's properties.
   *
   * @param {SquareCoord} squareCoord - Target square's coordinates.
   * @param {Square} props - New props.
   */
  const setSquareProps = useCallback(
    (squareCoord: SquareCoord, props: Square): void => {
      const newBoard = [...board];
      const [row, col] = squareCoord;
      newBoard[row][col] = {
        ...newBoard[row][col],
        ...props,
      };
      setBoard(newBoard);
    },
    [board]
  );

  /**
   * Gets the target square's properties.
   *
   * @param squareCoord - Target square's coordinates.
   * @returns {Square}
   */
  const getSquareProps = useCallback(
    (squareCoord: SquareCoord): Square => {
      const [row, col] = squareCoord;
      return board[row][col];
    },
    [board]
  );

  /**
   * Returns `true` if the target square is in range of attack.
   *
   * @param targetCoord - Target square's coordinates.
   * @param attackerCoord - Attacker square's coordinates.
   * @param attackerPiece - Attacker square piece.
   * @returns {boolean}
   */
  const isTargetAttacked = useCallback(
    (
      targetCoord: SquareCoord,
      attackerCoord: SquareCoord,
      attackerPiece: SquarePiece
    ): boolean => {
      const [targetRow, targetCol] = targetCoord;
      const [attackerRow, attackerCol] = attackerCoord;

      /**
       * I'm pretty sure there's a much more clever way to code this
       * condition but I was born dumb.
       */
      return (
        targetCol % attackerPiece.distance ===
          attackerCol % attackerPiece.distance &&
        targetRow % attackerPiece.distance ===
          attackerRow % attackerPiece.distance &&
        Math.abs(targetCol - attackerCol) <= attackerPiece.distance &&
        Math.abs(targetRow - attackerRow) <= attackerPiece.distance
      );
    },
    []
  );

  /**
   * Handles a square being clicked.
   *
   * @param {SquareCoord} squareCoord - Target square's coordinates.
   */
  const handleClick = useCallback(
    (squareCoord: SquareCoord): void => {
      if (gameStatus !== 1) {
        return;
      }

      const clickedSquare = getSquareProps(squareCoord);
      if (!clickedSquare.highlighted || clickedSquare.status === "empty") {
        return;
      }

      // Handling next move attacking layout.
      let attackingSquares = 0;
      const [attackingRow, attackingCol] = squareCoord;
      const newBoard = [...board].map((row, rowIndex) => {
        return row.map((square, columnIndex) => {
          if (
            (attackingRow == rowIndex && attackingCol == columnIndex) ||
            square.status === "empty"
          ) {
            return square;
          }

          const isAttacked = isTargetAttacked(
            [rowIndex, columnIndex],
            squareCoord,
            clickedSquare.piece
          );

          if (isAttacked) {
            attackingSquares++;
          }
          square.highlighted = isAttacked;

          return square;
        });
      });
      setBoard(newBoard);

      // Lose handling (out of moves).
      if (attackingSquares === 0) {
        setOutOfMoves(true);
        setGameStatus(2);
        return;
      }

      // Score calculations.
      if (clickedSquare.status === "half") {
        let currentCombo = comboCounter;
        let currentScore = score;
        currentScore++;

        const thisKillTimestamp = Date.now();
        if (
          currentCombo === 0 ||
          thisKillTimestamp - lastKillTimestamp <= 1000
        ) {
          currentCombo++;
        } else {
          // More than a second since last kill, resetting combo counter.
          currentCombo = 0;
        }
        setLastKillTimestamp(thisKillTimestamp);

        if (currentCombo >= 3) {
          /**
           * Combo! Three eliminations in a row.
           * Points incremented by 1 + 2 ^ <total number of combos>.
           */
          currentScore += Math.pow(2, totalCombos);
          setComboCounter(0);
          setTotalCombos(totalCombos + 1);
          setShowComboNotice(true);
        } else {
          setComboCounter(currentCombo);
        }
        setScore(currentScore);

        // Win handling.
        if (currentScore >= targetScore) {
          setGameStatus(3);
          return;
        }
      } else {
        // No kill, resetting combo counters.
        setComboCounter(0);
      }

      // Updating clicked square props.
      setSquareProps(squareCoord, {
        status: clickedSquare.status === "full" ? "half" : "empty",
        piece: getRandomPiece(),
        highlighted: false,
      });
    },
    [
      board,
      comboCounter,
      gameStatus,
      getSquareProps,
      isTargetAttacked,
      lastKillTimestamp,
      score,
      setGameStatus,
      setSquareProps,
      targetScore,
      totalCombos,
    ]
  );

  // Settings.
  const [settingsPreset, setSettingsPreset] = useState<number>(selectedPreset);
  const [settingsTimer, setSettingsTimer] = useState<number>(timer);
  const [settingsTargetScore, setSettingsTargetScore] =
    useState<number>(targetScore);
  const [settingsRows, setSettingsRows] = useState(rows);
  const [settingsColumns, setSettingsColumns] = useState(columns);

  useEffect(() => {
    setSettingsPreset(selectedPreset);
    setSettingsTimer(timer);
    setSettingsTargetScore(targetScore);
    setSettingsRows(rows);
    setSettingsColumns(columns);
  }, [selectedPreset, timer, targetScore, rows, columns]);

  const settings = {
    handleSave: () => {
      setSelectedPreset(settingsPreset);
      setTimer(settingsTimer);
      setTargetScore(settingsTargetScore);
      setRows(settingsRows);
      setColumns(settingsColumns);
      setGameStatus(4);
    },
    handleReset: () => {
      setSelectedPreset(selectedPreset);
      setTimer(presets[selectedPreset].timer);
      setTargetScore(presets[selectedPreset].targetScore);
      setRows(presets[selectedPreset].rows);
      setColumns(presets[selectedPreset].columns);
      setGameStatus(4);
    },
    children: (
      <Fragment>
        <div className="w-full flex items-center gap-2 *:flex-1">
          <SettingsRange
            title={"Target score"}
            value={settingsTargetScore}
            setValue={setSettingsTargetScore}
            min={10}
            max={75}
          />
          <SettingsRange
            title={"Timer"}
            value={settingsTimer}
            setValue={setSettingsTimer}
            min={30}
            max={180}
          />
        </div>
        <div className="w-full flex items-center gap-2 *:flex-1">
          <SettingsRange
            title={"Rows"}
            value={settingsRows}
            setValue={setSettingsRows}
            min={5}
            max={9}
          />
          <SettingsRange
            title={"Columns"}
            value={settingsColumns}
            setValue={setSettingsColumns}
            min={5}
            max={9}
          />
        </div>
        <div>
          <p className="w-full px-8 text-[rgb(94_93_93)] text-xl">Presets</p>
          <div className="w-full flex items-center gap-2 px-8 *:flex-1">
            {/**
             * TODO: It might be worth refactoring this to render the
             * buttons dynamically instead of hardcoding these two.
             * There may be more presets in the future when new
             * heists are released.
             * Also, a toggle/radio component might be better than buttons.
             */}
            <Button
              label="Maze Bank - Sewer"
              color="green"
              disabled={settingsPreset === 0}
              onClick={() => {
                setSettingsPreset(0);
                setSettingsTimer(presets[0].timer);
                setSettingsTargetScore(presets[0].targetScore);
                setSettingsRows(presets[0].rows);
                setSettingsColumns(presets[0].columns);
              }}
            >
              Maze Bank - Sewer
            </Button>
            <Button
              label="Maze Bank - Vault"
              color="green"
              disabled={settingsPreset === 1}
              onClick={() => {
                setSettingsPreset(1);
                setSettingsTimer(presets[1].timer);
                setSettingsTargetScore(presets[1].targetScore);
                setSettingsRows(presets[1].rows);
                setSettingsColumns(presets[1].columns);
              }}
            >
              Maze Bank - Vault
            </Button>
          </div>
        </div>
      </Fragment>
    ),
  };

  return (
    <HackContainer
      title="Mazer"
      description="Decrypt the required number of bytes"
      buttons={[]}
      countdownDuration={timer * 1000}
      resetCallback={resetGame}
      resetDelay={3000}
      status={gameStatus}
      setStatus={setGameStatus}
      statusMessage={getStatusMessage(gameStatus)}
      settings={settings}
      score={score}
      targetScore={targetScore}
    >
      <div
        className={
          "thermite" + (gameStatus === 0 || gameStatus === 4 ? " blur" : "")
        }
        style={{
          /**
           * TODO: Refactor the responsive sizing so it doesn't use hardcoded values.
           *
           * Note: These values will need to be updated if the page styles are changed.
           */
          // maxWidth: `calc(calc(calc(calc(calc(100vh - 236px) - ${
          //   4 * (rows - 1)
          // }px) / ${rows}) * ${columns}) + ${2 * (columns - 1)}px)`,
          // width: `calc(100vw - 64px)`,
          width: "100%",
          height: "100%",
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        <Fragment>
          {board.map((row, rowIndex) => {
            return (
              <Fragment key={rowIndex}>
                {row.map((square, columnIndex) => {
                  return (
                    <div
                      key={`${rowIndex}_${columnIndex}`}
                      className="square"
                      data-piece={square.piece}
                      data-status={
                        isOutOfMoves && square.status !== "empty"
                          ? "fail"
                          : square.status
                      }
                      data-highlighted={square.highlighted}
                      onClick={() => handleClick([rowIndex, columnIndex])}
                    >
                      <span className="piece">
                        <img
                          src={square.piece.img}
                          alt=""
                          width={75}
                          height={75}
                        />
                      </span>
                      <div className="crosses">
                        <img src={crossImg} alt="" width={16} height={16} />
                        <img src={crossImg} alt="" width={16} height={16} />
                        <img src={crossImg} alt="" width={16} height={16} />
                        <img src={crossImg} alt="" width={16} height={16} />
                      </div>
                      <div
                        className="highlight"
                        style={{
                          animationName: resetAnimation ? "none" : "highlight",
                        }}
                      ></div>
                    </div>
                  );
                })}
              </Fragment>
            );
          })}
          <div className="notice">
            <span
              style={{ animationName: showComboNotice ? "notice" : "none" }}
              onAnimationEnd={() => setShowComboNotice(false)}
            >
              CRC Bypassed!
            </span>
          </div>
          <img src={backgroundImg} alt="" className="background-image" />
        </Fragment>
      </div>
    </HackContainer>
  );
};

export default Thermite;

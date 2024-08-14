"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { isEnvBrowser, shuffle, uniq } from "../../utils/misc";
import HackContainer from "../../components/HackContainer";
import useGame from "../../hooks/useGame";
import { SettingsRange } from "../../components/Settings";
import { finishMinigame } from "../../utils/finishMinigame";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Circle, Square, Triangle } from "lucide-react";
import { useNuiEvent } from "../../hooks/useNuiEvent";
import { Minigame } from "../../types/general";
import { failedPlayer, successPlayer } from "../../assets/audio/AudioManager";

/*
Easy : 4 seq -> 2 shapes each (same color per seq) -> 3 questions -> prep = 12, answer = 12
Hard: 4 seq -> 3 shapes each (same color per seq) -> 4 question -> prep = 6, answer = 9

Shapes : Square, circle, triangle
Colors : red, blue, yellow, purple, orange, green

Questions:
seq x shape x
seq x color
seq x # of unique shapes
*/

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

type Laptop4Sequence = {
  color: string;
  shapes: string[];
};

const colorOptions = ["red", "blue", "yellow", "purple", "orange", "green"];
const shapeOptions = ["square", "circle", "triangle"];

const generateAnswerOptions = (row: number, col: number) => {
  const answerOptions = [];
  for (let i = 0; i < row; i++) {
    for (let j = 0; j < col; j++) {
      answerOptions.push([i.toString(), j.toString()]);
    }
    answerOptions.push([i.toString(), "color"]);
    answerOptions.push([i.toString(), "#"]);
  }
  return answerOptions;
};

const generateShapesBoard = (row: number, col: number): Laptop4Sequence[] => {
  const array: string[] = [];
  while (array.length < row * col) {
    array.push(shapeOptions[Math.floor(Math.random() * shapeOptions.length)]);
  }

  const board: Laptop4Sequence[] = [];
  while (array.length)
    board.push({
      color: colorOptions[Math.floor(Math.random() * colorOptions.length)],
      shapes: array.splice(0, col),
    });
  return board;
};

const generateQuestionSet = (
  board: Laptop4Sequence[],
  quesOptions: string[][]
) => {
  const questionSet: { q: string; a: string }[] = [];
  quesOptions.forEach((option) => {
    if (option[1] === "color") {
      questionSet.push({
        q: `Sequence ${Number(option[0]) + 1} Color`,
        a: `${board[Number(option[0])].color}`,
      });
    } else if (option[1] === "#") {
      questionSet.push({
        q: `Sequence ${Number(option[0]) + 1} # of unique shapes`,
        a: `${uniq(board[Number(option[0])].shapes)}`,
      });
    } else {
      questionSet.push({
        q: `Sequence ${Number(option[0]) + 1} Shape ${Number(option[1]) + 1}`,
        a: `${board[Number(option[0])].shapes[Number(option[1])]}`,
      });
    }
  });
  return questionSet;
};

const compareAnswers = (
  c1: { q: string; a: string }[],
  c2: { q: string; a: string }[]
) => {
  let res = true;
  c2.forEach((c, i) => {
    if (c.a !== c1[i].a) res = false;
  });
  return res;
};

const defaultRows = 4;
const defaultColumns = 2;
const defaultViewTime = 12;
const defaultTypeTime = 30;
const defaultAnswersNeeded = 3;

const LaptopTerminal = () => {
  const [row, setRow] = useState(defaultRows);
  const [column, setColumn] = useState(defaultColumns);
  const [time, setTime] = useState(defaultViewTime + defaultTypeTime);
  const [viewTime, setViewTime] = useState(defaultViewTime);
  const [typeTime, setTypeTime] = useState(defaultTypeTime);
  const [answersNeeded, setAnswersNeeded] = useState(defaultAnswersNeeded);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [result, setResult] = useState("");
  const [progress, setProgress] = useState(100);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answerInput, setAnswerInput] = useState<string>("");
  const [shapesBoard, setShapesBoard] = useState<Laptop4Sequence[]>([]);
  const [questionSet, setQuestionSet] = useState<{ q: string; a: string }[]>(
    []
  );
  const [entries, setEntries] = useState<{ q: string; a: string }[]>([]);
  const [prepmode, setPrepmode] = useState(true);

  const [settingsRows, setSettingsRows] = useState(defaultRows);
  const [settingsColumns, setSettingsColumns] = useState(defaultColumns);
  const [settingsViewTime, setSettingsViewTime] = useState(defaultViewTime);
  const [settingsTypeTime, setSettingsTypeTime] = useState(defaultTypeTime);
  const [settingsAnswersNeeded, setSettingsAnswersNeeded] =
    useState(defaultAnswersNeeded);
  const [shouldReset, setShouldReset] = useState(false);
  const navigate = useNavigate();

  const statusUpdateHandler = (newStatus: number) => {
    switch (newStatus) {
      case 1:
        console.log("Reset game");
        startGame();
        break;
    }
  };

  const [gameStatus, setGameStatus] = useGame(time * 1000, statusUpdateHandler);

  useEffect(() => {
    if (shouldReset) {
      setGameStatus(1);
      setShouldReset(false);
    }
  }, [shouldReset, setGameStatus]);

  useNuiEvent("playMinigame", (minigame: Minigame) => {
    if (minigame.minigame !== "laptop-terminal") return;

    const data = minigame.data as {
      rows: number;
      columns: number;
      viewTime: number;
      typeTime: number;
      answersNeeded: number;
    };

    setRow(data.rows);
    setColumn(data.columns);
    setViewTime(data.viewTime);
    setTypeTime(data.typeTime);
    setAnswersNeeded(data.answersNeeded);
    setTime(data.viewTime + data.typeTime);

    setShouldReset(true);
  });

  useEffect(() => {
    setSettingsRows(row);
    setSettingsColumns(column);
    setSettingsViewTime(viewTime);
    setSettingsTypeTime(typeTime);
    setTime(viewTime + typeTime);
    setAnswersNeeded(answersNeeded);
  }, [row, column, viewTime, typeTime, answersNeeded]);

  const settings = {
    handleSave: () => {
      setRow(settingsRows);
      setColumn(settingsColumns);
      setViewTime(settingsViewTime);
      setTypeTime(settingsTypeTime);
      setTime(settingsViewTime + settingsTypeTime);
      setAnswersNeeded(settingsAnswersNeeded);
    },

    handleReset: () => {
      setSettingsRows(row);
      setSettingsColumns(column);
      setSettingsViewTime(viewTime);
      setSettingsTypeTime(typeTime);
      setSettingsAnswersNeeded(answersNeeded);
      setGameStatus(4);
    },

    children: (
      <div className="flex flex-col items-center">
        <SettingsRange
          title={"Number of Rows"}
          min={2}
          max={4}
          value={settingsRows}
          setValue={setSettingsRows}
        />
        <SettingsRange
          title={"Number of Columns"}
          min={2}
          max={5}
          value={settingsColumns}
          setValue={setSettingsColumns}
        />
        <SettingsRange
          title={"View Time"}
          min={5}
          max={60}
          value={settingsViewTime}
          setValue={setSettingsViewTime}
        />
        <SettingsRange
          title={"Type Time"}
          min={5}
          max={60}
          value={settingsTypeTime}
          setValue={setSettingsTypeTime}
        />
        <SettingsRange
          title={"Answers Needed"}
          min={1}
          max={5}
          value={settingsTypeTime}
          setValue={setSettingsTypeTime}
        />
      </div>
    ),
  };

  useEffect(() => {
    if (isEnvBrowser()) {
      startGame();
    }
  }, []);

  const resetGame = async () => {
    if (isEnvBrowser()) {
      setGameStatus(1);
    } else {
      const result = gameStatus === 3 ? true : false;

      await finishMinigame(result);
      navigate("/");
    }
  };

  useEffect(() => {
    if (timeLeft > 0 && result === "inprogress") {
      const reducedTime = timeLeft - 0.1;
      setTimeout(() => {
        setTimeLeft(reducedTime);
        setProgress((reducedTime / time) * 100);
      }, 100);

      if (timeLeft <= typeTime) {
        setPrepmode(false);
      }
    }
  }, [timeLeft, result, column, time, progress, typeTime]);

  useEffect(() => {
    if (!prepmode) {
      setEntries([{ q: questionSet[0].q, a: "" }]);
      inputRef.current?.focus();
    }
  }, [prepmode, questionSet]);

  const startGame = () => {
    const generatedShapesBoard = generateShapesBoard(row, column);
    setShapesBoard(generatedShapesBoard);
    const generatedAnswerOptions = shuffle(
      generateAnswerOptions(row, column)
    ).slice(0, answersNeeded);
    setQuestionSet(
      generateQuestionSet(generatedShapesBoard, generatedAnswerOptions)
    );
    setPrepmode(true);
    setEntries([]);
    setResult("inprogress");
    setTimeLeft(time);
  };

  const checkKeyInput = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submitAnswer();
  };

  const handleWin = (message: string) => {
    console.log(`Win: ${message}`);
    setGameStatus(3);
  };

  const handleLose = (message: string) => {
    console.log(`Lose: ${message}`);
    setGameStatus(2);
  };

  const submitAnswer = () => {
    if (result !== "inprogress" || prepmode) return;
    const lastQ = entries[entries.length - 1];
    lastQ.a = answerInput;
    const curEntries = [...entries];
    curEntries.splice(curEntries.length - 1, 1, lastQ);
    const comp = compareAnswers(questionSet, curEntries);
    if (comp && curEntries.length === questionSet.length) {
      handleWin("S U C C E S S !");
      setEntries(curEntries);
      setAnswerInput("");
    } else if (!comp) {
      handleLose("F A I L E D !");
      setEntries(curEntries);
      setAnswerInput("");
    } else {
      setEntries([
        ...curEntries,
        { q: questionSet[curEntries.length].q, a: "" },
      ]);
      setAnswerInput("");
    }
  };

  return (
    <HackContainer
      title={"Terminal"}
      description={"Replicate the sequence"}
      buttons={[]}
      countdownDuration={time * 1000}
      resetCallback={resetGame}
      resetDelay={3000}
      status={gameStatus}
      setStatus={setGameStatus}
      statusMessage={getStatusMessage(gameStatus)}
      settings={settings}
      className="w-2/3"
    >
      <div className="flex flex-col items-start border-muted w-full h-[60vh] gap-2 bg-[rgb(0_0_0/0.8)] rounded-lg p-5">
        {prepmode &&
          shapesBoard.map((row, i) => (
            <div
              key={`row-${i}`}
              className="relative flex flex-col h-full items-start gap-2 text-sm font-bold"
            >
              <span className="text-teal-400">{`SEQUENCE  ${i + 1}`}</span>
              <div className="flex flex-row items-center gap-8">
                {row.shapes.map((col, j) => (
                  <div
                    key={`cell-${i}-${j}`}
                    className={`flex w-24 h-24 items-center justify-center`}
                  >
                    {col === "square" && (
                      <Square height={96} width={96} color={row.color} />
                    )}
                    {col === "circle" && (
                      <Circle height={96} width={96} color={row.color} />
                    )}
                    {col === "triangle" && (
                      <Triangle height={96} width={96} color={row.color} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        {!prepmode && (
          <div className="relative h-full w-full flex flex-col">
            {entries.map((entry, i) => (
              <div
                key={i}
                className="relative h-fit flex flex-col gap-2 fon-semibold text-lg"
              >
                <div className="text-teal-400">{entry.q}</div>
                {entry.a && (
                  <div className="text-white text-2xl">&#62; {entry.a}</div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="relative flex w-full h-[50px] flex-row items-start space-x-2">
          <input
            type="text"
            placeholder="Type  answer  here"
            value={answerInput}
            onChange={(e) => setAnswerInput(e.target.value.toLowerCase())}
            onKeyUp={(e) => checkKeyInput(e)}
            className="relative border-muted-foreground w-full h-[50px] border-2 border-[rgb(255_255_255/0.7)] rounded-md p-2 text-white outline-none cursor-auto bg-[rgb(255_255_255/0.1)] font-sans text-md"
            ref={inputRef}
          />
          <button
            className="border-muted-foreground hover:text-secondary hover:bg-primary w-[50px] h-[50px] flex items-center justify-center rounded-md text-[#38a2e5] bg-[rgb(56_163_229/0.4)]"
            onClick={submitAnswer}
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </div>
      </div>
    </HackContainer>
  );
};

export default LaptopTerminal;

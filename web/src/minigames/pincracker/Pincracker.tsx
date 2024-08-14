"use client";

import { FC, useEffect, useState } from "react";
import HackContainer from "../../components/HackContainer";
import { SettingsRange } from "../../components/Settings";
import {
  failedPlayer,
  checkBeepPlayer,
  successPlayer,
} from "../../assets/audio/AudioManager";
import useGame from "../../hooks/useGame";
import { useKeyDown } from "../../hooks/useKeyDown";
import { Digit, Digits } from "./utils";
import { useNuiEvent } from "../../hooks/useNuiEvent";
import { Minigame } from "../../types/general";
import { isEnvBrowser } from "../../utils/misc";
import { finishMinigame } from "../../utils/finishMinigame";
import { useNavigate } from "react-router-dom";

const defaultDuration = 20;

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
      return "Sometimes you win :O";
    case 4:
      return "Reset!";
    default:
      return `Error: Unknown game status ${status}`;
  }
};

const Pincracker: FC = () => {
  const [timer, setTimer] = useState(defaultDuration);
  const [settingsDuration, setSettingsDuration] = useState(defaultDuration);
  const [activeIndex, setActiveIndex] = useState(0);
  const [allowKeyDown, setAllowKeyDown] = useState(true);
  const [pinLength, setPinLength] = useState(4);
  const [pin, setPin] = useState<Digit[]>();
  const [shouldReset, setShouldReset] = useState(false);
  const navigate = useNavigate();

  const statusUpdateHandler = (newStatus: number) => {
    switch (newStatus) {
      case 1:
        setAllowKeyDown(false);
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
      setGameStatus(1);
      setShouldReset(false);
    }
  }, [shouldReset, setGameStatus]);

  useNuiEvent("playMinigame", (minigame: Minigame) => {
    if (minigame.minigame !== "pincracker") return;

    const data = minigame.data as {
      pinLength: number;
      timer: number;
    };

    setPinLength(data.pinLength);
    setTimer(data.timer);
    setShouldReset(true);
  });

  const handleCrack = () => {
    if (activeIndex < pinLength) {
      console.log("Incomplete pin");
    } else {
      const wrappers = document.querySelectorAll(".wrapper");
      const markers = document.querySelectorAll(".marker");
      const digits = document.querySelectorAll(".digit");
      const guess = Array.from(digits).map((d) => d.innerHTML as Digit);
      setAllowKeyDown(false);

      for (let i = 0; i < pinLength; i++) {
        setTimeout(() => {
          // Play the check beep audio
          checkBeepPlayer.play();

          // Remove the background color of the previous wrapper if it exists
          if (i > 0) {
            wrappers[i - 1].classList.remove(
              "bg-gradient-radial",
              "from-spring-green-300",
              "to-turquoise-900/50"
            );
          }

          // Add the background color to the current wrapper
          wrappers[i].classList.add(
            "bg-gradient-radial",
            "from-spring-green-300",
            "to-turquoise-900/50"
          );

          markers[i].classList.remove("bg-slate-400");
          markers[i].classList.remove("bg-green-400");
          markers[i].classList.remove("bg-yellow-400");
          markers[i].classList.remove("bg-red-400");
          // Process the guess and set marker colors
          if (pin && guess[i] === pin[i]) {
            // Correct digit, set it green
            markers[i].classList.add("bg-green-400");
          } else if (pin && pin.includes(guess[i])) {
            // Incorrect position, but digit is in pin
            markers[i].classList.add("bg-yellow-400");
          } else {
            // Incorrect digit
            markers[i].classList.add("bg-red-400");
          }

          // Remove the background color from the current wrapper after processing
          setTimeout(() => {
            wrappers[i].classList.remove(
              "bg-gradient-radial",
              "from-spring-green-300",
              "to-turquoise-900/50"
            );
          }, 250); // Remove the background color 500ms after processing
        }, i * 250); // Staggered delay for each iteration
      }

      setTimeout(() => {
        if (pin && guess.join("") === pin.join("")) {
          setGameStatus(3);
        }
        setActiveIndex(0);
        clearBoard(250);
      }, 1000);
    }
  };

  const clearBoard = (delay: number) => {
    const digits = document.querySelectorAll(".digit");
    for (let i = pinLength - 1; i > -1; i--) {
      setTimeout(() => {
        digits[i].innerHTML = "";
      }, (pinLength - i) * delay);
    }

    setTimeout(() => {
      setAllowKeyDown(true);
    }, delay * pinLength);
  };

  const clearMarkings = () => {
    const markers = document.querySelectorAll(".marker");
    for (let i = 0; i < markers.length; i++) {
      markers[i].classList.remove("bg-green-400");
      markers[i].classList.remove("bg-yellow-400");
      markers[i].classList.remove("bg-red-400");
      markers[i].classList.add("bg-slate-400");
    }
  };

  function generatePin() {
    for (let i = Digits.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [Digits[i], Digits[j]] = [Digits[j], Digits[i]];
    }

    const newPin = Digits.slice(0, pinLength);
    setPin(newPin);
  }

  const resetBoard = () => {
    console.log(`Resetting cracker with ${timer} seconds`);
    setActiveIndex(0);
    generatePin();
    clearMarkings();
    clearBoard(0);
    setAllowKeyDown(true);
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

  const removeDigit = (idx: number) => {
    const digits = document.querySelectorAll(".digit");
    digits[idx].innerHTML = "";
  };

  const handleKeyDown = (key: string) => {
    if (key === "Enter") {
      handleCrack();
    } else if (key === "Backspace") {
      setActiveIndex(Math.max(activeIndex - 1, 0));
      removeDigit(Math.max(activeIndex - 1, 0));
    } else {
      if (activeIndex < pinLength) {
        const digits = document.querySelectorAll(".digit");
        digits[activeIndex].innerHTML = key.toString();
        setActiveIndex(activeIndex + 1);
      }
    }
  };

  useKeyDown(
    (key?: string) => {
      if (allowKeyDown && key && gameStatus == 1) {
        handleKeyDown(key);
      }
    },
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "Backspace", "Enter"]
  );

  useEffect(() => {
    if (gameStatus === 3) {
      successPlayer.play();
    }
  }, [gameStatus]);

  const settings = {
    handleSave: () => {
      setTimer(settingsDuration);
      setGameStatus(4);
    },

    handleReset: () => {
      setSettingsDuration(defaultDuration);
      setGameStatus(4);
    },

    children: (
      <div className="flex flex-col items-center">
        <SettingsRange
          title={"Pin Length"}
          min={2}
          max={6}
          value={pinLength}
          setValue={setPinLength}
        />
        <SettingsRange
          title={"Duration (seconds)"}
          min={5}
          max={30}
          value={settingsDuration}
          setValue={setSettingsDuration}
        />
      </div>
    ),
  };

  return (
    <HackContainer
      title="PinCracker"
      description="Decode digits of the pin code"
      buttons={[
        [
          {
            label: "Crack",
            color: "green",
            callback: handleCrack,
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
    >
      <div
        className="
            h-32 w-[600px] max-w-full
            rounded-lg
            bg-[rgb(22_40_52)]
            flex items-center justify-between
            text-white text-5xl
          "
      >
        {[...Array(pinLength)].map((_, index) => (
          <div
            key={index}
            className="flex flex-col items-center justify-center w-3/12 h-full gap-3 rounded-md wrapper"
          >
            <div className="h-[50px] digit"></div>
            <div className="px-5 h-1 bg-slate-400 marker" />
          </div>
        ))}
      </div>
    </HackContainer>
  );
};

export default Pincracker;

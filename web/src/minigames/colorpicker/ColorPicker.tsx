"use client";

import { FC, useEffect, useState } from "react";
import classNames from "classnames";

import HackContainer from "../../components/HackContainer";
import { SettingsRange } from "../../components/Settings";
import usePersistantState from "../../hooks/usePersistentState";
import useGame from "../../hooks/useGame";
import { Colors, Icons } from "./utils";
import { useKeyDown } from "../../hooks/useKeyDown";
import { failedPlayer, successPlayer } from "../../assets/audio/AudioManager";

interface IconObject {
  icon: string;
  color: {
    name: string;
    hex: string;
  };
}

const getStatusMessage = (status: number | undefined) => {
  switch (status) {
    case 0:
      return "";
    case 1:
      return "";
    case 2:
      return "You suck at this :D";
    case 3:
      return "Sometimes you win :O";
    case 4:
      return "Reset!";
    default:
      return `Error: Unknown game status ${status}`;
  }
};

const Wait = (seconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

const defaultIcons = 3;
const defaultTypeTime = 7;
const defaultViewTime = 6;
const shuffleTimes = 5;

const ColorPicker: FC = () => {
  const [icons, setIcons] = usePersistantState(
    "colorpicker-icons",
    defaultIcons
  );
  const [typeTime, setTypeTime] = usePersistantState(
    "colorpicker-type-time",
    defaultTypeTime
  );
  const [viewTime, setViewTime] = usePersistantState(
    "colorpicker-view-time",
    defaultViewTime
  );

  const [settingsIcons, setSettingsIcons] = useState(defaultIcons);
  const [settingsTypeTime, setSettingsTypeTime] = useState(defaultTypeTime);
  const [settingsViewTime, setSettingsViewTime] = useState(defaultViewTime);

  const settings = {
    handleSave: () => {
      setIcons(settingsIcons);
      setTypeTime(settingsTypeTime);
      setViewTime(settingsViewTime);
    },

    handleReset: () => {
      setIcons(defaultIcons);
      setTypeTime(defaultTypeTime);
      setViewTime(defaultViewTime);
    },

    children: (
      <div className="flex flex-col items-center">
        <SettingsRange
          title={"Number of icons"}
          min={1}
          max={5}
          value={settingsIcons}
          setValue={setSettingsIcons}
        />
        <SettingsRange
          title={"Type time"}
          min={3}
          max={10}
          value={settingsTypeTime}
          setValue={setSettingsTypeTime}
        />
        <SettingsRange
          title={"View time"}
          min={3}
          max={10}
          value={settingsViewTime}
          setValue={setSettingsViewTime}
        />
      </div>
    ),
  };

  const resetBoard = () => {
    setInputShown(false);
    setShuffled(false);
    setCurrentIcons([]);
    setGameIcons([]);
    setInputText("");
  };

  const resetGame = () => {
    setGameStatus(0);
  };

  const statusUpdateHandler = (newStatus: number) => {
    switch (newStatus) {
      case 1:
        console.log("Reset game");
        resetBoard();
        break;
    }
  };

  const [gameStatus, setGameStatus] = useGame(
    (typeTime + viewTime) * 1000,
    statusUpdateHandler
  );

  // Start of game logic
  const [currentIcons, setCurrentIcons] = useState<IconObject[]>([]);
  const [gameIcons, setGameIcons] = useState<IconObject[]>([]);
  const [shuffled, setShuffled] = useState(false);
  const [inputShown, setInputShown] = useState(false);
  const [inputText, setInputText] = useState("");

  const generateIcon = () => {
    setGameIcons((prevGameIcons) => {
      const icon =
        prevGameIcons[Math.floor(Math.random() * prevGameIcons.length)];
      setCurrentIcons([icon]);
      return prevGameIcons.filter((i) => i !== icon);
    });
  };

  function getUniqueIconColorCombination(
    existingCombinations: IconObject[]
  ): IconObject {
    let isUnique = false;
    let newCombination: IconObject = { icon: "", color: { name: "", hex: "" } };

    while (!isUnique) {
      const randomIcon = Icons[Math.floor(Math.random() * Icons.length)];
      const randomColor = Colors[Math.floor(Math.random() * Colors.length)];
      newCombination = {
        icon: randomIcon,
        color: randomColor,
      };

      // Check if the new combination exists in the existingCombinations array
      isUnique = !existingCombinations.some(
        (combination: IconObject) =>
          combination.icon === newCombination.icon ||
          combination.color.name === newCombination.color.name ||
          combination.color.hex === newCombination.color.hex
      );
    }

    // Once a unique combination is found, return it
    return newCombination;
  }

  useEffect(() => {
    if (gameStatus === 0) {
      const startGame = async () => {
        for (let i = 0; i < shuffleTimes; i++) {
          const newIcons: IconObject[] = [];
          for (let j = 0; j < icons; j++) {
            // Currently it just gets a random icon and color, but the thing is they shouldnt repeat themselves
            // Make it so that it gets a random icon and color, but if it already exists in the array, it should get another one
            const uniqueCombination: IconObject =
              getUniqueIconColorCombination(newIcons);
            newIcons.push(uniqueCombination);
          }

          setCurrentIcons(newIcons);
          setGameIcons(newIcons);

          await Wait(0.5);
        }

        setShuffled(true);

        await Wait(viewTime);

        setInputShown(true);
        setShuffled(false);

        generateIcon();
      };

      startGame();
    }
  }, [gameStatus, icons, viewTime]);

  const checkInput = () => {
    const icon = currentIcons[0];
    if (icon.color.name.toLowerCase() === inputText.toLowerCase()) {
      console.log(gameIcons.length);

      if (gameIcons.length === 0) {
        setGameStatus(3);
        successPlayer.play();
      } else {
        generateIcon();
        setInputText("");
      }
    } else {
      setGameStatus(2);
      failedPlayer.play();
    }
  };

  useKeyDown(
    (key?: string) => {
      if (key && gameStatus == 1 && inputShown) {
        checkInput();
      }
    },
    ["Enter"]
  );

  return (
    <HackContainer
      title="Color Picker"
      description="Match the icons with their color"
      buttons={[]}
      countdownDuration={(shuffleTimes * 0.5 + (typeTime + viewTime)) * 1000}
      resetCallback={resetGame}
      resetDelay={3000}
      status={gameStatus}
      setStatus={setGameStatus}
      statusMessage={getStatusMessage(gameStatus)}
      settings={settings}
    >
      {!shuffled && !inputShown && (
        <div className="text-white text-2xl text-center mb-4">
          Shuffling icons...
        </div>
      )}
      {shuffled && !inputShown && (
        <div className="text-white text-2xl text-center mb-4">
          Memorize these icons
        </div>
      )}
      {inputShown && (
        <div className="text-white text-2xl text-center mb-4">
          Enter the color of the shape below
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-12">
        {currentIcons.map((icon, index) => (
          <i
            key={index}
            className={classNames(`fa-solid fa-${icon.icon} text-5xl`)}
            // style={{ color: inputShown ? "white" : icon.color.hex }}
            style={{ color: icon.color.hex }}
          ></i>
        ))}
      </div>
      {inputShown && (
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          ref={(input) => input && input.focus()}
          className="relative w-2/3 h-[45px] text-white mt-4 text-center text-2xl left-1/2 -translate-x-1/2 bg-mirage-900/50 border-2 focus:border-[#38a2e5] rounded-md outline-none cursor-auto"
        />
      )}
    </HackContainer>
  );
};

export default ColorPicker;

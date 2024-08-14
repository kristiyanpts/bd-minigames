"use client";

import { useCallback, useState } from "react";
import { generate } from "random-words";
import HackContainer from "../../components/HackContainer";
import useGame from "../../hooks/useGame";
import { failedPlayer, successPlayer } from "../../assets/audio/AudioManager";

const getStatusMessage = (status: number | undefined) => {
  switch (status) {
    case 0:
      return "Reset!";
    case 1:
      return "";
    case 2:
      failedPlayer.play();
      return "You suck at this :D";
    case 3:
      successPlayer.play();
      return "Succeeded!";
    default:
      return `Error: Unknown game status ${status}`;
  }
};

export default function WordMemory() {
  const countdownDuration = 25; // TODO: Get the actual speed
  const maxRounds = 25;

  const statusUpdateHandler = (newStatus: number) => {
    switch (newStatus) {
      case 1:
        console.log("Reset game");
        setRandomWord();
        setCurrentRound(0);
        setSeenWords([]);
        setAvailableWords(getRandomWords());
        break;
    }
  };
  const getRandomWords = () => {
    return generate(maxRounds / 2) as string[]; // half as many words as rounds
  };

  const [gameStatus, setGameStatus] = useGame(
    countdownDuration,
    statusUpdateHandler
  );

  const [currentRound, setCurrentRound] = useState(0);
  const [currentWord, setCurrentWord] = useState<string>();
  const [seenWords, setSeenWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState(getRandomWords);

  const setRandomWord = useCallback(() => {
    setSeenWords((v) => v.concat([currentWord as string]));
    setCurrentWord(
      availableWords[Math.floor(Math.random() * availableWords.length)]
    );
  }, [availableWords, currentWord]);

  const resetGame = () => {
    setGameStatus(1);
  };

  const handleWin = (message: string) => {
    console.log(`Win: ${message}`);

    setGameStatus(3);
  };

  const handleLose = (message: string) => {
    console.log(`Lose: ${message}`);

    setGameStatus(2);
  };

  const nextRound = () => {
    if (currentRound >= maxRounds) {
      handleWin("All rounds completed");
    } else {
      setCurrentRound((v) => v + 1);
      setRandomWord();
    }
  };

  const handleSeen = () => {
    if (seenWords.includes(currentWord as string)) {
      nextRound();
    } else {
      handleLose(`${currentWord} not seen yet (${seenWords})`);
    }
  };

  const handleNew = () => {
    if (!seenWords.includes(currentWord as string)) {
      nextRound();
    } else {
      handleLose(`${currentWord} already seen (${seenWords})`);
    }
  };

  return (
    <HackContainer
      title="Word Memory"
      description="Memorize the words seen"
      buttons={[
        [
          {
            label: "Seen",
            color: "purple",
            callback: handleSeen,
            disabled: gameStatus !== 1,
          },
          {
            label: "New",
            color: "green",
            callback: handleNew,
            disabled: gameStatus !== 1,
          },
        ],
      ]}
      countdownDuration={countdownDuration * 1000}
      resetCallback={resetGame}
      resetDelay={3000}
      status={gameStatus}
      setStatus={setGameStatus}
      statusMessage={getStatusMessage(gameStatus)}
    >
      <p className="text-white text-2xl text-center w-full">
        {currentRound}/{maxRounds}
      </p>
      <div
        className="
                h-32 w-[750px] max-w-full
                rounded-lg
                bg-[rgb(22_40_52)]
                flex items-center justify-center
                text-white text-5xl
            "
      >
        <p>{currentWord}</p>
      </div>
    </HackContainer>
  );
}

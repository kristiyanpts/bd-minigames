// Will return whether the current environment is in a regular browser
// and not CEF
export const isEnvBrowser = (): boolean => !(window as any).invokeNative;

// Basic no operation function
export const noop = () => {};

export const shuffle = <T>(array: T[]): T[] => {
  // Create a copy of the array
  const result = [...array];

  let currentIndex = result.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [result[currentIndex], result[randomIndex]] = [
      result[randomIndex],
      result[currentIndex],
    ];
  }

  return result;
};

export function uniq<T>(arr: T[]): string {
  // Helper function to convert number to words
  function numberToWords(num: number): string {
    const words = [
      "zero",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve",
      "thirteen",
      "fourteen",
      "fifteen",
      "sixteen",
      "seventeen",
      "eighteen",
      "nineteen",
    ];
    const tens = [
      "",
      "",
      "twenty",
      "thirty",
      "forty",
      "fifty",
      "sixty",
      "seventy",
      "eighty",
      "ninety",
    ];

    if (num < 20) {
      return words[num];
    } else if (num < 100) {
      return (
        tens[Math.floor(num / 10)] +
        (num % 10 !== 0 ? "-" + words[num % 10] : "")
      );
    } else {
      return num.toString(); // For simplicity, only handles numbers less than 100
    }
  }

  // Create a Set from the array which will automatically filter out duplicate values
  const uniqueElements = new Set(arr);

  // The size property of the Set object gives the count of unique values
  const uniqueCount = uniqueElements.size;

  // Convert the count to words and return
  return numberToWords(uniqueCount);
}

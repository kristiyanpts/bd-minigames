local EnableCommands = true

local inMinigame = false
local result = nil

local function toggleNuiFrame(shouldShow)
  SetNuiFocus(shouldShow, shouldShow)
  SendReactMessage('setVisible', shouldShow)
end

function StartMinigame(data)
  inMinigame = data.minigame
  result = nil
  toggleNuiFrame(true)
  SendReactMessage('navigateMinigame', data)
  Wait(10)
  SendReactMessage('playMinigame', data)
  repeat
    SetNuiFocus(true, true)
    SetPauseMenuActive(false)
    DisableControlAction(0, 1, true)
    DisableControlAction(0, 2, true)
    Wait(0)
  until inMinigame == false
  return result
end

-- NUI Callbacks
RegisterNUICallback('hideFrame', function(_, cb)
  toggleNuiFrame(false)
  debugPrint('Hide NUI frame')
  cb({})
end)

RegisterNUICallback('finishedMinigame', function(minigameResult, cb)
  if minigameResult then
    result = true
    inMinigame = false
  else
    result = false
    inMinigame = false
  end

  toggleNuiFrame(false)
  debugPrint('Hide NUI frame')
  cb({})
end)

function Lockpick(title, levels, timer)
  if not title then title = "Lockpick" end
  if not levels then levels = 5 end
  if not timer then timer = 30 end

  local minigameData = {
    minigame = "lockpick",
    data = {
      title = title,
      levels = levels,
      timer = timer
    }
  }
  return StartMinigame(minigameData)
end

function Chopping(letters, timer)
  if not letters then letters = 12 end
  if not timer then timer = 30 end

  local minigameData = {
    minigame = "chopping",
    data = {
      letters = letters,
      timer = timer
    }
  }
  return StartMinigame(minigameData)
end

function PinCracker(pinLength, timer)
  if not pinLength then pinLength = 3 end
  if not timer then timer = 20 end

  local minigameData = {
    minigame = "pincracker",
    data = {
      pinLength = pinLength,
      timer = timer,
    }
  }
  return StartMinigame(minigameData)
end

function RoofRunning(rows, columns, timer)
  if not rows then rows = 5 end
  if not columns then columns = 5 end
  if not timer then timer = 30 end

  local minigameData = {
    minigame = "roof-running",
    data = {
      rows = rows,
      columns = columns,
      timer = timer,
    }
  }
  return StartMinigame(minigameData)
end

function Thermite(targetScore, rows, columns, timer)
  if not targetScore then targetScore = 20 end
  if not rows then rows = 7 end
  if not columns then columns = 7 end
  if not timer then timer = 30 end

  local minigameData = {
    minigame = "thermite",
    data = {
      targetScore = targetScore,
      rows = rows,
      columns = columns,
      timer = timer,
    }
  }
  return StartMinigame(minigameData)
end

function Terminal(rows, columns, viewTime, typeTime, answersNeeded)
  if not rows then rows = 4 end
  if not columns then columns = 2 end
  if not viewTime then viewTime = 20 end
  if not typeTime then typeTime = 10 end
  if not answersNeeded then answersNeeded = 4 end

  local minigameData = {
    minigame = "laptop-terminal",
    data = {
      rows = rows,
      columns = columns,
      viewTime = viewTime,
      typeTime = typeTime,
      answersNeeded = answersNeeded
    }
  }
  return StartMinigame(minigameData)
end

exports("Lockpick", Lockpick)
exports("Chopping", Chopping)
exports("PinCracker", PinCracker)
exports("RoofRunning", RoofRunning)
exports("Thermite", Thermite)
exports("Terminal", Terminal)

if EnableCommands then
  RegisterCommand("lockpick", function()
    local success = Lockpick("Lockpick", 2, 30)

    print("Minigame result: " .. tostring(success))
  end, false)

  RegisterCommand("chopping", function()
    local success = Chopping(12, 30)

    print("Minigame result: " .. tostring(success))
  end, false)

  RegisterCommand("pincracker", function()
    local success = PinCracker(3, 20)

    print("Minigame result: " .. tostring(success))
  end, false)

  RegisterCommand("roofrunning", function()
    local success = RoofRunning(5, 5, 30)

    print("Minigame result: " .. tostring(success))
  end, false)

  RegisterCommand("thermite", function()
    local success = Thermite(20, 7, 7, 30)

    print("Minigame result: " .. tostring(success))
  end, false)

  RegisterCommand("terminal", function()
    local success = Terminal(4, 2, 10, 30, 4)

    print("Minigame result: " .. tostring(success))
  end, false)
end

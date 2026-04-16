import React, { useState, useEffect, useMemo } from "react";

const OPEN_HOUR = 8; 
const CLOSE_HOUR = 18; 
const LEAD_TIME = 20; 
const HOURS_LIST = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
];
const MINUTES_LIST = ["00", "15", "30", "45"];
const PERIODS_LIST = ["AM", "PM"];

// Base Logic Function
const checkIsValid = (h, m, p) => {
  const now = new Date();
  const checkDate = new Date();

  let h24 = parseInt(h);
  if (p === "PM" && h24 !== 12) h24 += 12;
  if (p === "AM" && h24 === 12) h24 = 0;

  checkDate.setHours(h24, parseInt(m), 0, 0);

  const isWithinHours = h24 >= OPEN_HOUR && h24 < CLOSE_HOUR;
  const earliestPossible = new Date(now.getTime() + LEAD_TIME * 60000);

  return isWithinHours && checkDate >= earliestPossible;
};

export default function TimePicker({ onChange }) {
  // 1. Auto-Calculate the first valid time on initial load
  const initialTime = useMemo(() => {
    for (let p of PERIODS_LIST) {
      for (let h of HOURS_LIST) {
        for (let m of MINUTES_LIST) {
          if (checkIsValid(h, m, p)) return { h, m, p };
        }
      }
    }
    return { h: "08", m: "00", p: "AM" }; // Fallback
  }, []);

  const [hour, setHour] = useState(initialTime.h);
  const [minute, setMinute] = useState(initialTime.m);
  const [period, setPeriod] = useState(initialTime.p);

  // 2. The "Lookahead" functions to prevent deadlocks
  const canSelectHour = (h, p) =>
    MINUTES_LIST.some((m) => checkIsValid(h, m, p));
  const canSelectPeriod = (p) => HOURS_LIST.some((h) => canSelectHour(h, p));

  // 3. Safe Export to Parent
  useEffect(() => {
    const isValid = checkIsValid(hour, minute, period);
    if (onChange) {
      onChange(isValid ? `${hour}:${minute} ${period}` : null);
    }
  }, [hour, minute, period, onChange]);

  const currentCombinationValid = checkIsValid(hour, minute, period);

  return (
    <div className="flex flex-col gap-1 w-fit">
      <div className="flex items-center justify-between">
        {!currentCombinationValid && (
          <p className="text-[10px] font-bold text-red-500 animate-pulse">
            Invalid Time
          </p>
        )}
      </div>

      <div
        className={`flex items-center bg-white border-2 rounded-xl p-1 gap-1 shadow-sm transition-colors ${
          currentCombinationValid
            ? "border-gray-200"
            : "border-red-400 bg-red-50"
        }`}
      >
        {/* Hour Select */}
        <select
          value={hour}
          onChange={(e) => setHour(e.target.value)}
          className="bg-transparent font-bold text-sm px-2 py-1 focus:outline-none cursor-pointer appearance-none"
        >
          {HOURS_LIST.map((h) => (
            <option key={h} value={h} disabled={!canSelectHour(h, period)}>
              {h}
            </option>
          ))}
        </select>

        <span className="font-bold text-gray-400">:</span>

        {/* Minute Select */}
        <select
          value={minute}
          onChange={(e) => setMinute(e.target.value)}
          className="bg-transparent font-bold text-sm px-2 py-1 focus:outline-none cursor-pointer appearance-none"
        >
          {MINUTES_LIST.map((m) => (
            <option key={m} value={m} disabled={!checkIsValid(hour, m, period)}>
              {m}
            </option>
          ))}
        </select>

        {/* Period Control */}
        <div className="flex bg-gray-100 rounded-lg p-0.5 ml-1">
          {PERIODS_LIST.map((p) => {
            const disabled = !canSelectPeriod(p);
            return (
              <button
                key={p}
                type="button"
                disabled={disabled}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${
                  period === p
                    ? "bg-white text-green-700 shadow-sm"
                    : "text-gray-400"
                } ${disabled ? "opacity-20 cursor-not-allowed" : ""}`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

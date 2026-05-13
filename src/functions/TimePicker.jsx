import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezonePlugin from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);
dayjs.extend(customParseFormat);

const LEAD_TIME_MINUTES = 20;
const SLOT_INTERVAL_MINUTES = 15;

const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const DEFAULT_OPENING_HOURS = {
  monday: { open: "08:00", close: "18:00", closed: false },
  tuesday: { open: "08:00", close: "18:00", closed: false },
  wednesday: { open: "08:00", close: "18:00", closed: false },
  thursday: { open: "08:00", close: "18:00", closed: false },
  friday: { open: "08:00", close: "18:00", closed: false },
  saturday: { open: "08:00", close: "18:00", closed: false },
  sunday: { open: "08:00", close: "18:00", closed: false },
};

const roundUpToNextSlot = (dateTime) => {
  const minute = dateTime.minute();
  const remainder = minute % SLOT_INTERVAL_MINUTES;

  if (remainder === 0) {
    return dateTime.second(0).millisecond(0);
  }

  return dateTime
    .add(SLOT_INTERVAL_MINUTES - remainder, "minute")
    .second(0)
    .millisecond(0);
};

const buildStoreTime = ({ storeNow, time, timezone }) => {
  const storeDate = storeNow.format("YYYY-MM-DD");

  return dayjs.tz(`${storeDate} ${time}`, "YYYY-MM-DD HH:mm", timezone);
};

export default function TimePicker({
  timezone = "Africa/Lagos",
  openingHours = DEFAULT_OPENING_HOURS,
  onChange,
}) {
  const [selectedValue, setSelectedValue] = useState("");

  const { timeSlots, availableSlots, storeClosedMessage } = useMemo(() => {
    const storeNow = dayjs().tz(timezone);
    const today = DAYS[storeNow.day()];
    const todayHours = openingHours?.[today];

    if (!todayHours || todayHours.closed) {
      return {
        timeSlots: [],
        availableSlots: [],
        storeClosedMessage: "This store is closed today.",
      };
    }

    if (!todayHours.open || !todayHours.close) {
      return {
        timeSlots: [],
        availableSlots: [],
        storeClosedMessage: "Pickup hours are not available for this store.",
      };
    }

    const openTime = buildStoreTime({
      storeNow,
      time: todayHours.open,
      timezone,
    });

    const closeTime = buildStoreTime({
      storeNow,
      time: todayHours.close,
      timezone,
    });

    const minimumPickupTime = roundUpToNextSlot(
      storeNow.add(LEAD_TIME_MINUTES, "minute")
    );

    const slots = [];
    let cursor = openTime;

    while (cursor.isBefore(closeTime)) {
      const isPastStoreTime = cursor.isBefore(storeNow);
      const isBeforeMinimumPickupTime = cursor.isBefore(minimumPickupTime);

      const disabled = isPastStoreTime || isBeforeMinimumPickupTime;

      slots.push({
        label: cursor.format("hh:mm A"),
        value: cursor.toISOString(),
        localDateTime: cursor.format("YYYY-MM-DDTHH:mm:ss"),
        timezone,
        disabled,
      });

      cursor = cursor.add(SLOT_INTERVAL_MINUTES, "minute");
    }

    const enabledSlots = slots.filter((slot) => !slot.disabled);

    return {
      timeSlots: slots,
      availableSlots: enabledSlots,
      storeClosedMessage:
        enabledSlots.length === 0
          ? "This store may be closed or past pickup hours."
          : "",
    };
  }, [timezone, openingHours]);

  useEffect(() => {
    if (availableSlots.length === 0) {
      setSelectedValue("");
      onChange?.(null);
      return;
    }

    const stillValid = availableSlots.some(
      (slot) => slot.value === selectedValue
    );

    if (!selectedValue || !stillValid) {
      const firstSlot = availableSlots[0];

      setSelectedValue(firstSlot.value);

      onChange?.({
        displayTime: firstSlot.label,
        scheduledDateTime: firstSlot.value,
        localDateTime: firstSlot.localDateTime,
        storeTimezone: firstSlot.timezone,
      });
    }
  }, [availableSlots, selectedValue, onChange]);

  const handleChange = (e) => {
    const value = e.target.value;
    const selectedSlot = timeSlots.find((slot) => slot.value === value);

    if (!selectedSlot || selectedSlot.disabled) {
      onChange?.(null);
      return;
    }

    setSelectedValue(value);

    onChange?.({
      displayTime: selectedSlot.label,
      scheduledDateTime: selectedSlot.value,
      localDateTime: selectedSlot.localDateTime,
      storeTimezone: selectedSlot.timezone,
    });
  };

  if (timeSlots.length === 0 || availableSlots.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-sm font-bold text-red-500">
          No pickup time available today
        </p>
        <p className="text-xs text-gray-400">{storeClosedMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 w-fit">
      <select
        value={selectedValue}
        onChange={handleChange}
        className="select select-bordered rounded-xl font-bold text-sm bg-white"
      >
        {timeSlots.map((slot) => (
          <option key={slot.value} value={slot.value} disabled={slot.disabled}>
            {slot.label}
            {slot.disabled ? " — unavailable" : ""}
          </option>
        ))}
      </select>

      <p className="text-[10px] text-gray-400 font-semibold">
        Store time: {timezone}
      </p>
    </div>
  );
}

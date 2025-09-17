import React, { useState } from "react";
import { format, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, isWithinInterval, isBefore, isAfter } from "date-fns";

function getDaysInMonth(monthDate) {
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  const days = [];
  let day = start;
  while (isBefore(day, end) || isSameDay(day, end)) {
    days.push(day);
    day = addDays(day, 1);
  }
  return days;
}

export default function AnimatedRangeCalendar({ value, onChange }) {
  const [hovered, setHovered] = useState(null);
  const today = new Date();
  const [month, setMonth] = useState(today);
  const start = value?.start ? new Date(value.start) : null;
  const end = value?.end ? new Date(value.end) : null;

  const days = getDaysInMonth(month);

  function handleDayClick(day) {
    if (!start || (start && end)) {
      onChange({ start: day, end: null });
    } else if (start && !end) {
      if (isBefore(day, start)) {
        onChange({ start: day, end: start });
      } else {
        onChange({ start, end: day });
      }
    }
  }

  function handleDayHover(day) {
    setHovered(day);
  }

  function isSelected(day) {
    return (start && isSameDay(day, start)) || (end && isSameDay(day, end));
  }

  function isInRange(day) {
    if (start && end) {
      return isWithinInterval(day, { start, end });
    }
    if (start && hovered && !end) {
      if (isBefore(hovered, start)) {
        return isWithinInterval(day, { start: hovered, end: start });
      } else {
        return isWithinInterval(day, { start, end: hovered });
      }
    }
    return false;
  }

  return (
    <div style={{ width: 340, padding: 16, background: "rgba(255,255,255,0.95)", borderRadius: 16, boxShadow: "0 2px 16px rgba(44,62,80,0.10)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button onClick={() => setMonth(addDays(month, -30))} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>&lt;</button>
        <span style={{ fontWeight: 700, fontSize: 18 }}>{format(month, "MMMM yyyy")}</span>
        <button onClick={() => setMonth(addDays(month, 30))} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>&gt;</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginBottom: 8 }}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
          <div key={d} style={{ textAlign: "center", fontWeight: 600, color: "#6a82fb" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
        {days.map(day => {
          const selected = isSelected(day);
          const inRange = isInRange(day);
          const isToday = isSameDay(day, today);
          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              onMouseEnter={() => handleDayHover(day)}
              onMouseLeave={() => setHovered(null)}
              style={{
                height: 40,
                borderRadius: 12,
                border: selected ? "2px solid #fc5c7d" : inRange ? "2px solid #6a82fb" : "1px solid #eee",
                background: selected
                  ? "linear-gradient(90deg,#6a82fb 0%,#fc5c7d 100%)"
                  : inRange
                  ? "rgba(106,130,251,0.15)"
                  : isToday
                  ? "rgba(252,92,125,0.10)"
                  : "#fff",
                color: selected ? "#fff" : inRange ? "#6a82fb" : isToday ? "#fc5c7d" : "#222",
                fontWeight: selected ? 700 : 500,
                fontSize: 16,
                boxShadow: selected ? "0 2px 8px rgba(252,92,125,0.18)" : inRange ? "0 1px 4px rgba(106,130,251,0.10)" : "none",
                transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
                outline: "none",
                cursor: "pointer",
                position: "relative"
              }}
            >
              {format(day, "d")}
              {selected && (
                <span style={{
                  position: "absolute",
                  top: 4,
                  right: 8,
                  fontSize: 12,
                  color: "#fff",
                  fontWeight: 700,
                  opacity: 0.7
                }}>{isSameDay(day, start) ? "Start" : "End"}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

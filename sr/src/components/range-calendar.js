import React, { useState } from "react";
import { addDays, format } from "date-fns";

// Simple range calendar using native input for demo purposes
export const RangeCalendar = ({ value, onChange, ariaLabel }) => {
  const [start, setStart] = useState(value?.start || "");
  const [end, setEnd] = useState(value?.end || "");

  const handleStartChange = (e) => {
    setStart(e.target.value);
    onChange && onChange({ start: e.target.value, end });
  };
  const handleEndChange = (e) => {
    setEnd(e.target.value);
    onChange && onChange({ start, end: e.target.value });
  };

  return (
    <div aria-label={ariaLabel || "Range calendar"} style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input
        type="date"
        value={start}
        onChange={handleStartChange}
        style={{ marginRight: 8 }}
        aria-label="Start date"
      />
      <span>to</span>
      <input
        type="date"
        value={end}
        onChange={handleEndChange}
        aria-label="End date"
      />
    </div>
  );
};

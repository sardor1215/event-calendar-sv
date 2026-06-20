import React from "react";

/**
 * FloatingInput — bottom-border input with animated floating label.
 * Props:
 *   label, id, name, type, value, onChange, required, disabled,
 *   autoComplete, placeholder, rows (textarea), className
 */
const FloatingInput = ({
  label,
  id,
  name,
  type = "text",
  value,
  onChange,
  required,
  disabled,
  autoComplete,
  placeholder = " ",
  rows,
  className = "",
  ...rest
}) => {
  const inputClass =
    "peer h-full w-full border-b border-gray-300 bg-transparent pt-4 pb-1.5 text-base font-normal text-gray-800 outline-none transition-all placeholder:opacity-0 focus:placeholder:opacity-100 focus:border-yellow-400 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:border-0 disabled:bg-gray-50 " +
    className;

  const labelClass =
    "after:content-[''] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none overflow-visible truncate text-[12px] font-normal leading-tight text-gray-500 transition-all " +
    "after:absolute after:-bottom-1.5 after:block after:w-full after:scale-x-0 after:border-b-2 after:border-yellow-400 after:transition-transform after:duration-300 " +
    "peer-placeholder-shown:text-base peer-placeholder-shown:leading-[4.25] peer-placeholder-shown:text-gray-400 " +
    "peer-focus:text-[12px] peer-focus:leading-tight peer-focus:text-gray-700 peer-focus:after:scale-x-100 " +
    "peer-disabled:text-transparent peer-disabled:peer-placeholder-shown:text-gray-400";

  return (
    <div className="relative w-full min-w-[200px]" style={{ height: rows ? "auto" : "2.75rem" }}>
      {rows ? (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          rows={rows}
          className={inputClass + " resize-none pt-6"}
          {...rest}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={inputClass}
          {...rest}
        />
      )}
      {label && <label htmlFor={id} className={labelClass}>{label}</label>}
    </div>
  );
};

export default FloatingInput;

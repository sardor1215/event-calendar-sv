import * as React from "react";

export function IconEdit(props) {
  return (
    <svg
      viewBox="0 0 1024 1024"
      fill="currentColor"
      height="1em"
      width="1em"
      {...props}
    >
      <path d="M880 836H144c-17.7 0-32 14.3-32 32v36c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-36c0-17.7-14.3-32-32-32zm-622.3-84c2 0 4-.2 6-.5L431.9 722c2-.4 3.9-1.3 5.3-2.8l423.9-423.9a9.96 9.96 0 000-14.1L694.9 114.9c-1.9-1.9-4.4-2.9-7.1-2.9s-5.2 1-7.1 2.9L256.8 538.8c-1.5 1.5-2.4 3.3-2.8 5.3l-29.5 168.2a33.5 33.5 0 009.4 29.8c6.6 6.4 14.9 9.9 23.8 9.9z" />
    </svg>
  );
}

export function IconDone(props) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      height="1em"
      width="1em"
      {...props}
    >
      <path fill="currentColor" d="M13.5 2L6 9.5 2.5 6 0 8.5l6 6 10-10z" />
    </svg>
  );
}
export function IconDelete(props) {
  return (
    <svg
      viewBox="0 0 1024 1024"
      fill="currentColor"
      height="1em"
      width="1em"
      {...props}
    >
      <path d="M864 256H736v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zm-200 0H360v-72h304v72z" />
    </svg>
  );
}
export function IconForward(props) {
  return (
    <svg
      viewBox="0 0 900 1000"
      fill="currentColor"
      height="1em"
      width="1em"
      {...props}
    >
      <path d="M540 598c-140 0-250.667 15-332 45S57.333 738.667 0 840c2.667-13.333 7-31 13-53s22.667-61 50-117 59.333-105.333 96-148 88.667-81.667 156-117 142.333-53 225-53V160l360 322-360 334V598" />
    </svg>
  );
}
export function IconRefresh(props) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      height="1em"
      width="1em"
      {...props}
    >
      <path d="M23 4v6h-6M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}
export function IconBurger(props) {
  return (
    <svg fill="none" viewBox="0 0 15 15" height="1em" width="1em" {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M1.5 3a.5.5 0 000 1h12a.5.5 0 000-1h-12zM1 7.5a.5.5 0 01.5-.5h12a.5.5 0 010 1h-12a.5.5 0 01-.5-.5zm0 4a.5.5 0 01.5-.5h12a.5.5 0 010 1h-12a.5.5 0 01-.5-.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}
export function IconPerson(props) {
  return (
    <svg
      fill="currentColor"
      viewBox="0 0 16 16"
      height="1em"
      width="1em"
      {...props}
    >
      <path d="M11 6a3 3 0 11-6 0 3 3 0 016 0z" />
      <path
        fillRule="evenodd"
        d="M0 8a8 8 0 1116 0A8 8 0 010 8zm8-7a7 7 0 00-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 008 1z"
      />
    </svg>
  );
}
export function IconOpenTickets(props) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="currentColor"
      height="1em"
      width="1em"
      {...props}
    >
      <path d="M215.4 96H96v177.4L.2 202.5c1.6-18.1 10.9-34.9 25.7-45.8L48 140.3V96c0-26.5 21.5-48 48-48h76.6l49.9-36.9C232.2 3.9 243.9 0 256 0s23.8 3.9 33.5 11l49.9 37H416c26.5 0 48 21.5 48 48v44.3l22.1 16.4c14.8 10.9 24.1 27.7 25.7 45.8L416 273.4V96H215.4zM0 448V242.1l217.6 161.2c11.1 8.2 24.6 12.7 38.4 12.7s27.3-4.4 38.4-12.7L512 242.1V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64zm176-288h160c8.8 0 16 7.2 16 16s-7.2 16-16 16H176c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64h160c8.8 0 16 7.2 16 16s-7.2 16-16 16H176c-8.8 0-16-7.2-16-16s7.2-16 16-16z" />
    </svg>
  );
}
export function IconUsers(props) {
  return (
    <svg
      viewBox="0 0 640 512"
      fill="currentColor"
      height="1em"
      width="1em"
      {...props}
    >
      <path d="M144 160c-44.2 0-80-35.8-80-80S99.8 0 144 0s80 35.8 80 80-35.8 80-80 80zm368 0c-44.2 0-80-35.8-80-80s35.8-80 80-80 80 35.8 80 80-35.8 80-80 80zM0 298.7C0 239.8 47.8 192 106.7 192h42.7c15.9 0 31 3.5 44.6 9.7-1.3 7.2-1.9 14.7-1.9 22.3 0 38.2 16.8 72.5 43.3 96H21.3C9.6 320 0 310.4 0 298.7zM405.3 320h-.7c26.6-23.5 43.3-57.8 43.3-96 0-7.6-.7-15-1.9-22.3 13.6-6.3 28.7-9.7 44.6-9.7h42.7c58.9 0 106.7 47.8 106.7 106.7 0 11.8-9.6 21.3-21.3 21.3H405.3zm10.7-96c0 53-43 96-96 96s-96-43-96-96 43-96 96-96 96 43 96 96zM128 485.3c0-73.6 59.7-133.3 133.3-133.3h117.4c73.6 0 133.3 59.7 133.3 133.3 0 14.7-11.9 26.7-26.7 26.7H154.7c-14.7 0-26.7-11.9-26.7-26.7z" />
    </svg>
  );
}
export function IconUnits(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      height="1em"
      width="1em"
      {...props}
    >
      <path fill="none" d="M0 0h24v24H0z" />
      <path d="M9 19h3v-6.058L8 9.454l-4 3.488V19h3v-4h2v4zm12 2H3a1 1 0 01-1-1v-7.513a1 1 0 01.343-.754L6 8.544V4a1 1 0 011-1h14a1 1 0 011 1v16a1 1 0 01-1 1zm-5-10v2h2v-2h-2zm0 4v2h2v-2h-2zm0-8v2h2V7h-2zm-4 0v2h2V7h-2z" />
    </svg>
  );
}
export function IconDiagram(props) {
  return (
    <svg
      fill="currentColor"
      viewBox="0 0 16 16"
      height="1em"
      width="1em"
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M6 3.5A1.5 1.5 0 017.5 2h1A1.5 1.5 0 0110 3.5v1A1.5 1.5 0 018.5 6v1H14a.5.5 0 01.5.5v1a.5.5 0 01-1 0V8h-5v.5a.5.5 0 01-1 0V8h-5v.5a.5.5 0 01-1 0v-1A.5.5 0 012 7h5.5V6A1.5 1.5 0 016 4.5v-1zm-6 8A1.5 1.5 0 011.5 10h1A1.5 1.5 0 014 11.5v1A1.5 1.5 0 012.5 14h-1A1.5 1.5 0 010 12.5v-1zm6 0A1.5 1.5 0 017.5 10h1a1.5 1.5 0 011.5 1.5v1A1.5 1.5 0 018.5 14h-1A1.5 1.5 0 016 12.5v-1zm6 0a1.5 1.5 0 011.5-1.5h1a1.5 1.5 0 011.5 1.5v1a1.5 1.5 0 01-1.5 1.5h-1a1.5 1.5 0 01-1.5-1.5v-1z"
      />
    </svg>
  );
}
export function IconReport(props) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      height="1em"
      width="1em"
      {...props}
    >
      <path stroke="none" d="M0 0h24v24H0z" />
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <path d="M11 3 H13 A2 2 0 0 1 15 5 V5 A2 2 0 0 1 13 7 H11 A2 2 0 0 1 9 5 V5 A2 2 0 0 1 11 3 z" />
      <path d="M9 17v-5M12 17v-1M15 17v-3" />
    </svg>
  );
}

export function IconEye(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      height="1em"
      width="1em"
      {...props}
    >
      <path d="M23.5 17l-5 5-3.5-3.5 1.5-1.5 2 2 3.5-3.5 1.5 1.5M12 9a3 3 0 013 3 3 3 0 01-3 3 3 3 0 01-3-3 3 3 0 013-3m0-4.5c5 0 9.27 3.11 11 7.5-.25.65-.56 1.26-.92 1.85a5.77 5.77 0 00-1.9-.73l.64-1.12a9.821 9.821 0 00-17.64 0A9.821 9.821 0 0012 17.5l1.21-.07c-.14.5-.21 1.03-.21 1.57v.46l-1 .04c-5 0-9.27-3.11-11-7.5 1.73-4.39 6-7.5 11-7.5z" />
    </svg>
  );
}

export function IconCheckmarkDone(props) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="currentColor"
      height="1em"
      width="1em"
      {...props}
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={32}
        d="M464 128L240 384l-96-96M144 384l-96-96M368 128L232 284"
      />
    </svg>
  );
}

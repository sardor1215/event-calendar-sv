// icon:users-outline (Heroicons-inspired)
import * as React from "react";

function IconUsersOutline(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      width="1em"
      height="1em"
      {...props}
    >
      <path d="M16 14a4 4 0 10-8 0" />
      <circle cx="12" cy="7" r="3" />
      <path d="M6 18a6 6 0 1112 0v1H6v-1z" />
      <path d="M19 10a2.5 2.5 0 10-2.5-2.5" />
      <path d="M19.5 18v-1a4.5 4.5 0 00-3-4.243" />
    </svg>
  );
}

export default IconUsersOutline;



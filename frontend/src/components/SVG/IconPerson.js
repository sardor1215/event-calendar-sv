// icon:person-circle | Bootstrap https://icons.getbootstrap.com/ | Bootstrap
import * as React from "react";

function IconPerson(props) {
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

export default IconPerson;

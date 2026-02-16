import React, { Dispatch, SetStateAction, useState } from "react";
import {
  MdOutlineKeyboardArrowUp,
  MdOutlineKeyboardArrowDown,
} from "react-icons/md";
import { useColorMode } from "@/context/ColorModeContext";

interface DropdownProps {
  list: string[];
  title: string;
  setState: Dispatch<SetStateAction<any>>;
  state: any;
}

const Dropdown: React.FC<DropdownProps> = ({
  list,
  title,
  setState,
  state,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [value, setValue] = useState<string>("none");
  const { colorMode } = useColorMode();
  return (
    <div
      className={`w-full my-4 ${
        isOpen ? "relative" : ""
      }`}
    >
      <h1 className={`py-2 font-bold capitalize ${colorMode === "light" ? "text-gray-900" : "text-gray-100"}`}>
        {title}
      </h1>
      <div
        className={`h-auto w-full border font-medium rounded-lg overflow-hidden ${
          colorMode === "light"
            ? "bg-white border-gray-300 text-gray-900"
            : "bg-gray-800 border-gray-600 text-gray-100"
          }`}
      >
        <div
          className={`h-10 flex justify-between items-center ${isOpen ? "border-b" : ""} ${
            colorMode === "light" ? "border-gray-200" : "border-gray-600"
          }`}
        >
          <div className="p-2 flex items-center">{value}</div>
          <div
            className={`flex items-center justify-center p-2 cursor-pointer`}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <MdOutlineKeyboardArrowUp />
            ) : (
              <MdOutlineKeyboardArrowDown />
            )}
          </div>
        </div>
        {isOpen ? (
          <ul className="w-full select-none max-h-32 overflow-y-scroll">
            {list.map((item, index) => {
              if (value === item) {
                return null;
              } else {
                return (
                  <li
                    key={index}
                    onClick={() => {
                      setValue(item);
                      setIsOpen(!isOpen);
                      setState({ ...state, [title]: item });
                    }}
                    className={`${
                      colorMode === "light"
                        ? "hover:bg-gray-200"
                        : "hover:bg-gray-700"
                    } cursor-pointer p-2`}
                  >
                    {item}
                  </li>
                );
              }
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
};

export default Dropdown;

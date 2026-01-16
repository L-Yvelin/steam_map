import type { ChangeEventHandler, KeyboardEventHandler } from "react";
import classes from "./Input.module.css";
import Mag from "../../assets/svg/mag.svg?react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onKeyDown: KeyboardEventHandler<HTMLInputElement>;
  onSearch: () => void;
}

const Input = ({
  value,
  onChange,
  onKeyDown,
  onSearch,
  ...props
}: InputProps) => {
  return (
    <div className={classes.inputContainer}>
      <div className={classes.inputWrapper}>
        <input
          className={classes.input}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          {...props}
        />
      </div>
      <div className={classes.mag}>
        <Mag onClick={onSearch} />
      </div>
    </div>
  );
};

export default Input;

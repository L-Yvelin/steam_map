import classNames from "classnames";
import classes from "./Tab.module.css";

interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: () => void;
  active?: boolean;
}

const Tab = ({ onClick, className, active = false, ...props }: TabProps) => {
  return (
    <button
      className={classNames(classes.tab, className, {
        [classes.active]: active,
      })}
      {...props}
      onClick={onClick}
    />
  );
};

export default Tab;

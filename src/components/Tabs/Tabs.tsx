import classNames from "classnames";
import classes from "./Tabs.module.css";

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {}

const Tabs = ({ className, ...props }: TabsProps) => {
  return <div className={classNames(classes.tabs, className)} {...props}></div>;
};

export default Tabs;

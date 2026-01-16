import classNames from "classnames";
import classes from "./Empty.module.css";

interface EmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
}

const Empty = ({ message, className, ...props }: EmptyProps) => {
  return (
    <div className={classNames(classes.empty, className)} {...props}>
      {message ?? "Nothing yet."}
    </div>
  );
};

export default Empty;

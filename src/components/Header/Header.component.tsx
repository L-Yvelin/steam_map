import classes from "./Header.module.css";

const Header = () => {
  return (
    <div className={classes.header}>
      <img
        src="https://store.akamai.steamstatic.com/public/shared/images/header/logo_steam.svg?t=962016"
        height={35}
        alt="Link to the Steam Homepage"
      />
    </div>
  );
};

export default Header;

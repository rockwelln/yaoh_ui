import React from "react";
import { withRouter } from "react-router";

import "./styles.css";

const convert = crumb => {
  return crumb + " ";
};

const Title = ({ location }) => {
  const path = location.pathname.split("/").slice(1, 3);

  return (
    <h1 className={"capitalize"}>{path.map((item, i) => convert(item))}</h1>
  );
};

export default withRouter(Title);
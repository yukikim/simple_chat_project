import React from "react";
import ReactDOM from "react-dom";

fetch('/api/').then(response => {
  console.log(response.json());
})

export const Index = () => {
  return <div>Hello Kitty React!(src/client/index.js)</div>;
};

ReactDOM.render(<Index />, document.getElementById("index"));

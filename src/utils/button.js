import React from 'react';
import "./button.css"

export function FoldableButton({children, icon, ...props}) {
  return (
    <div className={"btn-foldable"} {...props}>
      <figure className={"btn-foldable icon"}>
        {icon}
      </figure>
      <span>
        {children}
      </span>
    </div>
  )
}

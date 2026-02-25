export const PrevButton = (props) => {
  const { children, ...restProps } = props;

  return (
    <button
      {...restProps}
    >
      <i className="bx bx-left-arrow-alt bx-sm"></i>
      {children}
    </button>
  );
};

export const NextButton = (props) => {
  const { children, ...restProps } = props;
  return (
    <button
      {...restProps}
    >
      <i className="bx bx-right-arrow-alt bx-sm"></i>
      {children}
    </button>
  );
};

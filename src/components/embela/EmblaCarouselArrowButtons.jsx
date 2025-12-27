export const PrevButton = (props) => {
  const { children, ...restProps } = props;

  return (
    <button
      className="touch-manipulation btn bg-success aspect-square w-10 px-0 flex justify-center items-center rounded-full me-5 cursor-pointer absolute bottom-2 left-29 lg:left-87 shadow"
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
      className="touch-manipulation btn bg-success aspect-square w-10 px-0 flex justify-center items-center rounded-full me-5 cursor-pointer absolute bottom-2 left-51 lg:left-105 shadow"
      {...restProps}
    >
      <i className="bx bx-right-arrow-alt bx-sm"></i>
      {children}
    </button>
  );
};

import type { ReactNode, SubmitEvent } from 'react';

interface FormProps {
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  children: ReactNode;
  className?: string;
}

const Form = ({ onSubmit, children, className }: FormProps) => {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(event);
      }}
      className={` ${className}`}
    >
      {children}
    </form>
  );
};

export default Form;

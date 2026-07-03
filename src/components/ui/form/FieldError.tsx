interface FieldErrorProps {
  message: string;
}

export function FieldError({ message }: FieldErrorProps) {
  return (
    <span role="alert" className="text-caption text-warning">
      {message}
    </span>
  );
}

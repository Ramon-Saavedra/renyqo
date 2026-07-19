interface FieldErrorProps {
  message: string;
  id?: string;
}

export function FieldError({ message, id }: FieldErrorProps) {
  return (
    <span id={id} role="alert" className="text-caption text-warning">
      {message}
    </span>
  );
}

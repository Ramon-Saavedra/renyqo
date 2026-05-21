interface WatermarkProps {
  text: string;
}

export function Watermark({ text }: WatermarkProps) {
  return (
    <span aria-hidden="true" className="watermark">
      {text}
    </span>
  );
}

import { BackgroundCanvas, type BackgroundCanvasProps } from "@rhs-ui/backgrounds/background-canvas";
export function ContourField(props: Omit<BackgroundCanvasProps, "pattern">): React.JSX.Element { return <BackgroundCanvas pattern="contours" {...props} />; }

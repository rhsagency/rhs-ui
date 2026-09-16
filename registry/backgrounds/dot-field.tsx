import { BackgroundCanvas, type BackgroundCanvasProps } from "@rhs-ui/backgrounds/background-canvas";
export function DotField(props: Omit<BackgroundCanvasProps, "pattern">): React.JSX.Element { return <BackgroundCanvas pattern="dots" {...props} />; }

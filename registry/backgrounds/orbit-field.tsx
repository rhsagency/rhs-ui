import { BackgroundCanvas, type BackgroundCanvasProps } from "@rhs-ui/backgrounds/background-canvas";
export function OrbitField(props: Omit<BackgroundCanvasProps, "pattern">): React.JSX.Element { return <BackgroundCanvas pattern="orbits" {...props} />; }

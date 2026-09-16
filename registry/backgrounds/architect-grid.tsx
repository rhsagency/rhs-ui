import { BackgroundCanvas, type BackgroundCanvasProps } from "@rhs-ui/backgrounds/background-canvas";
export function ArchitectGrid(props: Omit<BackgroundCanvasProps, "pattern">): React.JSX.Element { return <BackgroundCanvas pattern="grid" {...props} />; }

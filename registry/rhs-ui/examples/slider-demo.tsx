"use client";
import {useState} from "react";
import {Slider} from "@/registry/rhs-ui/ui/rhs-ui/slider";
export default function Demo():React.JSX.Element {const [value,setValue]=useState([65]);return <div className="w-full max-w-sm rounded-xl border border-border p-7"><div className="mb-7 flex justify-between text-sm"><span>Volume</span><output aria-live="polite">{value[0]}%</output></div><Slider value={value} onValueChange={setValue} thumbLabels={["Volume"]}/><p className="mt-5 text-xs text-muted-foreground">Drag the handle or use your arrow keys.</p></div>;}

"use client";
import { useState } from "react";
import { SegmentedControl } from "@rhs-ui/application/segmented-control";
export default function Demo(): React.JSX.Element { const [value,setValue]=useState("week"); return <div className="space-y-6 p-6"><SegmentedControl label="Report period" value={value} onValueChange={setValue} options={[{value:"day",label:"Today"},{value:"week",label:"This week"},{value:"month",label:"This month"}]} /><p role="status" className="text-sm text-muted-foreground">Showing the {value} report.</p></div>; }

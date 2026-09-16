"use client";
import { ActivityTimeline } from "@rhs-ui/application/activity-timeline";
export default function Demo(): React.JSX.Element { return <div className="w-full max-w-md p-8"><ActivityTimeline events={[{id:"1",title:"Project created",description:"A clean canvas, ready for the first idea.",time:"09:00",dateTime:"2026-09-16T09:00:00Z"},{id:"2",title:"Design approved",description:"The direction is set. Time to build.",time:"11:30",dateTime:"2026-09-16T11:30:00Z"},{id:"3",title:"Preparing the release",description:"The final checks are running.",time:"Now",active:true}]} /></div>; }

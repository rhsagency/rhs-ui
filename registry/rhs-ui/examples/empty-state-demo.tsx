"use client";
import {useState} from "react";
import {EmptyState} from "@/registry/rhs-ui/components/rhs-ui/empty-state";
import {Button} from "@/registry/rhs-ui/ui/rhs-ui/button";
export default function Demo():React.JSX.Element {const [created,setCreated]=useState(false);return <div className="w-full max-w-md">{created?<div className="rounded-xl border border-border p-8" role="status"><h3 className="text-xl">Your first project</h3><p className="my-4 text-sm text-muted-foreground">Created locally for this preview.</p><Button variant="outline" onClick={()=>setCreated(false)}>Reset demo</Button></div>:<EmptyState title="Room for your next idea." description="Start a project and give your work a place to grow." icon={<span className="text-3xl">+</span>}><Button onClick={()=>setCreated(true)}>Create a project</Button></EmptyState>}</div>;}

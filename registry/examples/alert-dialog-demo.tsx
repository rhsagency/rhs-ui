"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@rhs-ui/primitives/alert-dialog";
import { Button } from "@rhs-ui/primitives/button";

export default function Demo(): React.JSX.Element {
  const [last, setLast] = useState("The project is still here.");
  return (
    <div className="flex flex-col items-center gap-3">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">Delete project</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Northwind rebrand?</AlertDialogTitle>
            <AlertDialogDescription>The project, its 24 tasks and every file in it are removed for everyone. There is no undo.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLast("Kept. Nothing was deleted.")}>Keep project</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => setLast("Deleted. Not really: this is a preview.")}>
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {last}
      </p>
    </div>
  );
}

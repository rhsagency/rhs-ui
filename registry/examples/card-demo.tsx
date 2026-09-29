"use client";

import { useState } from "react";

import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { Progress } from "@rhs-ui/primitives/progress";

export default function Demo(): React.JSX.Element {
  const [shipped, setShipped] = useState(false);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Autumn launch</CardTitle>
        <CardDescription>The new storefront, from the first sketch to the first order.</CardDescription>
        <CardAction>
          <Badge variant={shipped ? "success" : "outline"}>{shipped ? "Live" : "In review"}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">Tasks done</span>
          <span className="font-medium tabular-nums">{shipped ? "24 of 24" : "21 of 24"}</span>
        </div>
        <Progress aria-label="Tasks done" value={shipped ? 24 : 21} max={24} />
      </CardContent>
      <CardFooter className="justify-end border-t border-border pt-6">
        <Button variant="ghost" onClick={() => setShipped(false)} disabled={!shipped}>
          Reopen
        </Button>
        <Button onClick={() => setShipped(true)} disabled={shipped}>
          {shipped ? "Launched" : "Launch"}
        </Button>
      </CardFooter>
    </Card>
  );
}

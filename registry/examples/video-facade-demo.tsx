"use client";

import { useState, type MouseEvent, type ReactNode } from "react";

import { VideoFacade } from "@rhs-ui/primitives/video-facade";

/* The posters are drawn as SVG at the shape of the frame, so the demo needs no files. */
const PALETTES = {
  sand: ["#f4ece0", "#e6d8c3", "#cdb89c", "#a98f73", "#6f5a48", "#3a2f27"],
  dusk: ["#d9d3cf", "#b9aeb0", "#8a7f8d", "#5d5668", "#37344a", "#1c1b2b"],
} as const;

function poster(kind: "dunes" | "sea", palette: keyof typeof PALETTES, w: number, h: number, seed: number): string {
  const p = PALETTES[palette];
  const c = (i: number) => p[Math.min(5, i)] ?? "#888";
  let n = seed * 7919 + 13;
  const rnd = () => {
    n = (n + 0x6d2b79f5) | 0;
    let t = Math.imul(n ^ (n >>> 15), 1 | n);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const f = (x: number) => Math.round(x * 10) / 10;
  const m = Math.min(w, h);
  const defs: string[] = [];
  const body: string[] = [];
  const grad = (id: string, a: string, b: string) => {
    defs.push(`<linearGradient id='${id}' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient>`);
    return `url(#${id})`;
  };
  const blur = (id: string, s: number) => {
    defs.push(`<filter id='${id}' x='-20%' y='-20%' width='140%' height='140%'><feGaussianBlur stdDeviation='${f(s)}'/></filter>`);
    return `filter='url(#${id})'`;
  };
  if (kind === "dunes") {
    body.push(`<rect width='${w}' height='${h}' fill='${grad("s", c(0), c(1))}'/>`, `<circle cx='${f(w * 0.66)}' cy='${f(h * 0.3)}' r='${f(m * 0.12)}' fill='${c(0)}' ${blur("b", m * 0.02)}/>`);
    for (let i = 0; i < 4; i++) {
      const y = h * (0.5 + i * 0.12);
      const a = h * (0.05 + rnd() * 0.06);
      body.push(`<path d='M${f(-w * 0.1)},${f(y + a)}C${f(w * 0.25)},${f(y - a * 1.6)} ${f(w * 0.45)},${f(y + a * 1.2)} ${f(w * 0.65)},${f(y - a * 0.4)}S${f(w * 0.95)},${f(y - a)} ${f(w * 1.1)},${f(y + a * 0.5)}V${h}H${f(-w * 0.1)}Z' fill='${grad("d" + i, c(i + 1), c(Math.min(5, i + 2)))}'/>`);
    }
  } else {
    const hz = h * 0.56;
    body.push(`<rect width='${w}' height='${f(hz)}' fill='${grad("s", c(1), c(0))}'/>`, `<rect y='${f(hz)}' width='${w}' height='${f(h - hz)}' fill='${grad("w", c(2), c(4))}'/>`, `<circle cx='${f(w * 0.62)}' cy='${f(hz - m * 0.07)}' r='${f(m * 0.12)}' fill='#fff' opacity='.8' ${blur("b", m * 0.02)}/>`);
    for (let i = 0; i < 16; i++) body.push(`<rect x='${f(w * 0.5 + (rnd() - 0.5) * m * 0.25)}' y='${f(hz + (h - hz) * (0.04 + (i / 16) * 0.9))}' width='${f(w * (0.05 + rnd() * 0.2) * (0.5 + i / 16))}' height='${f(1 + i * 0.4)}' rx='2' fill='#fff' opacity='${f(0.55 - i * 0.025)}'/>`);
    body.push(`<path d='M${f(w * 0.3 - m * 0.1)},${f(hz + m * 0.04)}h${f(m * 0.2)}l${f(-m * 0.035)},${f(m * 0.035)}h${f(-m * 0.13)}Z' fill='${c(5)}'/>`, `<path d='M${f(w * 0.3)},${f(hz - m * 0.12)}l${f(m * 0.07)},${f(m * 0.14)}h${f(-m * 0.07)}Z' fill='${c(5)}' opacity='.9'/>`);
  }
  defs.push(`<filter id='g' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' seed='${seed}' stitchTiles='stitch'/><feColorMatrix values='1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 .1'/></filter>`, `<radialGradient id='v' cx='.5' cy='.5' r='.75'><stop offset='.55' stop-color='#000' stop-opacity='0'/><stop offset='1' stop-color='#000' stop-opacity='.22'/></radialGradient>`);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' width='${w}' height='${h}'><defs>${defs.join("")}</defs>${body.join("")}<rect width='${w}' height='${h}' fill='url(#v)'/><rect width='${w}' height='${h}' filter='url(#g)'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const DUNES = poster("dunes", "sand", 1600, 900, 3);
const HARBOUR = poster("sea", "dusk", 900, 1600, 6);

/**
 * Three seconds of the dunes poster, a slow push in, as a WebM of a few kilobytes: a real file for the player to play.
 * Your own video goes in `src`.
 */
const CLIP = "data:video/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGFOAZwEAAAAAABetEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHWTbuMU6uEElTDZ1OsggE0TbuMU6uEHFO7a1OsgheX7AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmsCrXsYMPQkBNgIxMYXZmNjMuMS4xMDJXQYxMYXZmNjMuMS4xMDJEiYhAp3AAAAAAABZUrmvZrgEAAAAAAABQ14EBc8WIFKl4kJ8zG9ycgQAitZyDdW5kiIEAhoVWX1ZQOYOBASPjg4QC+vCA4JKwggHguoIBDpqBAlWwhFW5gQFV7oEA7AEAAAAAAAACAAASVMNn/nNzn2PAgGfImUWjh0VOQ09ERVJEh4xMYXZmNjMuMS4xMDJzc9ljwItjxYgUqXiQnzMb3GfIpEWjh0VOQ09ERVJEh5dMYXZjNjMuMS4xMDIgbGlidnB4LXZwOWfIoUWjiERVUkFUSU9ORIeTMDA6MDA6MDMuMDAwMDAwMDAwAB9DtnVV2ueBAKNFjoEAAICCSYNCAB3wENYKOCQcGHgQAfB/ifQ/K4F9b0P8n6M4PT+k/T8T9vD/Xh9L127we9ew+u9Vki9uWD3XExsEDZ332Of5x7vCiVLQHV/AKYAAAAAAAkhfJByAHASfvk71Ftjr3lzFQSCUKXsaOjH6wAraRRHdSwH2ULtkJ4IlQmsGibyT3fBb2F4CJA8eQEdVyHp68Prd1Fc4LEeTrCBw72NF2z7drqCjz+0vJKbpgL1PGRutFK/PHcupkCTefwivE/d/qy4j9DfoMHcBrwz3GX8HprwlVSfgkWgwVTn3aXJ1MjsPK/jHKy5wRoFMCsuDpOG8QaRtXQG7NwP4Yn+FSjxlMox9oOsWJgMIvfUjYSlQGlBbzjW6FLzPtwOGO4Q+rrc3gBBOuFGIRwkOrslHMXASVaQOkg4dZSq2r1s/NnGes9jbm8I/p15enlb5XDJAM66ZazEYRxY+bRSb6AEpW1YoFLCHGfyIE47opKyjmI3bRC+dFKR49D5jBdSeLqksdVkhPnI7FRhWor2UGBmKY8yU3gAsabDtA9GiG7wLAZpiMGQvqOqQqJBH/clqCG/JuxPgeYCuZF9kj4jbSQLgR8FFjJDc/XLmR8QH7rciZyEHTnXStqZQWjCxCMNrI3DVFStJv/wjVOoANP2tYSBy4k59cRVNyRqkHu633wj45J/F/ZOdB+VNy+uP+lV61d5b8ho3kWwxY0U0+1J8lMxjoghQ23RBedjHlUNDaJQG/Weul60nbOKBpzQwaLvsbZ2bkdrMicAAji5nISueMlBTM1iZF90N2XtBiFPplSXey53SJZ36gyOH58Q62KaOjfV94JAIuAX3T+aLfQgezC+cKcX74/QrdHhv1NeKMAUZShfGoS502SIpnUa2LHquAGljZjB/Az/NHKQyAXoRtY4or3jlOB4CrIx9cKQMw4XLL0VStfzlEVgJpdWGoJGc96kVI43y7JGdqTgiE0GF3zmidYhS1ZFzfhOdN6ykEDQvMgSVnfoEfhkZeoLeUZq6mK5c6z9A2dlMDdGUfNl8f+0DeMKSQjrg2pPnLCPa5sjo5PGSr0R1UZ4eHkZyczKYoWfFT/kvhis1XWxTHNihXWHFNQ1aueozb/H1DW5IhE3yuyPBOJTByjN9N4BcD/IJs9soqiW+QdYrC6fNydTityanSsdO1kMSCb5WlkBar77boIDhnZVabxD5h+um3e+KIVEyh6NCVIGmPAypGJAqz2HnJzU9j69C1bgXoZ70Nt9BlxjrrbMaUSX4K6mC6hlthSbHxfqj3bs0alUWM1kk1MijwiE4qlbYlQNYXXUkoaipP7WBYTb6skryL27ePnB6lLkeBNtJVAuVwp6e92wX7n//feOoOIfFQG9pJ8zzHm9xNJrERVDplyy/lPp7TpPwuJgyXNi69H68aSE0zsAKpvJHisbx0t7mOGQ41sVN4WUe39ZfsowlXpMIEdYSKu/+EtooWfA2I6aXM4mSsza1gRaoRpDh21zFgogX9yG2shIjzEeCLsaWhnIpZoYPln85o1WvnZBctpbEQSmBTIIybti3j9YMVEJSVDiL/MxbP1XZlAkdM5WSD4sCwb+RjlnitW9UCaKWVev+SQbDcyu4bm4buCjOXeV6FgXLsBqrJrb6FcuhcX10Vs6WQw4Xu8iRnK42L41LqE8n56y3tDHdXzKSsydk0nxaMV+9vGHnPUE9qmNhsWycr9zC+QmwOH8h0XGF4Tr2ppM1Y8jz8NH+KcvwhHUD4zTLIzRrIFU4Wqn/ADj6zfQbaCTJwf/7x+I7jz8EFf/41ASYlc0RENKWLV7LUAVgeGVVCs0A0BLLwtiEYR2WaI3RFD9gEUXHIPNOXyKPBQPuvtDF5ScgNArVObiKeoS5wktYR5F7UqVAgKPDgQAyAIYAQJKcQFMBAAKAYPUAAAAAAAAcWjJC6UWBLjDwdJVoir52g47yF4y1hWSCARFIqFonT9G/14PgDw6CtBpMkKO7gQBkAIYAQJKcKFHhAAMAYPoh4GAAAAAAEmEx8Jjwk00m+/avE0ickli+AGFAMcBAfXyPR6G3YrNBaLijuoEAlgCGAECSnDBTAQABgGAAAAAAABVkgk5aWlvaV/9v6yBTDNRCf2nrwABkgUQuORBfNf533L0iGgCjzoEAyACGAECSnERQgQABgGAAAAAAABVkgk588DNB0zB7eDqJJD7ipTmwUgBkhgRUyAWWFXUU0Q5tppBNgGF8NOhWH4fGnsxxf5N1klCWAKOsgQD6AIYAQJKcLFMBAAGAYAAAAAAAC2SBCO96VzHzHcwAZHdES6vn4QZ/mGCjs4EBLACGAECSnChR4QABgGAAAAAAAA5kgRyTSEcXBkDsctVeAGSDxawYPyFCK+zC8nz0SKPKgQFeAIYAQJKcJFMBAAMAYCnAQQAAAAAAHWSBiukxoM+9gd9r5Oc+LzUXPkFDP3Onf6EPJF2AZJjtRvmgUEhZ/VVMdIFcC1i4woCj4IEBkACGAECSnCxN4QADAGDVR9oAAAAAACll/efArkOshhGT/Y4/ZdU/nCY0YqRHnxC881FdiWOYwPNn/o8JdndtAGZ5qt2Xxse8H+sahOBvwxhGVSqQXGhyeY8VhJLxIqO1gQHCAIYAQJKcRFMBAAIAYBt4AAAAABBl26oQxlLyr1kaHbHrHmQAZbINx2gscUTSex/cwACj1oEB9ACGAMCS8RE3hAAIIG/MAAAAAChklDD1cjIn1elgKPlncDN2xu1DMCkmvMwyV4S43ss+qVxufqkKC3eAZNAYCcG9gPQ+AROfx+y9TnV00CprVekAo7CBAiYAhgBAkpwwUwEAAYBgAAAAAAAObF0/ANobAXU+PUaby4hsh0se31IxlbZyCyCjy4ECWACGAECSnCxQgQABgGAAAAAAABtsW+kjxXfZoee6IIMk1mPJGJwN1nukfmIn5jpsgloEJSOMJIfdt35+or+vhYEjGNu1mshOgKO6gQKKAIYAQJKcUFMBAAGAYAAAAAAAE2xdPCuZRvwdHxPVY7hJFiaQiwBsr/uI69H33RmXU5lnvCJ2JKPEgQK8AIYAQJKcRFHhAAGAYAAAAAAAFWxdZQFYrp5hXKx6LdNyZkYT/PyTsGwxWUdtVG8c/7gT718/Yt12YXepigIgzBijxYEC7gCGAECSnDxTAQABgGAAAAAAABtscg44SHt0cbaYEOAMjEElOd//9ZVbg6MC1mhsh0tN06q9FLFIrysMIvanCyGw8KPZgQMgAIYAQJKcME3hAAGAYAAAAAAAH2xyBUnKBTRaqPw7yLlZQkRKS3yqWYZeaVj3Hn/zAgBsy5YHK6RuAe99yxj0oaPbm5HUm/wNsZg+Cj3QiUL/9UEUtACju4EDUgCGAECSnChTAQABgGAAAAAAAA9u0L2CW8qVoBjyXAoUZABsihzw6DWtFY98Wz7jpjffeuQDQUF4o9aBA4QAhgBAkpwsUeEAAYBgAAAAAAAnWD1xCZgoO3+M7WcNWZQq5KaJZifIDJ4G5kkznXCqq288nvAro9xgbLsHLx17c8IedzYxIf6RZDNr3MbIokhlgKO9gQO2AIYAQJKcNFMBAAGAYAAAAAAAFln6d94+yzkYGUN7iMem4wPwcikEVgBsdQwtpQwWD/m1wD9FkCPFgKP4gQPoAIYAwJLwsTeEAAYgAAAAAAA3ayvhfTlhrBNyQNiw0G/c//1vmhbKboOwr0vamLZi9aiHyV5wreR0U/8PmoCT5fDPFnBfsFnLAGtZbTuwAQgd1rub3N7oJMplCMqA9e3vgK/DK9M+9+GW8dtDEz7gVUnqLa4Ao7KBBBoAhgBAkpwoUwEAAYBgAAAAAAAMV7+Zm/+y6em1hsAAbLsF+D4CUcYJV4GlcHuUYKO3gQRMAIYAQJKcJFHhAAGAYAAAAAAAEloYAfZae03KK58R+OZM53c4AGy7BrTOuPdS+IlKxigfrqO9gQR+AIYAQJKcMFMBAAGAYAAAAAAAEmX3+R+3rjwic8ErFKDf3QfcAGx+gvDzXdltuaHFP+GiokFnvYatbKPrgQSwAIYAQJKcME3hAAGAYAAAAAAALVoYdu7MX6Q6meAub4UOWklBmZ1LBP4YXQMm8OcAkNUGTjH6dKMPCRMOw3WXAG3dSsthxE47BmbTwnP26x7cbZB2ImguqrhCr/HWAuaKohSTNggMQSCjvoEE4gCGAECSnDBTAQABgGAAAAAAABJl9/mWcdvGPekqB/1Nnf7VVgBqTxdQWToSOlWjgI7XGImPk+uw1cAAo72BBRQAhgBAkpwoUeEAAYBgAAAAAAAUWB3HYgIOrDRSY5NxETCgBGupfxBqOfvhH6ynyidxcrD2eQqTYQHwo8WBBUYAhgBAkpwwUwEAAYBgAAAAAAAaZff5NPwLkrGMUCmwO2agl8WdTGjX+obq3gBszl6L+wN2DyAhWXjbQXReNWr9wACj3IEFeACGAECSnCRQgQABgGAAAAAAACpl/iiQxoB/AmmPkP5O3YUiAXwZNgTRbZQw48V8ggWFfOdih3MPjElrwABsXYKPsIAXDwQIy8pz1Si5iAK6oP66raaxNq+Ao72BBaoAhgBAkpwsUwEAAYBgAAAAAAATWBgwZZ9FZwzoIgZ+jOFexovAAGx/NG87PgH9lVEIcjx3VoHxuj2Ao92BBdwAhgDAkpwoTeEAAYAgAAAAAAAeZduPFDZF07WnESn1y2Hb5aFuii/scaNf45QzSgt+bu3lVVIBl87UUf9oup8genqUF3Eg0QR4obLIXL+Qc7xF61nOYrAg9HijqIEGDgCGAECSnCRTAQABgGAAAAAAAAhYGC0epF8akGzJsyyFQYqmTvij2IEGQACGAECSnDBN4QABgGAAAAAAAB5aF/pCPUrnxr72f22c7Etq1fxmcoLzsbz/NjVfOJBsz+Qn64d9M4iT7npETTm9HQhAz988Pvi76s+ve5dCE6Tqt56ju4EGcgCGAECSnChTAQABgGAAAAAAABFl2sjR4xPS9KnK5LQZc8nnqGzP5Xfrg25VWgksPzEJ28UPjGVIo8GBBqQAhgBAkpwsUeEAAYBgAAAAAAAUWhf6MTe6/KHTJyxohkVcd9TVNQBszXnBbaq3JVoahlyDubS46cZdUcoaoKPBgQbWAIYAQJKcKFMBAAGAYAAAAAAAFlgZFYxx3kDgTVm1RBQgcMmuq6GgwABszXqJZrC9tgEHJeQkCTGDbWbfEoCjx4EHCACGAECSnCxQgQABgGAAAAAAABtl9/xBV011RUmRYtORVaAWWapNAKwH3PsYXYhsyaCfcQTEnZ/0jDR0risa2rD/vV4go8iBBzoAhgBAkpwwUwEAAYBgAAAAAAAYWfsNqIcCvmDKH17XQ87Num785mA1SXoAWxN+T2uwFGUA1tURru/zIvSqklGldUQHLiCjyYEHbACGAECSnCRR4QABgGAAAAAAABVX8HX/KaMQqfRoMn9IZsTfkOcGkwBmvCSBQ1m80QxGKsRhZEgfiWFWuWdWN20snH/LrgCjwoEHngCGAECSnCxTAQABgGAAAAAAABlZ+yvM/4LQM5vQprrCmpwOTCB0LQGk4cUAZrwdLKFc27BP3eacOUHNTbfAAKP+gQfQAIYAwJKcKE3hAAGAYAAAAAAALFn7MEhVhm8aJNfM5ep+dXuabHWBDt/3VI8BDKEstvmdb1R9GoABijdoLzdAaPNEV7uo222N3xbzOr8Y2TghuRFuEDrRj/IW2u/KXEg/6nqEku3ioo5XPh0b3HoyKQh721VTD7lgWvAAo8CBCAIAhgBAkpwkUwEAAYBgAAAAAAAUWBg0RsYHCULXaVNW9jBIMVJHBQxszX2Lvdqdn337B1SR03OdwKJ5rsAAo6iBCDQAhgBAkpwsUeEAAYBgAAAAAAAGZdff30MAWxNye15yGhaQ+RCAo76BCGYAhgBAkpwcUwEAAYBgAAAAAAARZfFfjfjJSSbUngtqFVuAVABs4I0Nj1Mnp/wVeZlChduh7CWivUTiaKPDgQiYAIYAQJKcKFCBAAGAYAAAAAAAFmX3+VIOuQ11UyjwvJOzFQuwV2zk9QBaC2DQchyjBvmFcSGOVw6cmjhqRSsKgKO0gQjKAIYAQJKcKFMBAAGAYAAAAAAAD2Xb0G7i9W2sDGlaMWPlMGxYjoc2NRz5+zGQiTnAAKO/gQj8AIYAQJKcJFHhAAGAYAAAAAAAFGX3WdUIySVHi9HOov901aYKn12AWxYmrGa2IiXTeOgGfbwtgwiEzOqwo8eBCS4AhgBAkpwoUwEAAYBgAAAAAAAYZff5iADChij0l3EyI2eRyxUCTz98xc9AX1qDE5nbswjODbhB4GCXVjd+2zaDSHrAAKPmgQlgAIYAQJKcIE3hAAGAYAAAAAAAKGX957CUbUWmtY9BfpUpCmvGOPBJphFPXcYjqNmGoTfJoGKaP1LhmoBu0cUwhtB+B3DalSToRDB9wmdx0NXb8XV8fjUBDf0+12jw+XY6Zmi8o7KBCZIAhgBAkpwsUwEAAYBgAAAAAAAQZdu5rhAOmcZ5uYiLK1YorGxlEr7a1AG+ly6sSKPqgQnEAIYAwJKcLE3hAAGAIAAAAAAAMGX+q2NazChuYse4XWyCgO5kA97ecYphujh8O6iti21MFo/WFT8iRSqP/KOpEvMwKGxdFWWe9+kmf7f4DXUbz5sB7UQt5CtGwnb5DyHmbsyHAOaPEKOmgQn2AIYAQJKcIFMBAAGAYAAAAAAAB1gUvwBG+o5sZPBydI3y/ICju4EKKACGAECSnChQgQABgGAAAAAAABJl27JjCbhmeERhniTE9o3UoQBsZO7gVi3DEaWL85fw2W/wC8AAo7OBCloAhgBAkpwkUwEAAYBgAAAAAAAQZduOsBQb8aIO+bDbfueaAGxlD3Shy8o7XC+FWxCjuYEKjACGAECSnChR4QABgGAAAAAAABVl2xYERPJ5l6QZZizMGAZkWLFffwBsWdU9HFAzHAZwpGKQAKO7gQq+AIYAQJKcIFMBAAGAYAAAAAAADmXb4p8914Z/KLPKqTAAbGMlqlsdxSGiqg1NzvnklewEEhiwjDCj34EK8ACGAECSnCRN4QABgGAAAAAAAC5mXRb7KXK4N2m53OO3YUZBrVEWIXnb91zeBAXM7oPFTvFArfVLVoaqcTHH+g4AbFzgGLBJsjEaJ7mDlNZHVwaaQLlBcdqGI5Meo7OBCyIAhgBAkpwUUwEAAYBgAAAAAAAMZff5hHNYagOlI1kIWguZnId7G06GnaIa7LyIpzCjyIELVACGAECSnERR4QABgGAAAAAAABhl27nzgHgRAvtUMiKcZM7W7UEYacULqBBs3XicS+0c8boL24NYqIBjkFnqCQRI5SjAAKO2gQuGAIYAQJKcIFMBAAGAYAAAAAAADWX8VivBUrHAmVfHkoBalDtvzPVmt+lqJh9zJPI978AAHFO7a5G7j7OBALeK94EB8YIBt/CBAw==";

/**
 * One example: the facade, what it shows, and, for the two that would load another site's player, a status line of its own under it.
 * The line is always there, two lines tall, so the press neither moves the page nor leaves the message a screen away from its card.
 */
function Example({ caption, held, children }: { caption: string; held?: string | null; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      {children}
      <p className="text-xs text-muted-foreground">{caption}</p>
      {held === undefined ? null : (
        <p role="status" className="-mt-1 min-h-8 text-xs text-foreground">
          {held}
        </p>
      )}
    </div>
  );
}

type Card = "youtube" | "vimeo" | "short";

export default function Demo(): React.JSX.Element {
  // This preview may not load another site's player, so the embeds hold back and say what would have happened. In your app the player simply takes the poster's place.
  const [pressed, setPressed] = useState<Partial<Record<Card, true>>>({});
  const hold = (card: Card) => (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setPressed((now) => ({ ...now, [card]: true }));
  };
  const said = (card: Card, provider: string) => (pressed[card] ? `${provider} would start here. This preview loads no outside players, so the poster stays.` : null);
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-2">
      <Example caption="The whole poster is one button: picture, play, title and length." held={said("youtube", "YouTube")}>
        <VideoFacade provider="youtube" videoId="M7lc1UVf-VE" poster={DUNES} title="Inside the Dune House: a day from first light" duration={252} onActivate={hold("youtube")} />
      </Example>

      <Example caption="No poster, or one that fails to load: a calm block that carries the title." held={said("vimeo", "Vimeo")}>
        <VideoFacade provider="vimeo" videoId="76979871" title="The Alfama sessions, part three" duration="24:45" onActivate={hold("vimeo")} />
      </Example>

      <Example caption="Your own file: the press swaps in a video element, plays it and moves focus to it.">
        <VideoFacade src={CLIP} poster={DUNES} title="Dunes, a slow morning" duration={3} />
      </Example>

      <Example caption="Any shape: a vertical clip keeps its 9 / 16 frame." held={said("short", "YouTube")}>
        <div className="w-full max-w-[13rem]">
          <VideoFacade provider="youtube" videoId="M7lc1UVf-VE" aspect={9 / 16} poster={HARBOUR} title="Leaving Split" duration={58} onActivate={hold("short")} />
        </div>
      </Example>
    </div>
  );
}
